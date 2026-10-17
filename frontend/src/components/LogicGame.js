import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { sfxBoop, sfxNote, sfxPick, sfxPlace, sfxTada } from '../lib/sfx';
import './LogicGame.css';

const ACTIVITIES = ['ODD', 'PATTERN', 'SORT'];
const ACTIVITY_ICON = { ODD: 'brain', PATTERN: 'shapes', SORT: 'basket' };
const SESSION_SIZE = 5;

const ODD_ITEMS_BY_LEVEL = [0, 3, 4, 5];
const PATTERN_CHOICES_BY_LEVEL = [0, 2, 3, 3];
const PATTERNS_BY_LEVEL = [[], ['AB'], ['AB', 'AAB', 'ABB', 'ABC'], ['AAB', 'ABB', 'ABC', 'AABB']];
const PATTERN_UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };
const PATTERN_MAX_BEADS = 8;
const SORT_BINS_BY_LEVEL = [0, 2, 2, 3];
const SORT_ITEMS_BY_LEVEL = [0, 4, 6, 6];
const BEAT_MS = 420;

// [light, main, deep] — precomputed so old tablet browsers without color-mix() still work
const COLORS = {
  red: ['#ff9aab', '#ff4f6d', '#c7304f'],
  blue: ['#8cc2ff', '#3a8bff', '#2160c4'],
  yellow: ['#ffe48a', '#ffc21a', '#c98f00'],
  green: ['#8ff0bf', '#22c47a', '#128a52']
};
const COLOR_KEYS = Object.keys(COLORS);
const SHAPE_KEYS = ['circle', 'square', 'triangle', 'star', 'heart'];
const SIZE_SCALE = { big: 1, medium: 0.72, small: 0.48 };

const GROUPS = {
  animals: ['cat', 'dog', 'cow', 'horse', 'pig', 'sheep', 'rabbit', 'bear', 'lion', 'elephant', 'giraffe', 'zebra', 'monkey', 'fox', 'camel', 'goat'],
  fruits: ['apple', 'banana', 'pear', 'orange', 'lemon', 'grape', 'cherry', 'strawberry', 'peach', 'watermelon'],
  vegetables: ['carrot', 'potato', 'tomato', 'cucumber', 'onion', 'corn'],
  transport: ['car', 'bus', 'train', 'airplane', 'boat', 'bicycle', 'taxi', 'tractor', 'rocket', 'ship'],
  clothes: ['shirt', 'pants', 'sock', 'boot', 'hat'],
  dishes: ['spoon', 'fork', 'cup', 'plate', 'bowl', 'teapot']
};
// fruit vs vegetable is a fine distinction, so it only shows up at the top level
const NEAR_GROUPS = [['fruits', 'vegetables'], ['vegetables', 'fruits']];
const PATTERN_PICS = ['apple', 'banana', 'cherry', 'strawberry', 'pear', 'grape', 'cat', 'dog', 'duck', 'fish', 'frog', 'rabbit', 'ball', 'flower', 'heart', 'star'];
const SIZE_PICS = ['ball', 'apple', 'star', 'balloon', 'car', 'fish', 'duck', 'flower'];
const REWARDS = ['star', 'medal', 'trophy', 'crown', 'gift', 'rainbow', 'balloon', 'sparkles'];

const TEXT = {
  EN: {
    odd: 'Which one does not belong?', lookAgain: 'Look carefully',
    pattern: 'Listen to the beads. Which bead comes next?', singAgain: 'Let’s sing it again',
    sortColor: 'Sort them by color', sortShape: 'Sort them by shape', sortSize: 'Sort them by size',
    sortSize2: 'Big ones in the big basket, small ones in the small one',
    otherColor: 'A different color!', otherShape: 'A different shape!',
    rest: {
      animals: 'The others are animals!', fruits: 'The others are fruits!', vegetables: 'The others are vegetables!',
      transport: 'The others are vehicles!', clothes: 'The others are clothes!', dishes: 'The others are dishes!'
    },
    colors: { red: 'red', blue: 'blue', yellow: 'yellow', green: 'green' },
    shapes: { circle: 'circle', square: 'square', triangle: 'triangle', star: 'star', heart: 'heart' },
    sizes: { big: 'big', medium: 'medium', small: 'small' },
    sessionDone: 'Hooray! Clever thinking!', next: 'Next', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!']
  },
  RU: {
    odd: 'Что здесь лишнее?', lookAgain: 'Посмотри внимательно',
    pattern: 'Послушай бусы. Какая бусинка дальше?', singAgain: 'Давай споём ещё раз',
    sortColor: 'Разложи по цветам', sortShape: 'Разложи по форме', sortSize: 'Разложи по размеру',
    sortSize2: 'Большие — в большую корзинку, маленькие — в маленькую',
    otherColor: 'Другой цвет!', otherShape: 'Другая форма!',
    rest: {
      animals: 'Остальные — животные!', fruits: 'Остальные — фрукты!', vegetables: 'Остальные — овощи!',
      transport: 'Остальные — транспорт!', clothes: 'Остальные — одежда!', dishes: 'Остальные — посуда!'
    },
    colors: { red: 'красный', blue: 'синий', yellow: 'жёлтый', green: 'зелёный' },
    shapes: { circle: 'круг', square: 'квадрат', triangle: 'треугольник', star: 'звезда', heart: 'сердечко' },
    sizes: { big: 'большой', medium: 'средний', small: 'маленький' },
    sessionDone: 'Ура! Вот это смекалка!', next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!']
  },
  KG: {
    odd: 'Бул жерде эмне артык?', lookAgain: 'Жакшылап кара',
    pattern: 'Мончокту ук. Кийинкиси кайсы?', singAgain: 'Дагы бир ырдайлы',
    sortColor: 'Түстөрү боюнча иреттеп сал', sortShape: 'Формасы боюнча иреттеп сал', sortSize: 'Чоңдугу боюнча иреттеп сал',
    sortSize2: 'Чоңдорун чоң себетке, кичинелерин кичине себетке сал',
    otherColor: 'Башка түс!', otherShape: 'Башка форма!',
    rest: {
      animals: 'Калгандары — жаныбарлар!', fruits: 'Калгандары — мөмөлөр!', vegetables: 'Калгандары — жашылчалар!',
      transport: 'Калгандары — унаалар!', clothes: 'Калгандары — кийимдер!', dishes: 'Калгандары — идиштер!'
    },
    colors: { red: 'кызыл', blue: 'көк', yellow: 'сары', green: 'жашыл' },
    shapes: { circle: 'тегерек', square: 'төрт бурчтук', triangle: 'үч бурчтук', star: 'жылдыз', heart: 'жүрөк' },
    sizes: { big: 'чоң', medium: 'орто', small: 'кичине' },
    sessionDone: 'Ура! Акылдуусуң!', next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!']
  },
  UZ: {
    odd: 'Bu yerda nima ortiqcha?', lookAgain: 'Diqqat bilan qara',
    pattern: 'Munchoqlarni tingla. Keyingisi qaysi?', singAgain: 'Yana bir kuylaymiz',
    sortColor: 'Ranglar bo‘yicha sarala', sortShape: 'Shakli bo‘yicha sarala', sortSize: 'Kattaligi bo‘yicha sarala',
    sortSize2: 'Kattalarini katta savatga, kichiklarini kichik savatga sol',
    otherColor: 'Boshqa rang!', otherShape: 'Boshqa shakl!',
    rest: {
      animals: 'Qolganlari — hayvonlar!', fruits: 'Qolganlari — mevalar!', vegetables: 'Qolganlari — sabzavotlar!',
      transport: 'Qolganlari — transport!', clothes: 'Qolganlari — kiyimlar!', dishes: 'Qolganlari — idishlar!'
    },
    colors: { red: 'qizil', blue: 'ko‘k', yellow: 'sariq', green: 'yashil' },
    shapes: { circle: 'doira', square: 'kvadrat', triangle: 'uchburchak', star: 'yulduz', heart: 'yurak' },
    sizes: { big: 'katta', medium: 'o‘rtacha', small: 'kichkina' },
    sessionDone: 'Ura! Juda aqllisan!', next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga',
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

const levelStorageKey = (userKey, activity) => `ll_logic_level_${userKey}_${activity}`;
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

const shapeToken = (shape, color, extra = {}) => ({ id: `s-${shape}-${color}`, kind: 'shape', shape, color, ...extra });
const picToken = (image, extra = {}) => ({ id: `p-${image}`, kind: 'pic', image, ...extra });

const buildOdd = (level, variant) => {
  const count = ODD_ITEMS_BY_LEVEL[level];
  let main;
  let odd;
  let reason;
  if (variant === 'pic') {
    let groups;
    if (level === 3 && Math.random() < 0.5) {
      groups = pick(NEAR_GROUPS);
    } else {
      const [mainGroup, ...rest] = shuffle(Object.keys(GROUPS));
      const isNear = (other) => NEAR_GROUPS.some(([a, b]) => a === mainGroup && b === other);
      groups = [mainGroup, rest.find((other) => !isNear(other))];
    }
    main = shuffle(GROUPS[groups[0]]).slice(0, count - 1).map((image) => picToken(image));
    odd = picToken(pick(GROUPS[groups[1]]));
    reason = { type: 'group', group: groups[0] };
  } else if (variant === 'color') {
    const shape = pick(SHAPE_KEYS);
    const [mainColor, oddColor] = shuffle(COLOR_KEYS);
    // at the top level the shapes are mixed, so only the colour tells the odd one apart
    const shapes = level === 3 ? shuffle(SHAPE_KEYS) : SHAPE_KEYS.map(() => shape);
    main = shapes.slice(0, count - 1).map((item) => shapeToken(item, mainColor));
    odd = shapeToken(level === 3 ? pick(SHAPE_KEYS) : shape, oddColor);
    reason = { type: 'color' };
  } else {
    const [mainShape, oddShape] = shuffle(SHAPE_KEYS);
    const color = pick(COLOR_KEYS);
    const colors = level === 3 ? shuffle([...COLOR_KEYS, ...COLOR_KEYS]) : COLOR_KEYS.map(() => color);
    main = colors.slice(0, count - 1).map((item) => shapeToken(mainShape, item));
    odd = shapeToken(oddShape, level === 3 ? pick(COLOR_KEYS) : color);
    reason = { type: 'shape' };
  }
  const items = shuffle([...main, odd]).map((item, index) => ({ ...item, id: `o${index}-${item.id}` }));
  const answer = items.find((item) => item.image === odd.image && item.shape === odd.shape && item.color === odd.color).id;
  return { activity: 'ODD', items, answer, reason };
};

const patternTokens = (variant, count) => {
  if (variant === 'pic') return shuffle(PATTERN_PICS).slice(0, count).map((image) => picToken(image));
  if (variant === 'color') {
    const shape = pick(SHAPE_KEYS);
    return shuffle(COLOR_KEYS).slice(0, count).map((color) => shapeToken(shape, color));
  }
  if (variant === 'shape') {
    const color = pick(COLOR_KEYS);
    return shuffle(SHAPE_KEYS).slice(0, count).map((shape) => shapeToken(shape, color));
  }
  const colors = shuffle(COLOR_KEYS);
  return shuffle(SHAPE_KEYS).slice(0, Math.min(count, colors.length)).map((shape, index) => shapeToken(shape, colors[index]));
};

const buildPattern = (level, variant) => {
  const name = pick(PATTERNS_BY_LEVEL[level]);
  const unit = PATTERN_UNITS[name];
  const kinds = Math.max(...unit) + 1;
  const tokens = patternTokens(variant, kinds + 1);
  const visible = Math.min(PATTERN_MAX_BEADS, unit.length * 2 + Math.floor(Math.random() * unit.length));
  const beads = Array.from({ length: visible }, (_, index) => ({ ...tokens[unit[index % unit.length]], step: unit[index % unit.length] }));
  const answerStep = unit[visible % unit.length];
  const answer = { ...tokens[answerStep], step: answerStep };
  const others = tokens.filter((_, index) => index !== answerStep).map((token) => ({ ...token, step: tokens.indexOf(token) }));
  const choices = shuffle([answer, ...others.slice(0, PATTERN_CHOICES_BY_LEVEL[level] - 1)]);
  return { activity: 'PATTERN', pattern: name, variant, beads, answer: answer.id, answerToken: answer, choices };
};

const buildSort = (level, criterion) => {
  const binCount = SORT_BINS_BY_LEVEL[level];
  let bins;
  if (criterion === 'color') bins = shuffle(COLOR_KEYS).slice(0, binCount);
  else if (criterion === 'shape') bins = shuffle(SHAPE_KEYS).slice(0, binCount);
  else bins = binCount === 3 ? ['big', 'medium', 'small'] : ['big', 'small'];
  const baseShape = pick(SHAPE_KEYS);
  const baseColor = pick(COLOR_KEYS);
  const basePic = pick(SIZE_PICS);
  const items = Array.from({ length: SORT_ITEMS_BY_LEVEL[level] }, (_, index) => {
    const group = bins[index % binCount];
    const id = `i${index}`;
    // at the first level only the sorted feature changes; later the other features vary too
    if (criterion === 'color') return { id, group, kind: 'shape', shape: level === 1 ? baseShape : pick(SHAPE_KEYS), color: group, size: 'big' };
    if (criterion === 'shape') return { id, group, kind: 'shape', shape: group, color: level === 1 ? baseColor : pick(COLOR_KEYS), size: 'big' };
    // sizes are only comparable on the same object, so a size round uses one picture
    return { id, group, kind: 'pic', image: basePic, size: group };
  });
  return { activity: 'SORT', criterion, bins, items: shuffle(items), answer: criterion, basePic, baseShape };
};

const ODD_VARIANTS = ['pic', 'color', 'pic', 'shape'];
const PATTERN_VARIANTS_BY_LEVEL = [[], ['pic', 'color'], ['pic', 'color', 'shape'], ['pic', 'combo', 'shape']];
const SORT_CRITERIA = ['color', 'shape', 'size'];

// `round` rotates the kind of puzzle inside a session so five tasks in a row never feel the same.
export const buildLogicTask = (activity, level, round = 0) => {
  if (activity === 'ODD') return buildOdd(level, ODD_VARIANTS[round % ODD_VARIANTS.length]);
  if (activity === 'PATTERN') {
    const variants = PATTERN_VARIANTS_BY_LEVEL[level];
    return buildPattern(level, variants[round % variants.length]);
  }
  return buildSort(level, SORT_CRITERIA[round % SORT_CRITERIA.length]);
};

// ---------- shapes with faces ----------
const SHAPE_BODY = {
  circle: <circle cx="50" cy="52" r="40" />,
  square: <rect x="12" y="13" width="76" height="76" rx="16" />,
  triangle: <path d="M50 10 L91 86 L9 86 Z" />,
  star: <polygon points="50,6 62,37 95,38 69,58 78,91 50,72 22,91 31,58 5,38 38,37" />,
  heart: <path d="M50 90 C20 68 7 50 7 33 C7 18 18 8 31 8 C40 8 46 13 50 21 C54 13 60 8 69 8 C82 8 93 18 93 33 C93 50 80 68 50 90 Z" />
};
const FACE_Y = { circle: 52, square: 51, triangle: 64, star: 54, heart: 42 };
const SHINE = {
  circle: [34, 32, 13, 7],
  square: [30, 28, 12, 6],
  triangle: [42, 44, 7, 4],
  star: [38, 32, 6, 4],
  heart: [26, 24, 9, 5]
};

export function ShapeArt({ shape, color }) {
  const [, , deep] = COLORS[color] || COLORS.blue;
  const y = FACE_Y[shape];
  const [sx, sy, rx, ry] = SHINE[shape];
  return (
    <svg className="lg-shape" viewBox="0 0 100 100" aria-hidden="true">
      <g fill={`url(#lg-grad-${color})`} stroke={deep} strokeWidth="5" strokeLinejoin="round">
        {SHAPE_BODY[shape]}
      </g>
      <ellipse cx={sx} cy={sy} rx={rx} ry={ry} fill="#ffffff" opacity="0.55" transform={`rotate(-30 ${sx} ${sy})`} />
      <g className="lg-face" fill="#2a2f4a">
        <ellipse className="lg-eye" cx="41" cy={y} rx="4" ry="5" />
        <ellipse className="lg-eye" cx="59" cy={y} rx="4" ry="5" />
        <path d={`M43 ${y + 9} Q50 ${y + 15} 57 ${y + 9}`} fill="none" stroke="#2a2f4a" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function ShapeGradients() {
  return (
    <svg className="lg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {COLOR_KEYS.map((color) => (
          <linearGradient key={color} id={`lg-grad-${color}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={COLORS[color][0]} />
            <stop offset="0.55" stopColor={COLORS[color][1]} />
            <stop offset="1" stopColor={COLORS[color][2]} />
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

function Token({ token }) {
  if (token.kind === 'pic') return <img className="lg-pic" src={pictureUrl(token.image)} alt="" draggable="false" />;
  return <ShapeArt shape={token.shape} color={token.color} />;
}

export function LogicGame({ lang, activity: rawActivity, vocabulary, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const activity = ACTIVITIES.includes(rawActivity) ? rawActivity : 'ODD';
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
  const [hopIndex, setHopIndex] = useState(null);
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overBin, setOverBin] = useState(null);
  const [glowBin, setGlowBin] = useState(null);
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const levelRef = useRef(level);
  levelRef.current = level;
  const roundRef = useRef(Math.floor(Math.random() * 12));
  const mistakesRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const moodRef = useRef(null);
  const dragRef = useRef(null);

  const wordByImage = useMemo(() => {
    const map = {};
    (vocabulary || []).forEach((item) => {
      if (item?.image && item?.text) map[item.image] = String(item.text).replace(/-/g, '').toLowerCase();
    });
    return map;
  }, [vocabulary]);

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

  const sayWord = useCallback((word) => {
    if (word) speakText?.(word, { kind: 'word', rate: 0.85, interrupt: true });
  }, [speakText]);

  // The word a child hears for a token: the picture's name, or the feature that matters in this puzzle.
  const tokenWord = useCallback((token, feature) => {
    if (!token) return '';
    if (token.kind === 'pic') return feature === 'size' ? t.sizes[token.size] : wordByImage[token.image] || '';
    if (feature === 'shape') return t.shapes[token.shape];
    return t.colors[token.color];
  }, [t, wordByImage]);

  useEffect(() => () => {
    clearTimers();
    if (moodRef.current) window.clearTimeout(moodRef.current);
  }, [clearTimers]);

  const patternFeature = (item) => (item?.variant === 'shape' || item?.variant === 'combo' ? 'shape' : 'color');

  // Each kind of bead has its own note, so the pattern can be heard as well as seen.
  const playMelody = useCallback((item, withAnswer, intro) => {
    setPhase('listen');
    if (intro) say(intro, 'talking');
    const beads = withAnswer ? [...item.beads, item.answerToken] : item.beads;
    beads.forEach((bead, index) => {
      later(() => {
        setHopIndex(index);
        sfxNote(bead.step * 2);
      }, 900 + index * BEAT_MS);
    });
    later(() => {
      setHopIndex(null);
      setPhase(withAnswer ? 'sung' : 'choose');
    }, 900 + beads.length * BEAT_MS + 150);
  }, [later, say]);

  const sortIntro = (item) => {
    if (item.criterion === 'color') return t.sortColor;
    if (item.criterion === 'shape') return t.sortShape;
    return item.bins.length === 2 ? t.sortSize2 : t.sortSize;
  };

  useEffect(() => {
    clearTimers();
    const next = buildLogicTask(activity, levelRef.current, roundRef.current);
    roundRef.current += 1;
    setTask(next);
    setStatus('playing');
    setFaded([]);
    setHint(false);
    setHopIndex(null);
    setPlaced({});
    setSelected(null);
    setGlowBin(null);
    mistakesRef.current = 0;
    if (activity === 'PATTERN') {
      playMelody(next, false, t.pattern);
    } else {
      setPhase('');
      later(() => say(activity === 'ODD' ? t.odd : sortIntro(next)), 350);
    }
    if (activity === 'ODD') {
      next.items.forEach((item) => {
        if (item.kind === 'pic' && wordByImage[item.image]) prefetchSpeech?.(wordByImage[item.image], { kind: 'word', rate: 0.85 });
      });
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq, activity]);

  const adaptLevel = (wasClean, wasHard) => {
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
    setGlowBin(null);
    sfxPlace('logic', true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
    if (phrase) say(phrase, 'happy');
    later(() => say(pick(t.praise), 'cheer'), phrase ? 1900 : 200);
    setSessionWins((prev) => [...prev, rewardImage || REWARDS[prev.length % REWARDS.length]]);
  };

  const slip = (id) => {
    mistakesRef.current += 1;
    sfxBoop();
    setWobble(id);
    later(() => setWobble(null), 500);
  };

  // ----- odd one out -----
  const chooseOdd = (item) => {
    if (status !== 'playing' || faded.includes(item.id)) return;
    const feature = task.reason.type === 'shape' ? 'shape' : 'color';
    if (item.id === task.answer) {
      adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
      let phrase = t.rest[task.reason.group];
      if (task.reason.type === 'color') phrase = t.otherColor;
      if (task.reason.type === 'shape') phrase = t.otherShape;
      const name = item.kind === 'pic' ? wordByImage[item.image] : '';
      succeed(item.kind === 'pic' ? item.image : null, name ? `${capitalize(name)}! ${phrase}` : phrase);
      return;
    }
    sayWord(tokenWord(item, feature));
    slip(item.id);
    later(() => setFaded((prev) => [...prev, item.id]), 450);
    if (mistakesRef.current >= 2) setHint(true);
    else later(() => say(t.lookAgain, 'thinking'), 700);
  };

  // ----- continue the pattern -----
  const choosePattern = (choice) => {
    if (status !== 'playing' || phase !== 'choose') return;
    sfxNote(choice.step * 2);
    if (choice.id === task.answer) {
      adaptLevel(mistakesRef.current === 0, mistakesRef.current >= 2);
      setStatus('solved');
      sayWord(tokenWord(choice, patternFeature(task)));
      playMelody(task, true, null);
      later(() => succeed(choice.kind === 'pic' ? choice.image : null, null), 900 + (task.beads.length + 1) * BEAT_MS + 200);
      return;
    }
    slip(choice.id);
    if (mistakesRef.current >= 2) setHint(true);
    later(() => playMelody(task, false, t.singAgain), 650);
  };

  // ----- sorting -----
  const sortFeature = task?.criterion;

  const dropInto = (itemId, bin) => {
    const item = task.items.find((entry) => entry.id === itemId);
    if (!item || placed[itemId]) return;
    setSelected(null);
    if (item.group === bin) {
      const nextPlaced = { ...placed, [itemId]: bin };
      setPlaced(nextPlaced);
      const isLast = Object.keys(nextPlaced).length === task.items.length;
      sfxPlace(bin, isLast);
      sayWord(sortFeature === 'size' ? t.sizes[bin] : tokenWord(item, sortFeature));
      if (isLast) {
        adaptLevel(mistakesRef.current <= 1, mistakesRef.current >= 3);
        later(() => succeed(null, null), 500);
      }
      return;
    }
    slip(itemId);
    sayWord(sortFeature === 'size' ? t.sizes[item.group] : tokenWord(item, sortFeature));
    setGlowBin(item.group);
    later(() => setGlowBin(null), 1800);
  };

  const binAt = (x, y) => {
    const hit = (document.elementsFromPoint?.(x, y) || []).find((el) => el.dataset?.bin);
    return hit ? hit.dataset.bin : null;
  };

  const onItemPointerDown = (event, item) => {
    if (status !== 'playing' || placed[item.id]) return;
    event.preventDefault();
    const el = event.currentTarget;
    el.setPointerCapture?.(event.pointerId);
    dragRef.current = { id: item.id, x0: event.clientX, y0: event.clientY, el, moved: false };
    setDragId(item.id);
    sfxPick(item.id);
  };

  const onItemPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x0;
    const dy = event.clientY - drag.y0;
    if (Math.abs(dx) + Math.abs(dy) > 10) drag.moved = true;
    drag.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
    setOverBin(binAt(event.clientX, event.clientY));
  };

  const endDrag = (event, cancelled) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    drag.el.style.transform = '';
    setDragId(null);
    setOverBin(null);
    if (cancelled) return;
    if (!drag.moved) {
      // a tap picks the item up; tapping a basket puts it there
      setSelected((current) => (current === drag.id ? null : drag.id));
      const item = task.items.find((entry) => entry.id === drag.id);
      sayWord(sortFeature === 'size' ? t.sizes[item.group] : tokenWord(item, sortFeature));
      return;
    }
    const bin = binAt(event.clientX, event.clientY);
    if (bin) dropInto(drag.id, bin);
  };

  const tapBin = (bin) => {
    if (status !== 'playing') return;
    if (selected) {
      dropInto(selected, bin);
      return;
    }
    sayWord(sortFeature === 'size' ? t.sizes[bin] : (sortFeature === 'shape' ? t.shapes[bin] : t.colors[bin]));
  };

  const goNext = () => {
    if (sessionWins.length >= SESSION_SIZE) {
      setShowSession(true);
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
    if (activity === 'ODD') say(t.odd);
    else if (activity === 'PATTERN') {
      if (status === 'playing' && phase === 'choose') playMelody(task, false, t.pattern);
      else say(t.pattern);
    } else say(sortIntro(task));
  };

  const shellProps = {
    className: 'lg',
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

  return (
    <GameShell {...shellProps}>
      <ShapeGradients />
      <GameBoard icon={ACTIVITY_ICON[activity]} className={`lg-board lg-${activity.toLowerCase()}`} data-answer={task.answer}>
        {activity === 'ODD' ? (
          <div className={`lg-odd-row lg-odd-${task.items.length}`}>
            {task.items.map((item, index) => {
              const isAnswer = item.id === task.answer;
              return (
                <button
                  key={`${taskSeq}-${item.id}`}
                  type="button"
                  className={`lg-odd-item ${faded.includes(item.id) ? 'is-faded' : ''} ${wobble === item.id ? 'is-wobble' : ''} ${hint && isAnswer ? 'is-hint' : ''} ${isDone && isAnswer ? 'is-winner' : ''} ${isDone && !isAnswer ? 'is-dancing' : ''}`}
                  style={{ '--i': index }}
                  onClick={() => chooseOdd(item)}
                  data-id={item.id}
                  aria-label={item.kind === 'pic' ? wordByImage[item.image] || item.image : `${t.colors[item.color]} ${t.shapes[item.shape]}`}
                >
                  <Token token={item} />
                </button>
              );
            })}
          </div>
        ) : null}

        {activity === 'PATTERN' ? (
          <div className="lg-string">
            <span className="lg-thread" aria-hidden="true" />
            {task.beads.map((bead, index) => (
              <span
                key={`${taskSeq}-${index}`}
                className={`lg-bead ${hopIndex === index ? 'is-hop' : ''} ${isDone ? 'is-dancing' : ''}`}
                style={{ '--i': index }}
              >
                <Token token={bead} />
              </span>
            ))}
            <span className={`lg-bead lg-bead-slot ${status !== 'playing' ? 'is-filled' : ''} ${hopIndex === task.beads.length ? 'is-hop' : ''} ${isDone ? 'is-dancing' : ''}`} style={{ '--i': task.beads.length }}>
              {status !== 'playing' ? <Token token={task.answerToken} /> : <span className="lg-slot-mark">?</span>}
            </span>
          </div>
        ) : null}

        {activity === 'SORT' ? (
          <div className={`lg-bins lg-bins-${task.bins.length}`}>
            {task.bins.map((bin, index) => {
              const inside = task.items.filter((item) => placed[item.id] === bin);
              return (
                <button
                  key={`${taskSeq}-${bin}`}
                  type="button"
                  className={`lg-bin lg-bin-${task.criterion} ${overBin === bin ? 'is-over' : ''} ${glowBin === bin ? 'is-hint' : ''} ${selected ? 'is-waiting' : ''} ${isDone ? 'is-dancing' : ''}`}
                  style={{
                    '--i': index,
                    '--bin-scale': task.criterion === 'size' ? { big: 1, medium: 0.86, small: 0.72 }[bin] : 1,
                    '--bin-main': task.criterion === 'color' ? COLORS[bin][1] : '#7f8cff',
                    '--bin-deep': task.criterion === 'color' ? COLORS[bin][2] : '#5560d8',
                    '--bin-light': task.criterion === 'color' ? COLORS[bin][0] : '#b9c0ff'
                  }}
                  data-bin={bin}
                  onClick={() => tapBin(bin)}
                  aria-label={task.criterion === 'size' ? t.sizes[bin] : (task.criterion === 'shape' ? t.shapes[bin] : t.colors[bin])}
                >
                  <span className="lg-bin-items">
                    {inside.map((item) => (
                      <span key={item.id} className="lg-bin-item" style={{ '--s': SIZE_SCALE[item.size] }}>
                        <Token token={item} />
                      </span>
                    ))}
                  </span>
                  <span className="lg-bin-front">
                    <span className="lg-bin-label">
                      {task.criterion === 'color' ? <ShapeArt shape="circle" color={bin} /> : null}
                      {task.criterion === 'shape' ? <ShapeArt shape={bin} color="blue" /> : null}
                      {task.criterion === 'size' ? (
                        <span className="lg-size-sticker" style={{ '--s': SIZE_SCALE[bin] }}>
                          <img src={pictureUrl(task.basePic)} alt="" draggable="false" />
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </GameBoard>

      {isDone ? <NextButton onClick={goNext}>{t.next}</NextButton> : null}

      {activity === 'PATTERN' && !isDone && status === 'playing' ? (
        <section className={`gs-shelf lg-choices ${phase === 'choose' ? '' : 'is-waiting'}`}>
          {task.choices.map((choice, index) => (
            <button
              key={`${taskSeq}-${choice.id}`}
              type="button"
              className={`lg-choice ${wobble === choice.id ? 'is-wobble' : ''} ${hint && choice.id === task.answer ? 'is-hint' : ''}`}
              style={{ '--i': index }}
              onClick={() => choosePattern(choice)}
              data-id={choice.id}
              aria-label={tokenWord(choice, patternFeature(task)) || choice.id}
            >
              <Token token={choice} />
            </button>
          ))}
        </section>
      ) : null}

      {activity === 'SORT' && !isDone ? (
        <section className="gs-shelf lg-tray">
          {task.items.map((item, index) => (
            placed[item.id] ? (
              <span key={`${taskSeq}-${item.id}`} className="lg-tray-spot" />
            ) : (
              <button
                key={`${taskSeq}-${item.id}`}
                type="button"
                className={`lg-tray-item ${dragId === item.id ? 'is-dragging' : ''} ${selected === item.id ? 'is-selected' : ''} ${wobble === item.id ? 'is-wobble' : ''}`}
                style={{ '--i': index, '--s': SIZE_SCALE[item.size] }}
                onPointerDown={(event) => onItemPointerDown(event, item)}
                onPointerMove={onItemPointerMove}
                onPointerUp={(event) => endDrag(event, false)}
                onPointerCancel={(event) => endDrag(event, true)}
                data-id={item.id}
                data-group={item.group}
                aria-label={sortFeature === 'size' ? t.sizes[item.group] : tokenWord(item, sortFeature)}
              >
                <span className="lg-tray-art"><Token token={item} /></span>
              </button>
            )
          ))}
        </section>
      ) : null}
    </GameShell>
  );
}
