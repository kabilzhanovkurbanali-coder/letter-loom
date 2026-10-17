import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { isLevelLocked, recordSession, recordTask } from '../lib/progress';
import { sfxNote, sfxPlace, sfxTada, sfxWhoosh } from '../lib/sfx';
import { createBlowDetector, createSpeechDetector, isMicSupported, openVoiceMeter } from '../lib/voiceMeter';
import { approvedSyllables } from '../data/approvedSyllables';
import './SpeakGame.css';

const ACTIVITIES = ['ECHO', 'SYLLABLES', 'BLOW'];
const ACTIVITY_ICON = { ECHO: 'speaking', SYLLABLES: 'microphone', BLOW: 'candle' };
// blowing is tiring, so a candle session is short
const SESSION_SIZE = { ECHO: 5, SYLLABLES: 5, BLOW: 3 };
const CANDLES_BY_LEVEL = [0, 2, 3, 4];
const BLOW_MS_BY_LEVEL = [0, 300, 400, 500];
const BLOW_LISTEN_MS = 15000;
const TICK_MS = 50;
const SYLLABLE_BEAT_MS = 950;
const CAKE_COLORS = [
  ['#ffd1e1', '#ff8fb5', '#e0638f'],
  ['#d6ecff', '#8cc2ff', '#4f8fe0'],
  ['#fff1c2', '#ffd36b', '#e0a52c'],
  ['#dcf8e8', '#86e0b0', '#3fb07a']
];

// Sounds that need no reading: animals, toys and the doctor's "a-a-a".
const ECHO_ITEMS = [
  { image: 'cow', units: { EN: ['MOO'], RU: ['МУ-У'], KG: ['МӨӨ'], UZ: ['MU-U'] } },
  { image: 'cat', units: { EN: ['MEOW'], RU: ['МЯУ'], KG: ['МЯУ'], UZ: ['MIYOV'] } },
  { image: 'wolf', units: { EN: ['AWOO'], RU: ['У-У-У'], KG: ['У-У-У'], UZ: ['U-U-U'] } },
  { image: 'doctor', units: { EN: ['AAH'], RU: ['А-А-А'], KG: ['А-А-А'], UZ: ['A-A-A'] } },
  { image: 'dog', units: { EN: ['WOOF', 'WOOF'], RU: ['ГАВ', 'ГАВ'], KG: ['АВ', 'АВ'], UZ: ['VOV', 'VOV'] } },
  { image: 'car', units: { EN: ['BEEP', 'BEEP'], RU: ['БИ', 'БИ'], KG: ['БИП', 'БИП'], UZ: ['BIP', 'BIP'] } },
  { image: 'train', units: { EN: ['CHOO', 'CHOO'], RU: ['ТУ', 'ТУ'], KG: ['ТУ', 'ТУ'], UZ: ['TU', 'TU'] } },
  { image: 'clock', units: { EN: ['TICK', 'TOCK'], RU: ['ТИК', 'ТАК'], KG: ['ТИК', 'ТАК'], UZ: ['TIK', 'TAK'] } },
  { image: 'drum', units: { EN: ['BOOM', 'BOOM'], RU: ['БУМ', 'БУМ'], KG: ['БУМ', 'БУМ'], UZ: ['BUM', 'BUM'] } }
];

const TEXT = {
  EN: {
    echo: 'Listen and repeat', syllables: 'Listen', blow: 'Blow out the candles! Really hard!',
    echoTurn: 'Your turn! Tap and say it', syllablesTurn: 'Your turn! Tap and say it part by part', blowTurn: 'Tap the microphone and blow!',
    listening: 'I’m listening…', blowing: 'Blow, blow!', louder: 'Let’s try again, a bit louder!', together: 'Let’s say it together:',
    blowMore: 'One more time! Blow harder!', blowDone: 'All the candles are out!',
    echoTap: 'Say it and tap', syllablesTap: 'Say each part and tap it', blowTap: 'Blow and tap the flame',
    mic: 'Microphone', sessionDone: 'Hooray! Wonderful talking!', next: 'Next', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!']
  },
  RU: {
    echo: 'Послушай и повтори', syllables: 'Послушай', blow: 'Подуй на свечки! Сильно-сильно!',
    echoTurn: 'Теперь ты! Нажми и повтори', syllablesTurn: 'Теперь ты! Нажми и скажи по слогам', blowTurn: 'Нажми на микрофон и подуй!',
    listening: 'Я слушаю…', blowing: 'Дуй, дуй!', louder: 'Давай ещё раз, погромче!', together: 'Скажем вместе:',
    blowMore: 'Ещё разок! Подуй сильнее!', blowDone: 'Все свечки погасли!',
    echoTap: 'Повтори и нажми', syllablesTap: 'Говори и нажимай на каждый слог', blowTap: 'Подуй и нажми на огонёк',
    mic: 'Микрофон', sessionDone: 'Ура! Как здорово ты говоришь!', next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!']
  },
  KG: {
    echo: 'Угуп, кайтала', syllables: 'Ук', blow: 'Шамдарды үйлө! Катуу-катуу!',
    echoTurn: 'Эми сен! Бас да, кайтала', syllablesTurn: 'Эми сен! Бас да, муун менен айт', blowTurn: 'Микрофонду басып, үйлө!',
    listening: 'Угуп жатам…', blowing: 'Үйлө, үйлө!', louder: 'Дагы бир жолу, катуураак!', together: 'Чогуу айталы:',
    blowMore: 'Дагы бир жолу! Катуураак үйлө!', blowDone: 'Бардык шамдар өчтү!',
    echoTap: 'Кайталап, бас', syllablesTap: 'Айтып, ар бир муунду бас', blowTap: 'Үйлөп, жалынды бас',
    mic: 'Микрофон', sessionDone: 'Ура! Сонун сүйлөйсүң!', next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!']
  },
  UZ: {
    echo: 'Tingla va takrorla', syllables: 'Tingla', blow: 'Shamlarni pufla! Qattiq-qattiq!',
    echoTurn: 'Endi sen! Bos va takrorla', syllablesTurn: 'Endi sen! Bos va bo‘g‘inlab ayt', blowTurn: 'Mikrofonni bos va pufla!',
    listening: 'Tinglayapman…', blowing: 'Pufla, pufla!', louder: 'Yana bir bor, balandroq!', together: 'Birga aytamiz:',
    blowMore: 'Yana bir marta! Qattiqroq pufla!', blowDone: 'Hamma shamlar o‘chdi!',
    echoTap: 'Takrorla va bos', syllablesTap: 'Aytib, har bir bo‘g‘inni bos', blowTap: 'Puflab, olovni bos',
    mic: 'Mikrofon', sessionDone: 'Ura! Juda yaxshi gapirding!', next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga',
    praise: ['Barakalla!', 'Zo‘r!', 'Ajoyib!', 'Ofarin!', 'Qoyil!']
  }
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const pick = (items) => items[Math.floor(Math.random() * items.length)];

const levelStorageKey = (userKey, activity) => `ll_speak_level_${userKey}_${activity}`;
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

// What Irbi says out loud for a list of beats: "МУ-У" → "муу", ["ГАВ", "ГАВ"] → "гав, гав".
export const speechForUnits = (units) => units.map((unit) => unit.replace(/-/g, '')).join(', ').toLowerCase();

export const buildSpeakTask = (activity, level, lang, recent = []) => {
  if (activity === 'BLOW') {
    return { activity, candles: CANDLES_BY_LEVEL[level], colors: pick(CAKE_COLORS), answer: String(CANDLES_BY_LEVEL[level]) };
  }
  if (activity === 'ECHO') {
    const all = ECHO_ITEMS.map((item) => ({ image: item.image, units: item.units[lang] || item.units.RU }));
    const pool = level === 1 ? all.filter((item) => item.units.length === 1) : all;
    const fresh = pool.filter((item) => !recent.includes(item.image));
    const item = pick(fresh.length ? fresh : pool);
    return { activity, ...item, speech: speechForUnits(item.units), answer: item.image };
  }
  const words = (approvedSyllables[lang] || approvedSyllables.RU)
    .map((entry) => ({ image: imageKeyFromPath(entry.img), units: entry.units }))
    .filter((entry) => entry.image && entry.units?.length >= 2);
  const fits = {
    1: (entry) => entry.units.length === 2 && entry.units.every((unit) => unit.length <= 3),
    2: (entry) => entry.units.length <= 3,
    3: (entry) => entry.units.length >= 3
  }[level];
  const pool = words.filter(fits).length ? words.filter(fits) : words;
  const fresh = pool.filter((entry) => !recent.includes(entry.image));
  const item = pick(fresh.length ? fresh : pool);
  return { activity, ...item, speech: item.units.join('').toLowerCase(), answer: item.image };
};

export function SpeakGame({ lang, activity: rawActivity, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const activity = ACTIVITIES.includes(rawActivity) ? rawActivity : 'ECHO';
  const t = TEXT[lang] || TEXT.RU;
  const sessionSize = SESSION_SIZE[activity];
  const storageKey = levelStorageKey(userKey, activity);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [task, setTask] = useState(null);
  const [taskSeq, setTaskSeq] = useState(0);
  const [status, setStatus] = useState('playing');
  const [phase, setPhase] = useState('model');
  const [lit, setLit] = useState([]);
  const [beat, setBeat] = useState(null);
  const [candlesOut, setCandlesOut] = useState([]);
  const [tapMode, setTapMode] = useState(() => !isMicSupported());
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const levelRef = useRef(level);
  levelRef.current = level;
  const taskRef = useRef(null);
  taskRef.current = task;
  const tapModeRef = useRef(tapMode);
  tapModeRef.current = tapMode;
  const recentRef = useRef([]);
  const silentRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const moodRef = useRef(null);
  const meterRef = useRef(null);
  const loopRef = useRef(null);
  const stageRef = useRef(null);
  const outRef = useRef([]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const show = useCallback((rawPhrase, mood = 'talking') => {
    const phrase = capitalize(rawPhrase);
    setBubble(phrase);
    setIrbiMood(mood);
    if (moodRef.current) window.clearTimeout(moodRef.current);
    moodRef.current = window.setTimeout(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
    return phrase;
  }, []);

  const say = useCallback((rawPhrase, mood = 'talking') => {
    if (!rawPhrase) return;
    speakText?.(show(rawPhrase, mood), { interrupt: true });
  }, [show, speakText]);

  const sayWord = useCallback((text, kind = 'word') => {
    if (text) speakText?.(text, { kind, rate: 0.8, interrupt: true });
  }, [speakText]);

  const setVolume = (value) => {
    stageRef.current?.style.setProperty('--vol', value.toFixed(2));
  };

  // Always release the microphone the moment we stop listening.
  const stopListening = useCallback(() => {
    if (loopRef.current) window.clearInterval(loopRef.current);
    loopRef.current = null;
    meterRef.current?.close();
    meterRef.current = null;
    stageRef.current?.style.setProperty('--vol', '0');
  }, []);

  useEffect(() => () => {
    stopListening();
    clearTimers();
    if (moodRef.current) window.clearTimeout(moodRef.current);
  }, [clearTimers, stopListening]);

  const turnText = useCallback((useTap) => {
    if (activity === 'BLOW') return useTap ? t.blowTap : t.blowTurn;
    if (activity === 'ECHO') return useTap ? t.echoTap : t.echoTurn;
    return useTap ? t.syllablesTap : t.syllablesTurn;
  }, [activity, t]);

  // Irbi shows how: the whole word, then each syllable lights up as it is spoken.
  const modelTask = useCallback((item, intro) => {
    stopListening();
    setPhase('model');
    setLit([]);
    say(intro, 'talking');
    let end;
    if (item.activity === 'BLOW') {
      end = 1600;
    } else if (item.activity === 'ECHO') {
      later(() => sayWord(item.speech), 1300);
      item.units.forEach((_, index) => {
        later(() => {
          setBeat(index);
          sfxNote(index * 2);
        }, 1400 + index * 550);
      });
      end = 1400 + item.units.length * 550 + 1100;
    } else {
      later(() => sayWord(item.speech), 1300);
      item.units.forEach((unit, index) => {
        later(() => {
          setBeat(index);
          sfxNote(index * 2);
          sayWord(unit.toLowerCase(), 'syllable');
        }, 2900 + index * SYLLABLE_BEAT_MS);
      });
      end = 2900 + item.units.length * SYLLABLE_BEAT_MS + 300;
    }
    later(() => {
      setBeat(null);
      setPhase(tapModeRef.current ? 'tap' : 'ready');
      say(turnText(tapModeRef.current), 'happy');
    }, end);
  }, [later, say, sayWord, stopListening, turnText]);

  useEffect(() => {
    clearTimers();
    const next = buildSpeakTask(activity, levelRef.current, lang, recentRef.current);
    if (next.image) recentRef.current = [next.image, ...recentRef.current].slice(0, 5);
    setTask(next);
    setStatus('playing');
    setCandlesOut([]);
    outRef.current = [];
    silentRef.current = 0;
    if (next.speech) {
      prefetchSpeech?.(next.speech, { kind: 'word', rate: 0.8 });
      if (activity === 'SYLLABLES') next.units.forEach((unit) => prefetchSpeech?.(unit.toLowerCase(), { kind: 'syllable', rate: 0.8 }));
    }
    const intro = { ECHO: t.echo, SYLLABLES: t.syllables, BLOW: t.blow }[activity];
    modelTask(next, intro);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq, activity]);

  const adaptLevel = (wasClean, wasHard) => {
    recordTask(userKey, `speak:${activity}`, wasClean);
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

  const succeed = (item, phrase) => {
    stopListening();
    setStatus('done');
    setPhase('done');
    if (item.units) setLit(item.units.map((_, index) => index));
    sfxPlace('speak', true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
    if (phrase) {
      say(phrase, 'happy');
    } else if (item.speech) {
      show(`${item.speech}!`, 'happy');
      sayWord(item.speech);
    }
    later(() => say(pick(t.praise), 'cheer'), 1500);
    setSessionWins((prev) => [...prev, item.image || 'candle']);
  };

  // ----- listening -----
  const fallBackToTapping = (item) => {
    setTapMode(true);
    setPhase('tap');
    say(turnText(true), 'happy');
    if (item.activity !== 'BLOW') setLit([]);
  };

  const handleSilence = (item) => {
    silentRef.current += 1;
    if (silentRef.current === 1) {
      modelTask(item, t.louder);
      return;
    }
    // never a dead end: after a second quiet try Irbi says it with the child and moves on
    adaptLevel(false, true);
    show(t.together, 'talking');
    speakText?.(`${t.together} ${item.speech}`, { interrupt: true });
    later(() => succeed(item, null), 1800);
  };

  const blowOutCandle = (item) => {
    const remaining = Array.from({ length: item.candles }, (_, index) => index).filter((index) => !outRef.current.includes(index));
    if (!remaining.length) return;
    const index = remaining[0];
    outRef.current = [...outRef.current, index];
    setCandlesOut(outRef.current);
    sfxWhoosh();
    if (outRef.current.length === item.candles) {
      adaptLevel(silentRef.current === 0, silentRef.current >= 2);
      later(() => succeed(item, t.blowDone), 400);
    }
  };

  const startListening = async () => {
    const item = taskRef.current;
    if (!item || status !== 'playing' || phase !== 'ready') return;
    setPhase('listen');
    show(item.activity === 'BLOW' ? t.blowing : t.listening, 'happy');
    const meter = await openVoiceMeter({ blow: item.activity === 'BLOW' });
    if (taskRef.current !== item) {
      meter?.close();
      return;
    }
    if (!meter) {
      fallBackToTapping(item);
      return;
    }
    meterRef.current = meter;
    const detector = item.activity === 'BLOW'
      ? createBlowDetector({ needMs: BLOW_MS_BY_LEVEL[levelRef.current] })
      : createSpeechDetector({ targetBursts: item.units.length });
    let elapsed = 0;
    loopRef.current = window.setInterval(() => {
      elapsed += TICK_MS;
      const events = detector.push(meter.level(), TICK_MS);
      setVolume(events.level);
      if (item.activity === 'BLOW') {
        if (events.out) blowOutCandle(item);
        if (elapsed >= BLOW_LISTEN_MS && outRef.current.length < item.candles) {
          stopListening();
          silentRef.current += 1;
          setPhase('ready');
          say(t.blowMore, 'thinking');
        }
        return;
      }
      if (events.burst) {
        const index = Math.min(item.units.length, events.burst) - 1;
        setLit((prev) => (prev.includes(index) ? prev : [...prev, index]));
        sfxNote(index * 2);
      }
      if (events.done) {
        stopListening();
        adaptLevel(silentRef.current === 0, false);
        succeed(item, null);
      } else if (events.silent) {
        stopListening();
        handleSilence(item);
      }
    }, TICK_MS);
  };

  // ----- tapping instead of the microphone -----
  const tapUnit = (index) => {
    if (status !== 'playing' || phase !== 'tap' || lit.includes(index)) return;
    const next = [...lit, index];
    setLit(next);
    sfxNote(index * 2);
    sayWord(task.units[index].toLowerCase(), activity === 'SYLLABLES' ? 'syllable' : 'word');
    if (next.length === task.units.length) {
      adaptLevel(true, false);
      later(() => succeed(task, null), 700);
    }
  };

  const tapFlame = (index) => {
    if (status !== 'playing' || phase !== 'tap' || outRef.current.includes(index)) return;
    outRef.current = [...outRef.current, index];
    setCandlesOut(outRef.current);
    sfxWhoosh();
    if (outRef.current.length === task.candles) {
      adaptLevel(true, false);
      later(() => succeed(task, t.blowDone), 400);
    }
  };

  const goNext = () => {
    if (sessionWins.length >= sessionSize) {
      setShowSession(true);
      recordSession(userKey, `speak:${activity}`);
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
    if (!task || status !== 'playing' || phase === 'listen') return;
    modelTask(task, { ECHO: t.echo, SYLLABLES: t.syllables, BLOW: t.blow }[activity]);
  };

  const exit = () => {
    stopListening();
    onExit?.();
  };

  const shellProps = {
    className: 'sp',
    stars: sessionWins.length,
    totalStars: sessionSize,
    labels: { home: t.home, listen: t.listen },
    onExit: exit,
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
      onMenu: exit
    }
  };

  const unitColors = useMemo(() => ['coral', 'sky', 'sun', 'mint', 'violet'], []);

  if (!task) return <GameShell {...shellProps} />;
  const isDone = status === 'done';
  const isListening = phase === 'listen';

  return (
    <GameShell {...shellProps}>
      <div className={`sp-stage ${isListening ? 'is-listening' : ''}`} ref={stageRef}>
        <GameBoard icon={ACTIVITY_ICON[activity]} className={`sp-board sp-${activity.toLowerCase()}`} data-answer={task.answer} data-phase={phase}>
          {activity === 'BLOW' ? (
            <div className="sp-cake" style={{ '--cake-light': task.colors[0], '--cake': task.colors[1], '--cake-deep': task.colors[2] }}>
              <div className="sp-candles">
                {Array.from({ length: task.candles }, (_, index) => {
                  const isOut = candlesOut.includes(index);
                  return (
                    <button
                      key={`${taskSeq}-${index}`}
                      type="button"
                      className={`sp-candle ${isOut ? 'is-out' : ''} ${phase === 'tap' && !isOut ? 'is-tappable' : ''}`}
                      style={{ '--i': index }}
                      onClick={() => tapFlame(index)}
                      aria-label={`${index + 1}`}
                    >
                      <span className="sp-flame" />
                      {isOut ? <span className="sp-smoke" /> : null}
                      <span className="sp-wick" />
                      <span className="sp-stick" />
                    </button>
                  );
                })}
              </div>
              <div className="sp-cake-top" />
              <div className="sp-cake-body" />
              <div className="sp-cake-plate" />
            </div>
          ) : (
            <>
              <div className={`sp-picture ${isDone ? 'is-dancing' : ''}`}>
                <img src={pictureUrl(task.image)} alt="" draggable="false" />
              </div>
              <div className="sp-units">
                {task.units.map((unit, index) => (
                  <button
                    key={`${taskSeq}-${index}`}
                    type="button"
                    className={`sp-unit sp-unit-${unitColors[index % unitColors.length]} ${lit.includes(index) ? 'is-lit' : ''} ${beat === index ? 'is-beat' : ''} ${phase === 'tap' && !lit.includes(index) ? 'is-tappable' : ''}`}
                    style={{ '--i': index }}
                    onClick={() => tapUnit(index)}
                    tabIndex={phase === 'tap' ? 0 : -1}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </>
          )}
        </GameBoard>

        {isDone ? <NextButton onClick={goNext}>{t.next}</NextButton> : null}

        {!isDone && !tapMode ? (
          <button
            type="button"
            className={`sp-mic ${phase === 'ready' ? 'is-ready' : ''} ${isListening ? 'is-on' : ''}`}
            onClick={startListening}
            disabled={phase !== 'ready'}
            aria-label={t.mic}
            title={t.mic}
          >
            <span className="sp-mic-ring" aria-hidden="true" />
            <span className="sp-mic-ring sp-mic-ring-2" aria-hidden="true" />
            <img src={pictureUrl('microphone')} alt="" />
          </button>
        ) : null}
      </div>
    </GameShell>
  );
}
