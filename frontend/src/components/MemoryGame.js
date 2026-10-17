import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { isLevelLocked, recordSession, recordTask } from '../lib/progress';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import { sfxBoop, sfxPick, sfxPlace, sfxTada, sfxWhoosh } from '../lib/sfx';
import './MemoryGame.css';

const ACTIVITIES = ['PAIRS', 'MISSING', 'SEQUENCE'];
const ACTIVITY_ICON = { PAIRS: 'cards', MISSING: 'thinking', SEQUENCE: 'paw' };
// A pairs board takes longer than one question, so its session is shorter.
const SESSION_SIZE = { PAIRS: 3, MISSING: 5, SEQUENCE: 5 };

const PAIRS_BY_LEVEL = [0, 3, 4, 6];
const MISSING_ITEMS_BY_LEVEL = [0, 3, 4, 5];
const MISSING_CHOICES_BY_LEVEL = [0, 2, 3, 3];
const SEQUENCE_PADS_BY_LEVEL = [0, 3, 4, 4];
const SEQUENCE_LENGTH_BY_LEVEL = [0, 2, 3, 4];
const SEQUENCE_ANIMALS = ['cat', 'dog', 'cow', 'duck', 'frog', 'bird', 'horse', 'mouse', 'fish', 'rabbit', 'bear', 'lion'];
// [ring, ring shadow, glow] — precomputed so old tablet browsers without color-mix() still work
const PAD_COLORS = [
  ['#ff5e7e', '#c73d5d', 'rgba(255, 94, 126, 0.55)'],
  ['#3a8bff', '#2160c4', 'rgba(58, 139, 255, 0.55)'],
  ['#ffaa2b', '#c97f0c', 'rgba(255, 170, 43, 0.55)'],
  ['#1fb583', '#128660', 'rgba(31, 181, 131, 0.55)']
];
const SHOW_STEP_MS = 950;
// The catalog starts with everyday objects and animals; later words (teacher, notebook) are too abstract here.
const MEMORY_VOCABULARY_SIZE = 48;

const TEXT = {
  EN: {
    pairs: 'Find the matching pictures', pairsDone: 'All pairs found!',
    look: 'Look and remember', ready: 'Ready!', hide: 'Closing my eyes…', ask: 'What is missing?',
    watch: 'Watch and listen', yourTurn: 'Your turn!', again: 'Watch again', tryAgain: 'Try again',
    sessionDone: 'Hooray! What a memory!', next: 'Next', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!']
  },
  RU: {
    pairs: 'Найди одинаковые картинки', pairsDone: 'Все пары найдены!',
    look: 'Посмотри и запомни', ready: 'Готово!', hide: 'Закрываю глазки…', ask: 'Что исчезло?',
    watch: 'Смотри и слушай', yourTurn: 'Теперь ты!', again: 'Смотри ещё раз', tryAgain: 'Попробуй ещё',
    sessionDone: 'Ура! Какая память!', next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!']
  },
  KG: {
    pairs: 'Окшош сүрөттөрдү тап', pairsDone: 'Бардык жуптар табылды!',
    look: 'Карап, эсиңде сакта', ready: 'Даяр!', hide: 'Көзүмдү жумам…', ask: 'Эмне жок болду?',
    watch: 'Карап, ук', yourTurn: 'Эми сен!', again: 'Дагы бир кара', tryAgain: 'Дагы аракет кыл',
    sessionDone: 'Ура! Эс тутумуң мыкты!', next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!']
  },
  UZ: {
    pairs: 'Bir xil rasmlarni top', pairsDone: 'Hamma juftlar topildi!',
    look: 'Qarab, eslab qol', ready: 'Tayyor!', hide: 'Ko‘zimni yumaman…', ask: 'Nima yo‘qoldi?',
    watch: 'Qara va tingla', yourTurn: 'Endi sen!', again: 'Yana bir qara', tryAgain: 'Yana urinib ko‘r',
    sessionDone: 'Ura! Xotirang zo‘r!', next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga',
    praise: ['Barakalla!', 'Zo‘r!', 'Ajoyib!', 'Ofarin!', 'Qoyil!']
  }
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const levelStorageKey = (userKey, activity) => `ll_memory_level_${userKey}_${activity}`;
const readLevel = (key) => {
  try {
    const value = Number(localStorage.getItem(key));
    return value >= 1 && value <= 3 ? value : 1;
  } catch {
    return 1;
  }
};
const writeLevel = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // keep in memory only
  }
};

export const buildMemoryTask = (activity, level, vocabulary, previous) => {
  const pool = vocabulary.filter((item) => item.image);
  if (activity === 'PAIRS') {
    const chosen = shuffle(pool).slice(0, PAIRS_BY_LEVEL[level]);
    const cards = shuffle(chosen.flatMap((item, index) => [
      { id: `c${index}a`, ...item },
      { id: `c${index}b`, ...item }
    ]));
    return { activity, cards };
  }

  if (activity === 'MISSING') {
    const mixed = shuffle(pool);
    const items = mixed.slice(0, MISSING_ITEMS_BY_LEVEL[level]);
    const missingIndex = Math.floor(Math.random() * items.length);
    const others = mixed.slice(items.length, items.length + MISSING_CHOICES_BY_LEVEL[level] - 1);
    const choices = shuffle([items[missingIndex], ...others]);
    return { activity, items, missingIndex, answer: items[missingIndex].image, choices };
  }

  const animals = pool.filter((item) => SEQUENCE_ANIMALS.includes(item.image));
  const pads = shuffle(animals.length >= 4 ? animals : pool).slice(0, SEQUENCE_PADS_BY_LEVEL[level]);
  const sequence = [];
  while (sequence.length < SEQUENCE_LENGTH_BY_LEVEL[level]) {
    const index = Math.floor(Math.random() * pads.length);
    if (index !== sequence[sequence.length - 1] || pads.length < 2) sequence.push(index);
  }
  if (previous && previous.sequence?.join() === sequence.join()) sequence.reverse();
  return { activity, pads, sequence, answer: sequence.join(',') };
};

export function MemoryGame({ lang, activity: rawActivity, vocabulary, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const activity = ACTIVITIES.includes(rawActivity) ? rawActivity : 'PAIRS';
  const t = TEXT[lang] || TEXT.RU;
  const sessionSize = SESSION_SIZE[activity];
  const storageKey = levelStorageKey(userKey, activity);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [task, setTask] = useState(null);
  const [taskSeq, setTaskSeq] = useState(0);
  const [status, setStatus] = useState('playing');
  const [phase, setPhase] = useState('');
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [glowId, setGlowId] = useState(null);
  const [removed, setRemoved] = useState([]);
  const [wobble, setWobble] = useState(null);
  const [hint, setHint] = useState(false);
  const [litPad, setLitPad] = useState(null);
  const [inputPos, setInputPos] = useState(0);
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const levelRef = useRef(level);
  levelRef.current = level;
  const mistakesRef = useRef(0);
  const missStreakRef = useRef(0);
  const streakRef = useRef(0);
  const lockRef = useRef(false);
  const timersRef = useRef([]);
  const moodRef = useRef(null);

  const words = useMemo(() => (vocabulary || [])
    .slice(0, MEMORY_VOCABULARY_SIZE)
    .filter((item) => item?.image && item?.text)
    .map((item) => ({ image: item.image, text: String(item.text).replace(/-/g, '').toLowerCase() })), [vocabulary]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const say = useCallback((rawPhrase, mood = 'talking') => {
    if (!rawPhrase) return;
    const phrase = capitalize(rawPhrase);
    setBubble(phrase);
    setIrbiMood(mood);
    speakText?.(phrase, { interrupt: true });
    if (moodRef.current) window.clearTimeout(moodRef.current);
    moodRef.current = window.setTimeout(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
  }, [speakText]);

  const sayWord = useCallback((item) => {
    if (item?.text) speakText?.(item.text, { kind: 'word', rate: 0.85, interrupt: true });
  }, [speakText]);

  useEffect(() => () => {
    clearTimers();
    if (moodRef.current) window.clearTimeout(moodRef.current);
  }, [clearTimers]);

  // Irbi lights the animals one by one, naming each, then it is the child's turn.
  const playSequence = useCallback((item, intro) => {
    lockRef.current = true;
    setPhase('show');
    setInputPos(0);
    say(intro, 'talking');
    item.sequence.forEach((padIndex, step) => {
      later(() => {
        setLitPad(padIndex);
        sayWord(item.pads[padIndex]);
        sfxPick(String(padIndex));
      }, 1500 + step * SHOW_STEP_MS);
      later(() => setLitPad(null), 1500 + step * SHOW_STEP_MS + 650);
    });
    later(() => {
      lockRef.current = false;
      setPhase('input');
      say(t.yourTurn, 'happy');
    }, 1500 + item.sequence.length * SHOW_STEP_MS + 200);
  }, [later, say, sayWord, t.yourTurn]);

  // "What is missing?": objects appear one by one and Irbi names each of them.
  const presentItems = useCallback((item) => {
    setPhase('look');
    say(t.look, 'talking');
    item.items.forEach((entry, index) => {
      later(() => sayWord(entry), 1500 + index * 1000);
    });
    later(() => setPhase('look-ready'), 1500 + item.items.length * 1000);
  }, [later, say, sayWord, t.look]);

  useEffect(() => {
    if (!words.length) return undefined;
    clearTimers();
    const next = buildMemoryTask(activity, levelRef.current, words, task);
    setTask(next);
    setStatus('playing');
    setFlipped([]);
    setMatched([]);
    setGlowId(null);
    setRemoved([]);
    setHint(false);
    setLitPad(null);
    mistakesRef.current = 0;
    missStreakRef.current = 0;
    lockRef.current = false;
    if (activity === 'PAIRS') {
      setPhase('');
      const id = window.setTimeout(() => say(t.pairs), 350);
      timersRef.current.push(id);
    } else if (activity === 'MISSING') {
      presentItems(next);
    } else {
      playSequence(next, t.watch);
    }
    const toPrefetch = next.cards || next.items || next.pads || [];
    toPrefetch.forEach((item) => prefetchSpeech?.(item.text, { kind: 'word', rate: 0.85 }));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq, activity, words.length]);

  const adaptLevel = (wasClean, wasHard) => {
    recordTask(userKey, `memory:${activity}`, wasClean);
    if (isLevelLocked(userKey)) return;
    let next = levelRef.current;
    if (wasClean) {
      streakRef.current += 1;
      if (streakRef.current >= 2 && next < 3) {
        next += 1;
        streakRef.current = 0;
      }
    } else {
      streakRef.current = 0;
      if (wasHard && next > 1) next -= 1;
    }
    if (next !== levelRef.current) {
      setLevel(next);
      writeLevel(storageKey, next);
    }
  };

  const succeed = (rewardImage, phrase) => {
    setStatus('done');
    setHint(false);
    sfxPlace('memory', true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
    if (phrase) say(phrase, 'happy');
    later(() => say(pick(t.praise), 'cheer'), phrase ? 1700 : 200);
    setSessionWins((prev) => [...prev, rewardImage]);
  };

  // ----- pairs -----
  const flipCard = (card) => {
    if (status !== 'playing' || lockRef.current) return;
    if (matched.includes(card.image) || flipped.includes(card.id)) return;
    sfxPick(card.id);
    sayWord(card);
    setGlowId(null);
    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    const [firstId] = nextFlipped;
    const first = task.cards.find((item) => item.id === firstId);
    lockRef.current = true;
    if (first.image === card.image) {
      missStreakRef.current = 0;
      later(() => {
        const nextMatched = [...matched, card.image];
        setMatched(nextMatched);
        setFlipped([]);
        lockRef.current = false;
        sfxPlace(card.image, false);
        if (nextMatched.length === task.cards.length / 2) {
          const pairs = task.cards.length / 2;
          adaptLevel(mistakesRef.current <= pairs, mistakesRef.current > pairs * 3);
          succeed(card.image, t.pairsDone);
        }
      }, 500);
    } else {
      mistakesRef.current += 1;
      missStreakRef.current += 1;
      later(() => {
        setFlipped([]);
        lockRef.current = false;
        // after three misses in a row, the partner of the last card glows for a moment
        if (missStreakRef.current >= 3) {
          const partner = task.cards.find((item) => item.image === card.image && item.id !== card.id);
          if (partner) {
            setGlowId(partner.id);
            later(() => setGlowId(null), 1800);
          }
          missStreakRef.current = 0;
        }
      }, 1150);
    }
  };

  // ----- what is missing -----
  const hideAndAsk = () => {
    if (phase !== 'look-ready') return;
    sfxWhoosh();
    setPhase('hide');
    say(t.hide, 'thinking');
    later(() => {
      setPhase('guess');
      say(t.ask, 'talking');
    }, 1600);
  };

  const chooseMissing = (choice) => {
    if (status !== 'playing' || phase !== 'guess') return;
    sayWord(choice);
    if (choice.image === task.answer) {
      adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
      succeed(choice.image, `${choice.text}!`);
      return;
    }
    mistakesRef.current += 1;
    sfxBoop();
    setWobble(choice.image);
    later(() => setWobble(null), 500);
    later(() => setRemoved((prev) => [...prev, choice.image]), 450);
    setHint(true);
  };

  // ----- repeat the sequence -----
  const tapPad = (padIndex) => {
    if (status !== 'playing' || phase !== 'input' || lockRef.current) return;
    const pad = task.pads[padIndex];
    sayWord(pad);
    setLitPad(padIndex);
    later(() => setLitPad((current) => (current === padIndex ? null : current)), 400);
    if (task.sequence[inputPos] === padIndex) {
      sfxPick(String(padIndex));
      const nextPos = inputPos + 1;
      setInputPos(nextPos);
      if (nextPos === task.sequence.length) {
        lockRef.current = true;
        adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
        later(() => succeed(pad.image, null), 450);
      }
      return;
    }
    mistakesRef.current += 1;
    sfxBoop();
    setWobble(padIndex);
    later(() => setWobble(null), 500);
    later(() => playSequence(task, t.again), 700);
  };

  const goNext = () => {
    if (sessionWins.length >= sessionSize) {
      setShowSession(true);
      recordSession(userKey, `memory:${activity}`);
      sfxTada();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
      say(t.sessionDone, 'cheer');
      onSessionComplete?.({ activity });
      return;
    }
    setTaskSeq((value) => value + 1);
  };

  const startNewSession = () => {
    setShowSession(false);
    setSessionWins([]);
    setTaskSeq((value) => value + 1);
  };

  const repeatInstruction = () => {
    if (!task) return;
    if (activity === 'PAIRS') say(t.pairs);
    else if (activity === 'MISSING') say(phase === 'guess' ? t.ask : t.look);
    else if (phase === 'input' && status === 'playing') playSequence(task, t.again);
    else say(t.watch);
  };

  const shellProps = {
    className: 'mm',
    stars: sessionWins.length,
    totalStars: sessionSize,
    labels: { home: t.home, listen: t.listen },
    onExit,
    onListen: repeatInstruction,
    bubble,
    irbiMood,
    onIrbiTap: repeatInstruction,
    session: {
      open: showSession,
      title: t.sessionDone,
      pictures: sessionWins.map((image) => pictureUrl(image)),
      moreLabel: t.more,
      menuLabel: t.menu,
      onMore: startNewSession,
      onMenu: onExit
    }
  };

  if (!task) return <GameShell {...shellProps} />;
  const isDone = status === 'done';

  return (
    <GameShell {...shellProps}>
      <GameBoard icon={ACTIVITY_ICON[activity]} className={`mm-board mm-${activity.toLowerCase()}`} data-answer={task.answer || ''}>
        {activity === 'PAIRS' ? (
          <div className={`mm-grid mm-grid-${task.cards.length}`}>
            {task.cards.map((card, index) => {
              const isOpen = flipped.includes(card.id) || matched.includes(card.image);
              return (
                <button
                  key={`${taskSeq}-${card.id}`}
                  type="button"
                  className={`mm-card ${isOpen ? 'is-open' : ''} ${matched.includes(card.image) ? 'is-matched' : ''} ${glowId === card.id ? 'is-glow' : ''} ${isDone ? 'is-dancing' : ''}`}
                  style={{ '--i': index }}
                  onClick={() => flipCard(card)}
                  data-image={card.image}
                  aria-label={isOpen ? card.text : '?'}
                >
                  <span className="mm-card-inner">
                    <span className="mm-card-back"><img src={pictureUrl('paw')} alt="" /></span>
                    <span className="mm-card-front"><img src={pictureUrl(card.image)} alt="" draggable="false" /></span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {activity === 'MISSING' ? (
          <div className={`mm-shelf-items ${phase === 'hide' ? 'is-hiding' : ''}`}>
            {task.items.map((item, index) => {
              const isGap = (phase === 'guess' || isDone) && index === task.missingIndex;
              return (
                <span key={`${taskSeq}-${item.image}`} className={`mm-item ${isGap ? 'is-gap' : ''}`} style={{ '--i': index }}>
                  {isGap && !isDone ? (
                    <span className="mm-gap">
                      {hint ? <img className="mm-silhouette" src={pictureUrl(item.image)} alt="" /> : <span className="mm-gap-mark">?</span>}
                    </span>
                  ) : (
                    <img className={isGap ? 'mm-found' : ''} src={pictureUrl(item.image)} alt="" draggable="false" />
                  )}
                </span>
              );
            })}
            <span className="mm-cloud" aria-hidden="true" />
          </div>
        ) : null}

        {activity === 'SEQUENCE' ? (
          <div className="mm-pads">
            {task.pads.map((pad, index) => (
              <button
                key={`${taskSeq}-${pad.image}`}
                type="button"
                className={`mm-pad ${litPad === index ? 'is-lit' : ''} ${wobble === index ? 'is-wobble' : ''} ${phase === 'input' && !isDone ? 'is-ready' : ''} ${isDone ? 'is-dancing' : ''}`}
                style={{
                  '--pad': PAD_COLORS[index % PAD_COLORS.length][0],
                  '--pad-deep': PAD_COLORS[index % PAD_COLORS.length][1],
                  '--pad-glow': PAD_COLORS[index % PAD_COLORS.length][2],
                  '--i': index
                }}
                onClick={() => tapPad(index)}
                aria-label={pad.text}
              >
                <img src={pictureUrl(pad.image)} alt="" draggable="false" />
              </button>
            ))}
          </div>
        ) : null}

        {activity === 'SEQUENCE' ? (
          <div className="mm-progress" aria-hidden="true">
            {task.sequence.map((_, index) => (
              <i key={index} className={index < inputPos || isDone ? 'is-on' : ''} />
            ))}
          </div>
        ) : null}
      </GameBoard>

      {isDone ? (
        <NextButton onClick={goNext}>{t.next}</NextButton>
      ) : null}

      {!isDone && activity === 'MISSING' && (phase === 'look' || phase === 'look-ready') ? (
        <button type="button" className={`gs-next mm-ready ${phase === 'look' ? 'is-waiting' : ''}`} onClick={hideAndAsk} disabled={phase === 'look'}>
          <img src={pictureUrl('eye')} alt="" />
          {t.ready}
        </button>
      ) : null}

      {!isDone && activity === 'MISSING' && phase === 'guess' ? (
        <section className="gs-shelf mm-choices">
          {task.choices.map((choice, index) => (
            removed.includes(choice.image) ? (
              <span key={`${taskSeq}-${choice.image}`} className="mm-choice-spot" />
            ) : (
              <button
                key={`${taskSeq}-${choice.image}`}
                type="button"
                className={`mm-choice ${wobble === choice.image ? 'is-wobble' : ''}`}
                style={{ '--i': index }}
                onClick={() => chooseMissing(choice)}
                data-image={choice.image}
                aria-label={choice.text}
              >
                <img src={pictureUrl(choice.image)} alt="" draggable="false" />
              </button>
            )
          ))}
        </section>
      ) : null}
    </GameShell>
  );
}

// Everything the memory games can say in `lang`, for the offline voice pack.
export const voicePhrases = (lang, { words = [] } = {}) => {
  const out = textPhrases(TEXT[lang] || TEXT.RU, LABEL_KEYS);
  words.slice(0, MEMORY_VOCABULARY_SIZE).forEach((item) => {
    if (!item?.image || !item?.text) return;
    const text = String(item.text).replace(/-/g, '').toLowerCase();
    out.push(wordPhrase(text, { kind: 'word', rate: 0.85 }), sayPhrase(`${text}!`));
  });
  return out;
};
