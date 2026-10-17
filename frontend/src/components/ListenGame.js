import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { getLetterName } from '../lib/letters';
import { isLevelLocked, recordSession, recordTask } from '../lib/progress';
import { sfxBoop, sfxClap, sfxNote, sfxPlace, sfxTada } from '../lib/sfx';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import { approvedSyllables } from '../data/approvedSyllables';
import './ListenGame.css';

// Listening games: clap the syllables, find the rhyme, find the word you hear, find the first sound.
const ACTIVITIES = ['CLAP', 'RHYME', 'GUESS', 'FIRST'];
const ACTIVITY_ICON = { CLAP: 'clap', RHYME: 'music', GUESS: 'ear', FIRST: 'magnifier' };
const SESSION_SIZE = 5;
const CHOICES_BY_LEVEL = [0, 2, 3, 4];
// concrete everyday words come first in the catalog
const VOCABULARY_SIZE = 60;
const CLAP_WAIT_MS = 1400;
const CLAP_BEAT_MS = 800;
const AS_WORD = { kind: 'word', rate: 0.85 };
// shared with the speech games, so both use the same cached voice
const CLAP_WORD = { kind: 'word', rate: 0.8 };
const CLAP_SYLLABLE = { kind: 'syllable', rate: 0.8 };

// Rhyming pairs drawn only from the 3D pictures, so every word can be shown.
const RHYMES = {
  RU: [
    [['spoon', 'ложка'], ['cat', 'кошка']], [['rabbit', 'зайка'], ['shirt', 'майка']], [['goat', 'коза'], ['thunder', 'гроза']],
    [['owl', 'сова'], ['grass', 'трава']], [['moon', 'луна'], ['wave', 'волна']], [['banana', 'банан'], ['sofa', 'диван']],
    [['pie', 'пирог'], ['boot', 'сапог']], [['squirrel', 'белка'], ['plate', 'тарелка']], [['elephant', 'слон'], ['telephone', 'телефон']]
  ],
  EN: [
    [['cat', 'cat'], ['hat', 'hat']], [['bee', 'bee'], ['tree', 'tree']], [['moon', 'moon'], ['spoon', 'spoon']],
    [['star', 'star'], ['car', 'car']], [['fish', 'fish'], ['plate', 'dish']], [['bear', 'bear'], ['chair', 'chair']],
    [['goat', 'goat'], ['boat', 'boat']], [['mouse', 'mouse'], ['house', 'house']], [['frog', 'frog'], ['dog', 'dog']],
    [['sock', 'sock'], ['clock', 'clock']]
  ],
  KG: [
    [['horse', 'ат'], ['letter', 'кат']], [['moon', 'ай'], ['tea', 'чай']], [['sheep', 'кой'], ['party', 'той']],
    [['spoon', 'кашык'], ['cat', 'мышык']], [['star', 'жылдыз'], ['girl', 'кыз']]
  ],
  UZ: [
    [['moon', 'oy'], ['tea', 'choy']], [['sheep', 'qo‘y'], ['party', 'to‘y']], [['mountain', 'tog‘'], ['garden', 'bog‘']],
    [['autumn', 'kuz'], ['star', 'yulduz']]
  ]
};

const TEXT = {
  EN: {
    clap: 'Listen to the word and clap each part', clapTurn: 'Clap!', clapTogether: 'Let’s clap together',
    rhyme: 'What rhymes with {word}?', guess: 'Where is the {word}?', first: 'What starts with {letter}?',
    lookAgain: 'Listen again', sessionDone: 'Hooray! Great listening!',
    next: 'Next', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home', clapButton: 'Clap',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!']
  },
  RU: {
    clap: 'Послушай слово и похлопай по слогам', clapTurn: 'Хлопай!', clapTogether: 'Давай похлопаем вместе',
    rhyme: 'Что звучит похоже: {word}?', guess: 'Где {word}?', first: 'Что начинается на {letter}?',
    lookAgain: 'Послушай ещё раз', sessionDone: 'Ура! Ты отлично слушаешь!',
    next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой', clapButton: 'Хлопнуть',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!']
  },
  KG: {
    clap: 'Сөздү ук да, муун боюнча чап', clapTurn: 'Чап!', clapTogether: 'Келчи, чогуу чабалы',
    rhyme: 'Кайсы сөз окшош угулат: {word}?', guess: '{word} кайда?', first: '{letter} тамгасынан эмне башталат?',
    lookAgain: 'Дагы бир ук', sessionDone: 'Ура! Сен абдан жакшы угасың!',
    next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө', clapButton: 'Чабуу',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!']
  },
  UZ: {
    clap: 'So‘zni tingla va bo‘g‘inlab qarsak chal', clapTurn: 'Qarsak chal!', clapTogether: 'Kel, birga qarsak chalamiz',
    rhyme: 'Qaysi so‘z ohangdosh: {word}?', guess: '{word} qayerda?', first: '{letter} harfidan nima boshlanadi?',
    lookAgain: 'Yana bir tingla', sessionDone: 'Ura! Sen juda yaxshi tinglaysan!',
    next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga', clapButton: 'Qarsak',
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

const levelStorageKey = (userKey, activity) => `ll_listen_level_${userKey}_${activity}`;
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

const imageKeyFromPath = (path) => {
  const match = /\/images\/([^/]+)\.webp$/.exec(String(path || ''));
  return match ? match[1] : null;
};

export const spokenWord = (text) => String(text || '').replace(/-/g, '').toLowerCase();

// Catalog words shaped for listening: picture, spoken word and first letter.
const toWords = (vocabulary) => (vocabulary || [])
  .slice(0, VOCABULARY_SIZE)
  .filter((item) => item?.image && item?.text)
  .map((item) => ({
    image: item.image,
    word: spokenWord(item.text),
    first: (item.units?.[0] || String(item.text).charAt(0)).toUpperCase()
  }));

const clapWords = (lang) => (approvedSyllables[lang] || approvedSyllables.RU)
  .map((entry) => ({ image: imageKeyFromPath(entry.img), units: entry.units }))
  .filter((entry) => entry.image && entry.units?.length >= 2);

export const buildListenTask = (activity, level, lang, vocabulary, recent = []) => {
  const choiceCount = CHOICES_BY_LEVEL[level];
  const fresh = (items, key) => {
    const unused = items.filter((item) => !recent.includes(key(item)));
    return unused.length ? unused : items;
  };

  if (activity === 'CLAP') {
    const all = clapWords(lang);
    const fits = {
      1: (entry) => entry.units.length === 2,
      2: (entry) => entry.units.length <= 3,
      3: (entry) => entry.units.length >= 3
    }[level];
    const pool = all.filter(fits).length ? all.filter(fits) : all;
    const item = pick(fresh(pool, (entry) => entry.image));
    return { activity, image: item.image, units: item.units, word: item.units.join('').toLowerCase(), answer: String(item.units.length) };
  }

  if (activity === 'RHYME') {
    const pairs = RHYMES[lang] || RHYMES.RU;
    const [prompt, rhyme] = shuffle(pick(fresh(pairs, (pair) => pair[0][0])));
    const others = shuffle(pairs.filter((pair) => !pair.some(([image]) => image === prompt[0])).flat())
      .filter(([image]) => image !== rhyme[0]);
    const choices = shuffle([rhyme, ...others.slice(0, choiceCount - 1)]).map(([image, word]) => ({ image, word }));
    return { activity, image: prompt[0], word: prompt[1], rhyme: rhyme[1], answer: rhyme[0], choices, key: prompt[0] };
  }

  const words = toWords(vocabulary);
  if (activity === 'FIRST') {
    const target = pick(fresh(words, (item) => item.image));
    const others = shuffle(words.filter((item) => item.first !== target.first));
    const choices = shuffle([target, ...others.slice(0, choiceCount - 1)]);
    return { activity, letter: target.first, image: target.image, word: target.word, answer: target.image, choices, key: target.image };
  }

  const target = pick(fresh(words, (item) => item.image));
  const others = shuffle(words.filter((item) => item.image !== target.image && item.word !== target.word));
  const choices = shuffle([target, ...others.slice(0, choiceCount - 1)]);
  return { activity: 'GUESS', image: target.image, word: target.word, answer: target.image, choices, key: target.image };
};

export function ListenGame({ lang, activity: rawActivity, vocabulary, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const activity = ACTIVITIES.includes(rawActivity) ? rawActivity : 'GUESS';
  const t = TEXT[lang] || TEXT.RU;
  const storageKey = levelStorageKey(userKey, activity);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [task, setTask] = useState(null);
  const [taskSeq, setTaskSeq] = useState(0);
  const [status, setStatus] = useState('playing');
  const [phase, setPhase] = useState('');
  const [faded, setFaded] = useState([]);
  const [wobble, setWobble] = useState(null);
  const [hint, setHint] = useState(false);
  const [claps, setClaps] = useState(0);
  const [beat, setBeat] = useState(null);
  const [clapPulse, setClapPulse] = useState(0);
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const levelRef = useRef(level);
  levelRef.current = level;
  const recentRef = useRef([]);
  const mistakesRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const moodRef = useRef(null);
  const clapTimerRef = useRef(null);
  const clapsRef = useRef(0);

  const words = useMemo(() => vocabulary || [], [vocabulary]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (clapTimerRef.current) window.clearTimeout(clapTimerRef.current);
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

  const sayWord = useCallback((word, options = AS_WORD) => {
    if (word) speakText?.(word, { ...options, interrupt: true });
  }, [speakText]);

  useEffect(() => () => {
    clearTimers();
    if (moodRef.current) window.clearTimeout(moodRef.current);
  }, [clearTimers]);

  const prompt = useCallback((item) => {
    if (!item) return '';
    if (item.activity === 'CLAP') return t.clap;
    if (item.activity === 'RHYME') return t.rhyme.replace('{word}', item.word);
    if (item.activity === 'FIRST') return t.first.replace('{letter}', getLetterName(lang, item.letter));
    return t.guess.replace('{word}', item.word);
  }, [lang, t]);

  // Irbi claps the word out: each syllable lights up with a clap.
  const clapAlong = useCallback((item, startMs, then) => {
    item.units.forEach((unit, index) => {
      later(() => {
        setBeat(index);
        setClapPulse((value) => value + 1);
        sfxClap();
        sayWord(unit.toLowerCase(), CLAP_SYLLABLE);
      }, startMs + index * CLAP_BEAT_MS);
    });
    later(() => {
      setBeat(null);
      then?.();
    }, startMs + item.units.length * CLAP_BEAT_MS + 300);
  }, [later, sayWord]);

  const startClapTurn = useCallback(() => {
    clapsRef.current = 0;
    setClaps(0);
    setPhase('clap');
    say(t.clapTurn, 'happy');
  }, [say, t.clapTurn]);

  useEffect(() => {
    clearTimers();
    const next = buildListenTask(activity, levelRef.current, lang, words, recentRef.current);
    recentRef.current = [next.key || next.image, ...recentRef.current].slice(0, 6);
    setTask(next);
    setStatus('playing');
    setFaded([]);
    setHint(false);
    setBeat(null);
    clapsRef.current = 0;
    setClaps(0);
    mistakesRef.current = 0;
    if (activity === 'CLAP') {
      setPhase('model');
      say(t.clap, 'talking');
      later(() => sayWord(next.word, CLAP_WORD), 2200);
      // at the first level Irbi claps it first, so the child can copy
      if (levelRef.current === 1) clapAlong(next, 3600, startClapTurn);
      else later(startClapTurn, 3600);
      prefetchSpeech?.(next.word, CLAP_WORD);
      next.units.forEach((unit) => prefetchSpeech?.(unit.toLowerCase(), CLAP_SYLLABLE));
    } else {
      setPhase('choose');
      later(() => say(prompt(next)), 350);
      (next.choices || []).forEach((choice) => prefetchSpeech?.(choice.word, AS_WORD));
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq, activity]);

  const adaptLevel = (wasClean, wasHard) => {
    recordTask(userKey, `listen:${activity}`, wasClean);
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
    setPhase('done');
    setHint(false);
    sfxPlace('listen', true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
    if (phrase) say(phrase, 'happy');
    later(() => say(pick(t.praise), 'cheer'), 1900);
    setSessionWins((prev) => [...prev, rewardImage]);
  };

  // ----- picture choices -----
  const choose = (choice) => {
    if (status !== 'playing' || faded.includes(choice.image)) return;
    if (choice.image === task.answer) {
      adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
      const phrase = task.activity === 'RHYME'
        ? `${capitalize(task.word)} — ${task.rhyme}!`
        : `${capitalize(choice.word)}!`;
      succeed(choice.image, phrase);
      return;
    }
    mistakesRef.current += 1;
    sfxBoop();
    sayWord(choice.word);
    setWobble(choice.image);
    later(() => setWobble(null), 500);
    later(() => setFaded((prev) => [...prev, choice.image]), 450);
    if (mistakesRef.current >= 2) setHint(true);
  };

  // ----- clapping -----
  const finishClaps = () => {
    const count = clapsRef.current;
    if (count === task.units.length) {
      adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
      setPhase('done');
      later(() => sayWord(`${task.units.map((unit) => unit.toLowerCase()).join(', ')}. ${task.word}!`, CLAP_WORD), 100);
      later(() => succeed(task.image, null), 1500);
      return;
    }
    mistakesRef.current += 1;
    setPhase('model');
    say(t.clapTogether, 'talking');
    // after a second try Irbi claps it with the child and the task counts as done
    if (mistakesRef.current >= 2) {
      clapAlong(task, 1600, () => {
        adaptLevel(false, true);
        clapsRef.current = task.units.length;
        setClaps(task.units.length);
        succeed(task.image, null);
      });
      return;
    }
    clapAlong(task, 1600, startClapTurn);
  };

  const clap = () => {
    if (status !== 'playing' || phase !== 'clap') return;
    sfxClap();
    sfxNote(clapsRef.current * 2);
    clapsRef.current += 1;
    setClaps(clapsRef.current);
    setClapPulse((value) => value + 1);
    if (clapTimerRef.current) window.clearTimeout(clapTimerRef.current);
    // a pause after the last clap means the child has finished
    clapTimerRef.current = window.setTimeout(finishClaps, CLAP_WAIT_MS);
  };

  const goNext = () => {
    if (sessionWins.length >= SESSION_SIZE) {
      setShowSession(true);
      recordSession(userKey, `listen:${activity}`);
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
    if (task.activity === 'CLAP') {
      if (phase !== 'clap' || status !== 'playing') return;
      say(t.clap);
      later(() => sayWord(task.word, CLAP_WORD), 2200);
      return;
    }
    say(prompt(task));
  };

  const shellProps = {
    className: 'ls',
    stars: sessionWins.length,
    totalStars: SESSION_SIZE,
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
  const showSlots = task.activity === 'CLAP' && (levelRef.current === 1 || phase === 'model' || isDone);

  return (
    <GameShell {...shellProps}>
      <GameBoard icon={ACTIVITY_ICON[activity]} className={`ls-board ls-${activity.toLowerCase()}`} data-answer={task.answer} data-phase={phase}>
        {task.activity === 'CLAP' ? (
          <>
            <button type="button" className={`ls-picture ${isDone ? 'is-dancing' : ''}`} onClick={() => sayWord(task.word, CLAP_WORD)} aria-label={task.word}>
              <img src={pictureUrl(task.image)} alt="" draggable="false" />
            </button>
            <div className="ls-beats">
              {(showSlots ? task.units : Array.from({ length: claps })).map((unit, index) => {
                const isOn = isDone || index < claps || beat === index || (phase === 'model' && beat !== null && index < beat);
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={index} className={`ls-beat ${isOn ? 'is-on' : ''} ${beat === index ? 'is-beat' : ''}`} style={{ '--i': index }}>
                    {isDone || beat === index ? unit : ''}
                  </span>
                );
              })}
              {!showSlots && claps === 0 ? <span className="ls-beat ls-beat-ghost">?</span> : null}
            </div>
          </>
        ) : (
          <div className="ls-prompt">
            {task.activity === 'GUESS' ? (
              <button type="button" className="ls-ear" onClick={() => sayWord(task.word)} aria-label={t.listen}>
                <img src={pictureUrl('ear')} alt="" />
              </button>
            ) : null}
            {task.activity === 'FIRST' ? (
              <button type="button" className="ls-letter" onClick={() => say(prompt(task))} aria-label={task.letter}>{task.letter}</button>
            ) : null}
            {task.activity === 'RHYME' ? (
              <button type="button" className="ls-picture ls-picture-small" onClick={() => sayWord(task.word)} aria-label={task.word}>
                <img src={pictureUrl(task.image)} alt="" draggable="false" />
                <span className="ls-picture-word">{task.word}</span>
              </button>
            ) : null}
            {task.activity === 'RHYME' && isDone ? (
              <>
                <span className="ls-rhyme-sign" aria-hidden="true">~</span>
                <span className="ls-picture ls-picture-small ls-picture-pair">
                  <img src={pictureUrl(task.answer)} alt="" draggable="false" />
                  <span className="ls-picture-word">{task.rhyme}</span>
                </span>
              </>
            ) : null}
          </div>
        )}
      </GameBoard>

      {isDone ? <NextButton onClick={goNext}>{t.next}</NextButton> : null}

      {!isDone && task.activity === 'CLAP' ? (
        <button
          type="button"
          key={clapPulse}
          className={`ls-clapper ${phase === 'clap' ? 'is-ready' : ''} ${clapPulse ? 'is-pulse' : ''}`}
          onClick={clap}
          disabled={phase !== 'clap'}
          aria-label={t.clapButton}
        >
          <img src={pictureUrl('clap')} alt="" draggable="false" />
        </button>
      ) : null}

      {!isDone && task.choices ? (
        <section className="gs-shelf ls-choices">
          {task.choices.map((choice, index) => (
            <button
              key={`${taskSeq}-${choice.image}`}
              type="button"
              className={`ls-choice ${faded.includes(choice.image) ? 'is-faded' : ''} ${wobble === choice.image ? 'is-wobble' : ''} ${hint && choice.image === task.answer ? 'is-hint' : ''}`}
              style={{ '--i': index }}
              onClick={() => choose(choice)}
              data-image={choice.image}
              aria-label={choice.word}
            >
              <img src={pictureUrl(choice.image)} alt="" draggable="false" />
            </button>
          ))}
        </section>
      ) : null}
    </GameShell>
  );
}

// Everything the listening games can say in `lang`, for the offline voice pack.
export const voicePhrases = (lang, { words = [] } = {}) => {
  const t = TEXT[lang] || TEXT.RU;
  const out = textPhrases(t, [...LABEL_KEYS, 'clapButton']);
  toWords(words).forEach((item) => {
    out.push(
      wordPhrase(item.word, AS_WORD),
      sayPhrase(`${item.word}!`),
      sayPhrase(t.guess.replace('{word}', item.word)),
      sayPhrase(t.first.replace('{letter}', getLetterName(lang, item.first)))
    );
  });
  (RHYMES[lang] || []).forEach(([[, a], [, b]]) => {
    out.push(
      wordPhrase(a, AS_WORD), wordPhrase(b, AS_WORD),
      sayPhrase(t.rhyme.replace('{word}', a)), sayPhrase(t.rhyme.replace('{word}', b)),
      sayPhrase(`${a} — ${b}!`), sayPhrase(`${b} — ${a}!`)
    );
  });
  clapWords(lang).forEach((entry) => {
    const word = entry.units.join('').toLowerCase();
    out.push(wordPhrase(word, CLAP_WORD), wordPhrase(`${entry.units.map((unit) => unit.toLowerCase()).join(', ')}. ${word}!`, CLAP_WORD));
    entry.units.forEach((unit) => out.push(wordPhrase(unit.toLowerCase(), CLAP_SYLLABLE)));
  });
  return out;
};
