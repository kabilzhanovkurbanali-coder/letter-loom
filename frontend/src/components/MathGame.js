import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { sfxBoop, sfxPick, sfxPlace, sfxTada } from '../lib/sfx';
import './MathGame.css';

const SESSION_SIZE = 5;
const IDLE_HINT_MS = 10000;
const ACTIVITIES = ['COUNT', 'NUMBERS', 'COMPARE', 'ADD'];
const ACTIVITY_ICON = { COUNT: 'abacus', NUMBERS: 'numbers', COMPARE: 'scale', ADD: 'plus' };

// Adaptive ranges per level (index = level 1..3).
const MAX_BY_LEVEL = { COUNT: [0, 3, 5, 10], NUMBERS: [0, 3, 5, 10], ADD: [0, 3, 5, 10], COMPARE: [0, 4, 6, 10] };
const CHOICES_BY_LEVEL = { COUNT: [0, 2, 3, 3], NUMBERS: [0, 2, 3, 4], ADD: [0, 2, 3, 3], COMPARE: [0, 2, 2, 2] };
const COMPARE_MIN_GAP = [0, 3, 2, 1];

const OBJECTS = ['apple', 'banana', 'cherry', 'strawberry', 'ball', 'duck', 'fish', 'star', 'tulip', 'car',
  'balloon', 'bee', 'ladybug', 'cookie', 'egg', 'orange', 'pear', 'carrot', 'bird', 'frog', 'rabbit', 'chick', 'butterfly'];

const NUMBER_WORDS = {
  EN: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  RU: ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'],
  KG: ['нөл', 'бир', 'эки', 'үч', 'төрт', 'беш', 'алты', 'жети', 'сегиз', 'тогуз', 'он'],
  UZ: ['nol', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz", "o'n"]
};

const NUMBER_COLORS = [
  null,
  ['#ff9a8b', '#ff5e7e', '#d93d60'],
  ['#ffbf7a', '#ff7a33', '#d95a17'],
  ['#ffe07a', '#ffaa2b', '#d9850c'],
  ['#c4ee7d', '#67c23a', '#4b9a24'],
  ['#74e6bb', '#1fb583', '#138c63'],
  ['#6ae3e3', '#18a8ba', '#0f8394'],
  ['#7cc8ff', '#3a8bff', '#2563d6'],
  ['#a3acff', '#5a5ff0', '#3e41c9'],
  ['#b9a2ff', '#7c5cf0', '#5b3fcf'],
  ['#ffa8dc', '#f45fb0', '#cc3f8c']
];

const TEXT = {
  EN: {
    count: 'Let’s count! How many?', findNumber: 'Find the number {n}', more: 'Where are there more?', less: 'Where are there fewer?',
    add: '{a} and {b} more. How many in all?', together: 'Let’s count together', addAnswer: '{a} and {b} make {s}!',
    moreHere: 'More here!', lessHere: 'Fewer here!', sessionDone: 'Hooray! Five tasks done!',
    next: 'Next', moreTasks: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!'],
    reward: 'Counting star', rewardDesc: 'For five math tasks in a row.'
  },
  RU: {
    count: 'Посчитай! Сколько тут?', findNumber: 'Найди цифру {n}', more: 'Где больше?', less: 'Где меньше?',
    add: '{a} и ещё {b}. Сколько всего?', together: 'Давай посчитаем вместе', addAnswer: '{a} и {b} — это {s}!',
    moreHere: 'Здесь больше!', lessHere: 'Здесь меньше!', sessionDone: 'Ура! Пять заданий готово!',
    next: 'Дальше', moreTasks: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!'],
    reward: 'Звезда счёта', rewardDesc: 'За пять заданий по математике.'
  },
  KG: {
    count: 'Санап көр! Канча?', findNumber: '{n} санын тап', more: 'Кайсында көп?', less: 'Кайсында аз?',
    add: '{a} жана дагы {b}. Баары канча?', together: 'Келчи, бирге санайлы', addAnswer: '{a} менен {b} — {s}!',
    moreHere: 'Бул жерде көп!', lessHere: 'Бул жерде аз!', sessionDone: 'Ура! Беш тапшырма даяр!',
    next: 'Кийинки', moreTasks: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!'],
    reward: 'Эсеп жылдызы', rewardDesc: 'Математикадан беш тапшырма үчүн.'
  },
  UZ: {
    count: 'Sanab ko‘r! Nechta?', findNumber: '{n} raqamini top', more: 'Qayerda ko‘p?', less: 'Qayerda kam?',
    add: '{a} va yana {b}. Hammasi nechta?', together: 'Kel, birga sanaymiz', addAnswer: '{a} va {b} — {s}!',
    moreHere: 'Bu yerda ko‘p!', lessHere: 'Bu yerda kam!', sessionDone: 'Ura! Beshta topshiriq tayyor!',
    next: 'Keyingi', moreTasks: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga',
    praise: ['Barakalla!', 'Zo‘r!', 'Ajoyib!', 'Ofarin!', 'Qoyil!'],
    reward: 'Sanoq yulduzi', rewardDesc: 'Matematikadan beshta topshiriq uchun.'
  }
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (items) => items[Math.floor(Math.random() * items.length)];

const levelStorageKey = (userKey, activity) => `ll_math_level_${userKey}_${activity}`;
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

// Answer cards are sorted ascending so the child also sees a little number line.
export const makeChoices = (answer, count, max) => {
  const upper = Math.max(max, answer + 1);
  const options = new Set([answer]);
  let guard = 0;
  while (options.size < count && guard < 100) {
    guard += 1;
    const delta = randInt(1, 2) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    if (candidate >= 1 && candidate <= upper) options.add(candidate);
    else options.add(randInt(1, upper));
  }
  return Array.from(options).sort((a, b) => a - b);
};

export const buildTask = (activity, level, previous) => {
  const max = MAX_BY_LEVEL[activity][level];
  const choiceCount = CHOICES_BY_LEVEL[activity][level];
  const object = pick(OBJECTS.filter((item) => item !== previous?.object));
  const fresh = (value) => value !== previous?.answer;

  if (activity === 'ADD') {
    let a = 1;
    let b = 1;
    for (let i = 0; i < 20; i += 1) {
      const sum = randInt(level === 3 ? 4 : 2, max);
      a = randInt(1, sum - 1);
      b = sum - a;
      if (fresh(sum)) break;
    }
    return { activity, object, a, b, answer: a + b, choices: makeChoices(a + b, choiceCount, max) };
  }

  if (activity === 'COMPARE') {
    // build the pair directly so the gap rule always holds
    const gap = COMPARE_MIN_GAP[level];
    const smaller = randInt(1, max - gap);
    const larger = randInt(smaller + gap, max);
    const [left, right] = Math.random() < 0.5 ? [smaller, larger] : [larger, smaller];
    const ask = level === 1 || Math.random() < 0.5 ? 'more' : 'less';
    const answer = (ask === 'more') === (left > right) ? 'left' : 'right';
    return { activity, object, left, right, ask, answer, choices: [] };
  }

  let n = randInt(1, max);
  for (let i = 0; i < 10 && !fresh(n); i += 1) n = randInt(1, max);
  return { activity, object, n, answer: n, choices: makeChoices(n, choiceCount, max) };
};

export function MathGame({ lang, activity: rawActivity, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const activity = ACTIVITIES.includes(rawActivity) ? rawActivity : 'COUNT';
  const t = TEXT[lang] || TEXT.RU;
  const words = NUMBER_WORDS[lang] || NUMBER_WORDS.RU;
  const storageKey = levelStorageKey(userKey, activity);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [task, setTask] = useState(null);
  const [taskSeq, setTaskSeq] = useState(0);
  const [status, setStatus] = useState('playing');
  const [counted, setCounted] = useState({});
  const [removed, setRemoved] = useState([]);
  const [wobble, setWobble] = useState(null);
  const [hint, setHint] = useState(false);
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const levelRef = useRef(level);
  levelRef.current = level;
  const mistakesRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const idleRef = useRef(null);
  const moodRef = useRef(null);
  const autoCountRef = useRef(false);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
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

  useEffect(() => () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    if (idleRef.current) window.clearTimeout(idleRef.current);
    if (moodRef.current) window.clearTimeout(moodRef.current);
  }, []);

  const questionFor = useCallback((item) => {
    if (!item) return '';
    if (item.activity === 'COUNT') return t.count;
    if (item.activity === 'NUMBERS') return t.findNumber.replace('{n}', words[item.n]);
    if (item.activity === 'COMPARE') return item.ask === 'more' ? t.more : t.less;
    return t.add.replace('{a}', words[item.a]).replace('{b}', words[item.b]);
  }, [t, words]);

  // Objects that can be tapped to count (COUNT and ADD).
  const countables = useMemo(() => {
    if (!task) return [];
    if (task.activity === 'COUNT') return Array.from({ length: task.n }, (_, i) => `o${i}`);
    if (task.activity === 'ADD') {
      return [
        ...Array.from({ length: task.a }, (_, i) => `a${i}`),
        ...Array.from({ length: task.b }, (_, i) => `b${i}`)
      ];
    }
    return [];
  }, [task]);

  // new task
  useEffect(() => {
    const next = buildTask(activity, levelRef.current, task);
    setTask(next);
    setStatus('playing');
    setCounted({});
    setRemoved([]);
    setHint(false);
    mistakesRef.current = 0;
    autoCountRef.current = false;
    const question = capitalize(questionFor(next));
    setBubble(question);
    const id = window.setTimeout(() => say(question), 350);
    prefetchSpeech?.(question);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq, activity]);

  useEffect(() => {
    const max = MAX_BY_LEVEL[activity][3];
    for (let n = 1; n <= max; n += 1) prefetchSpeech?.(words[n]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, activity]);

  const countOne = useCallback((id) => {
    if (counted[id]) {
      speakText?.(words[counted[id]], { interrupt: true });
      return;
    }
    const order = Object.keys(counted).length + 1;
    speakText?.(words[order], { interrupt: true });
    sfxPick(id);
    setCounted({ ...counted, [id]: order });
  }, [counted, speakText, words]);

  // Irbi counts every object aloud, one by one, highlighting each.
  const countTogether = useCallback(() => {
    if (autoCountRef.current || !countables.length) return;
    autoCountRef.current = true;
    setCounted({});
    say(t.together, 'talking');
    countables.forEach((id, index) => {
      later(() => {
        setCounted((prev) => ({ ...prev, [id]: index + 1 }));
        speakText?.(words[index + 1], { interrupt: true });
        sfxPick(id);
      }, 1400 + index * 850);
    });
    later(() => {
      autoCountRef.current = false;
      setHint(true);
    }, 1400 + countables.length * 850);
  }, [countables, later, say, speakText, t.together, words]);

  const showHint = useCallback(() => {
    if (status !== 'playing') return;
    if (countables.length) {
      countTogether();
    } else {
      setHint(true);
      say(questionFor(task));
    }
  }, [countTogether, countables.length, questionFor, say, status, task]);

  const resetIdle = useCallback(() => {
    if (idleRef.current) window.clearTimeout(idleRef.current);
    if (status !== 'playing') return;
    idleRef.current = window.setTimeout(showHint, IDLE_HINT_MS);
  }, [showHint, status]);

  useEffect(() => {
    resetIdle();
  }, [resetIdle, counted, removed]);

  const adaptLevel = () => {
    const mistakes = mistakesRef.current;
    let next = levelRef.current;
    if (mistakes === 0) {
      streakRef.current += 1;
      if (streakRef.current >= 2 && next < 3) {
        next += 1;
        streakRef.current = 0;
      }
    } else {
      streakRef.current = 0;
      if (mistakes >= 2 && next > 1) next -= 1;
    }
    if (next !== levelRef.current) {
      setLevel(next);
      writeLevel(storageKey, next);
    }
  };

  const succeed = () => {
    if (idleRef.current) window.clearTimeout(idleRef.current);
    setStatus('done');
    setHint(false);
    adaptLevel();
    // every object gets its number, so the child sees the count reach the answer
    if (countables.length) {
      setCounted(Object.fromEntries(countables.map((id, index) => [id, index + 1])));
    }
    sfxPlace(String(task.answer), true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
    let phrase = `${words[task.answer]}!`;
    if (task.activity === 'ADD') {
      phrase = t.addAnswer.replace('{a}', words[task.a]).replace('{b}', words[task.b]).replace('{s}', words[task.answer]);
    } else if (task.activity === 'COMPARE') {
      phrase = task.ask === 'more' ? t.moreHere : t.lessHere;
    }
    say(phrase, 'happy');
    later(() => say(pick(t.praise), 'cheer'), 1800 + phrase.length * 40);
    setSessionWins((prev) => [...prev, task.object]);
  };

  const miss = (choiceKey) => {
    mistakesRef.current += 1;
    sfxBoop();
    setWobble(choiceKey);
    later(() => setWobble(null), 500);
    if (task.activity !== 'COMPARE') {
      later(() => setRemoved((prev) => [...prev, choiceKey]), 450);
    }
    if (mistakesRef.current >= 2 || levelRef.current === 1) showHint();
  };

  const chooseNumber = (value) => {
    if (status !== 'playing') return;
    resetIdle();
    speakText?.(words[value], { interrupt: true });
    if (value === task.answer) succeed();
    else miss(value);
  };

  const chooseSide = (side) => {
    if (status !== 'playing') return;
    resetIdle();
    if (side === task.answer) succeed();
    else miss(side);
  };

  const goNext = () => {
    if (sessionWins.length >= SESSION_SIZE) {
      setShowSession(true);
      sfxTada();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
      say(t.sessionDone, 'cheer');
      onSessionComplete?.({
        activity,
        title: t.reward,
        desc: t.rewardDesc,
        object: sessionWins[sessionWins.length - 1]
      });
      return;
    }
    setTaskSeq((value) => value + 1);
  };

  const startNewSession = () => {
    setShowSession(false);
    setSessionWins([]);
    setTaskSeq((value) => value + 1);
  };

  const shellProps = {
    className: 'mg',
    stars: sessionWins.length,
    totalStars: SESSION_SIZE,
    labels: { home: t.home, listen: t.listen },
    onExit,
    onListen: () => say(questionFor(task)),
    bubble,
    irbiMood,
    onIrbiTap: () => say(questionFor(task)),
    session: {
      open: showSession,
      title: t.sessionDone,
      pictures: sessionWins.map((item) => pictureUrl(item)),
      moreLabel: t.moreTasks,
      menuLabel: t.menu,
      onMore: startNewSession,
      onMenu: onExit
    }
  };

  if (!task) return <GameShell {...shellProps} />;

  const isDone = status === 'done';
  const objectSrc = pictureUrl(task.object);

  const renderObjects = (ids) => ids.map((id, index) => (
    <button
      key={`${taskSeq}-${id}`}
      type="button"
      className={`mg-object ${counted[id] ? 'is-counted' : ''} ${isDone ? 'is-dancing' : ''}`}
      style={{ '--i': index }}
      onClick={() => {
        if (status !== 'playing' || autoCountRef.current) return;
        resetIdle();
        countOne(id);
      }}
      aria-label={counted[id] ? String(counted[id]) : ''}
    >
      <img src={objectSrc} alt="" draggable="false" />
      {counted[id] ? <span className="mg-count-badge">{counted[id]}</span> : null}
    </button>
  ));

  const renderStaticObjects = (count, keyPrefix) => Array.from({ length: count }, (_, index) => (
    <span key={`${taskSeq}-${keyPrefix}${index}`} className={`mg-object is-static ${isDone ? 'is-dancing' : ''}`} style={{ '--i': index }}>
      <img src={objectSrc} alt="" draggable="false" />
    </span>
  ));

  return (
    <GameShell {...shellProps}>
      <GameBoard icon={ACTIVITY_ICON[activity]} className={`mg-board mg-${activity.toLowerCase()}`} data-answer={task.answer}>
        {activity === 'COUNT' ? (
          <div className="mg-field">{renderObjects(countables)}</div>
        ) : null}

        {activity === 'NUMBERS' ? (
          <div className="mg-listen">
            {isDone ? (
              <div className="mg-field">{renderStaticObjects(task.n, 'n')}</div>
            ) : (
              <button type="button" className="mg-listen-btn" onClick={() => say(questionFor(task))}>
                <img src={pictureUrl('speaker')} alt="" />
              </button>
            )}
          </div>
        ) : null}

        {activity === 'ADD' ? (
          <div className={`mg-equation ${isDone ? 'is-done' : ''}`}>
            <div className="mg-plate">
              <div className="mg-plate-items">{renderObjects(countables.slice(0, task.a))}</div>
              <NumberChip value={task.a} />
            </div>
            <span className="mg-sign">+</span>
            <div className="mg-plate mg-plate-b">
              <div className="mg-plate-items">{renderObjects(countables.slice(task.a))}</div>
              <NumberChip value={task.b} />
            </div>
            <span className="mg-sign">=</span>
            <div className={`mg-answer-box ${isDone ? 'is-solved' : ''}`}>
              {isDone ? <NumberChip value={task.answer} big /> : <span className="mg-question">?</span>}
            </div>
          </div>
        ) : null}

        {activity === 'COMPARE' ? (
          <div className="mg-compare">
            {['left', 'right'].map((side, index) => {
              const value = side === 'left' ? task.left : task.right;
              const isAnswer = side === task.answer;
              return (
                <React.Fragment key={side}>
                  {index === 1 ? (
                    <span className={`mg-sign mg-compare-sign ${isDone ? 'is-shown' : ''}`}>
                      {isDone ? (task.left > task.right ? '>' : '<') : '?'}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`mg-plate mg-plate-choice ${wobble === side ? 'is-wobble' : ''} ${hint && isAnswer ? 'is-hint' : ''} ${isDone && isAnswer ? 'is-winner' : ''}`}
                    onClick={() => chooseSide(side)}
                  >
                    <div className="mg-plate-items">{renderStaticObjects(value, side)}</div>
                    {isDone ? <NumberChip value={value} /> : null}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        ) : null}
      </GameBoard>

      {isDone ? (
        <NextButton onClick={goNext}>{t.next}</NextButton>
      ) : task.choices.length ? (
        <section className="gs-shelf mg-choices">
          {task.choices.map((value, index) => (
            removed.includes(value) ? (
              <span key={`${taskSeq}-${value}`} className="mg-card-spot" />
            ) : (
              <NumberCard
                key={`${taskSeq}-${value}`}
                value={value}
                index={index}
                isWobble={wobble === value}
                isHint={hint && value === task.answer}
                onClick={() => chooseNumber(value)}
              />
            )
          ))}
        </section>
      ) : null}
    </GameShell>
  );
}

function Dots({ value }) {
  const rows = value > 5 ? [5, value - 5] : [value];
  return (
    <span className="mg-dots" aria-hidden="true">
      {rows.map((count, rowIndex) => (
        <span key={rowIndex} className="mg-dots-row">
          {Array.from({ length: count }, (_, i) => <i key={i} />)}
        </span>
      ))}
    </span>
  );
}

function NumberCard({ value, index, isWobble, isHint, onClick }) {
  const [c1, c2, c3] = NUMBER_COLORS[value] || NUMBER_COLORS[7];
  return (
    <button
      type="button"
      className={`mg-card ${isWobble ? 'is-wobble' : ''} ${isHint ? 'is-hint' : ''}`}
      style={{ '--c1': c1, '--c2': c2, '--c3': c3, '--i': index }}
      onClick={onClick}
      aria-label={String(value)}
    >
      <span className="mg-card-digit">{value}</span>
      <Dots value={value} />
    </button>
  );
}

function NumberChip({ value, big = false }) {
  const [c1, c2, c3] = NUMBER_COLORS[value] || NUMBER_COLORS[7];
  return (
    <span className={`mg-chip ${big ? 'is-big' : ''}`} style={{ '--c1': c1, '--c2': c2, '--c3': c3 }}>{value}</span>
  );
}
