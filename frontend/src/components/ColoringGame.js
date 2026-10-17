import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { pictureUrl } from '../lib/api';
import { isLevelLocked, recordSession, recordTask } from '../lib/progress';
import { sfxBoop, sfxNote, sfxPlace, sfxTada } from '../lib/sfx';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import './ColoringGame.css';

// Color by number: pick a paint pot, then paint every square that shows its number.
const SESSION_SIZE = 3;
const AS_WORD = { kind: 'word', rate: 0.85 };

// [fill, darker edge]; id = the number written in the squares
const PAINTS = {
  1: ['#ff6b6b', '#d9484f'], 2: ['#ffd43b', '#e0a800'], 3: ['#4dabf7', '#1c7ed6'], 4: ['#51cf66', '#2b9a3e'],
  5: ['#9775fa', '#6741d9'], 6: ['#ff922b', '#e8590c'], 7: ['#b07a50', '#7d5232'], 8: ['#f783ac', '#d6336c']
};

const COLOR_NAMES = {
  EN: { 1: 'red', 2: 'yellow', 3: 'blue', 4: 'green', 5: 'purple', 6: 'orange', 7: 'brown', 8: 'pink' },
  RU: { 1: 'красный', 2: 'жёлтый', 3: 'синий', 4: 'зелёный', 5: 'фиолетовый', 6: 'оранжевый', 7: 'коричневый', 8: 'розовый' },
  KG: { 1: 'кызыл', 2: 'сары', 3: 'көк', 4: 'жашыл', 5: 'кызгылт көк', 6: 'кызгылт сары', 7: 'күрөң', 8: 'кызгылт' },
  UZ: { 1: 'qizil', 2: 'sariq', 3: 'ko‘k', 4: 'yashil', 5: 'binafsha', 6: 'to‘q sariq', 7: 'jigarrang', 8: 'pushti' }
};

// 8×8 pictures; 0 is an empty square. Level 1 uses two paints, level 3 up to four.
const PICTURES = [
  { id: 'sun', level: 1, grid: ['00600600', '06022060', '60222206', '02222220', '02222220', '60222206', '06022060', '00600600'] },
  { id: 'heart', level: 1, grid: ['01100110', '18111111', '18111111', '11111111', '01111110', '00111100', '00011000', '00000000'] },
  { id: 'tree', level: 1, grid: ['00444400', '04444440', '44444444', '44444444', '04444440', '00077000', '00077000', '00777700'] },
  { id: 'apple', level: 2, grid: ['00070440', '00074400', '01171100', '11111110', '11111110', '11111110', '01111100', '00111000'] },
  { id: 'house', level: 2, grid: ['00011000', '00111100', '01111110', '11111111', '02222220', '02322320', '02222220', '02233220'] },
  { id: 'flower', level: 2, grid: ['00088000', '00888800', '08822880', '08822880', '00888800', '00044000', '04444000', '00044000'] },
  { id: 'fish', level: 2, grid: ['00000000', '00333000', '03333305', '32333355', '33333355', '03333305', '00333000', '00000000'] },
  { id: 'cat', level: 2, grid: ['60000006', '66000066', '68666686', '66666666', '64466446', '66688666', '06666660', '00666600'] },
  { id: 'butterfly', level: 2, grid: ['55000055', '58500585', '55577555', '05577550', '05577550', '58577585', '55577555', '05000050'] },
  { id: 'car', level: 3, grid: ['00000000', '00111100', '01331310', '11111111', '21111111', '11111111', '05500550', '05500550'] },
  { id: 'duck', level: 3, grid: ['00220000', '02526000', '02226000', '00220000', '22222220', '22222222', '32222223', '33333333'] },
  { id: 'rocket', level: 3, grid: ['00011000', '00111100', '00333300', '00322300', '00322300', '01333310', '11333311', '00666600'] }
];

const PICTURE_NAMES = {
  EN: { sun: 'sun', heart: 'heart', tree: 'tree', apple: 'apple', house: 'house', flower: 'flower', fish: 'fish', cat: 'cat', butterfly: 'butterfly', car: 'car', duck: 'duck', rocket: 'rocket' },
  RU: { sun: 'солнце', heart: 'сердце', tree: 'дерево', apple: 'яблоко', house: 'домик', flower: 'цветок', fish: 'рыбка', cat: 'котик', butterfly: 'бабочка', car: 'машина', duck: 'утка', rocket: 'ракета' },
  KG: { sun: 'күн', heart: 'жүрөк', tree: 'дарак', apple: 'алма', house: 'үй', flower: 'гүл', fish: 'балык', cat: 'мышык', butterfly: 'көпөлөк', car: 'машина', duck: 'өрдөк', rocket: 'ракета' },
  UZ: { sun: 'quyosh', heart: 'yurak', tree: 'daraxt', apple: 'olma', house: 'uy', flower: 'gul', fish: 'baliq', cat: 'mushuk', butterfly: 'kapalak', car: 'mashina', duck: 'o‘rdak', rocket: 'raketa' }
};

const TEXT = {
  EN: { intro: 'Pick a paint and color the squares with the same number', sessionDone: 'Hooray! What an artist!', next: 'Next', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home', praise: ['Beautiful!', 'Well done!', 'Amazing!', 'Super!'] },
  RU: { intro: 'Выбери краску и раскрась клеточки с такой же цифрой', sessionDone: 'Ура! Ты настоящий художник!', next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой', praise: ['Красота!', 'Молодец!', 'Отлично!', 'Супер!'] },
  KG: { intro: 'Боёкту танда да, ошол эле сандагы клеткаларды боё', sessionDone: 'Ура! Сен чыныгы сүрөтчүсүң!', next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө', praise: ['Сонун!', 'Азамат!', 'Мыкты!', 'Баракелде!'] },
  UZ: { intro: 'Bo‘yoqni tanla va xuddi shu raqamli kataklarni bo‘ya', sessionDone: 'Ura! Sen haqiqiy rassomsan!', next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga', praise: ['Chiroyli!', 'Barakalla!', 'Ajoyib!', 'Zo‘r!'] }
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const levelStorageKey = (userKey) => `ll_color_level_${userKey}_PAINT`;
const readLevel = (key) => {
  try {
    const value = Number(localStorage.getItem(key));
    return value >= 1 && value <= 3 ? value : 1;
  } catch {
    return 1;
  }
};

export const buildColoringTask = (level, recent = []) => {
  // the top level still mixes in some middle pictures so a session never repeats
  const pool = PICTURES.filter((picture) => picture.level === level || (level === 3 && picture.level === 2));
  const fresh = pool.filter((picture) => !recent.includes(picture.id));
  const picture = pick(fresh.length ? fresh : pool);
  const cells = picture.grid.join('').split('').map(Number);
  const paints = Array.from(new Set(cells.filter(Boolean))).sort((a, b) => a - b);
  return { id: picture.id, cells, paints, answer: picture.id };
};

export function ColoringGame({ lang, userKey, speakText, onSessionComplete, onExit }) {
  const t = TEXT[lang] || TEXT.RU;
  const colorNames = COLOR_NAMES[lang] || COLOR_NAMES.RU;
  const names = PICTURE_NAMES[lang] || PICTURE_NAMES.RU;
  const storageKey = levelStorageKey(userKey);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [task, setTask] = useState(null);
  const [taskSeq, setTaskSeq] = useState(0);
  const [painted, setPainted] = useState({});
  const [paint, setPaint] = useState(null);
  const [wobble, setWobble] = useState(null);
  const [hintPaint, setHintPaint] = useState(null);
  const [status, setStatus] = useState('playing');
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [bubble, setBubble] = useState('');
  const [irbiMood, setIrbiMood] = useState('idle');
  const levelRef = useRef(level);
  levelRef.current = level;
  const recentRef = useRef([]);
  const mistakesRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const paintingRef = useRef(false);
  const paintedRef = useRef({});

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  useEffect(() => () => timersRef.current.forEach((id) => window.clearTimeout(id)), []);

  const say = useCallback((rawPhrase, mood = 'talking') => {
    const phrase = capitalize(rawPhrase);
    setBubble(phrase);
    setIrbiMood(mood);
    speakText?.(phrase, { interrupt: true });
    later(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
  }, [later, speakText]);

  const sayColor = useCallback((id) => {
    speakText?.(colorNames[id], { ...AS_WORD, interrupt: true });
  }, [colorNames, speakText]);

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    const next = buildColoringTask(levelRef.current, recentRef.current);
    recentRef.current = [next.id, ...recentRef.current].slice(0, 4);
    setTask(next);
    setPainted({});
    paintedRef.current = {};
    setPaint(next.paints[0]);
    setStatus('playing');
    setHintPaint(null);
    mistakesRef.current = 0;
    later(() => say(t.intro), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSeq]);

  const adaptLevel = (wasClean) => {
    recordTask(userKey, 'color:PAINT', wasClean);
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
      if (mistakesRef.current >= 6 && next > 1) next -= 1;
    }
    if (next !== levelRef.current) {
      setLevel(next);
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // keep in memory only
      }
    }
  };

  const finish = () => {
    adaptLevel(mistakesRef.current <= 2);
    setStatus('done');
    sfxPlace('color', true);
    later(() => sfxTada(), 250);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.45 }, disableForReducedMotion: true });
    say(`${names[task.id]}!`, 'happy');
    later(() => say(pick(t.praise), 'cheer'), 1700);
    setSessionWins((prev) => [...prev, task.id]);
  };

  const paintCell = (index, fromDrag) => {
    if (status !== 'playing' || !task) return;
    const target = task.cells[index];
    if (!target || paintedRef.current[index]) return;
    if (target !== paint) {
      if (fromDrag) return;
      mistakesRef.current += 1;
      sfxBoop();
      setWobble(index);
      setHintPaint(target);
      sayColor(target);
      later(() => setWobble(null), 450);
      later(() => setHintPaint(null), 1800);
      return;
    }
    const next = { ...paintedRef.current, [index]: true };
    paintedRef.current = next;
    setPainted(next);
    sfxNote(Object.keys(next).length % 8);
    const total = task.cells.filter(Boolean).length;
    if (Object.keys(next).length === total) finish();
  };

  const cellAt = (event) => {
    const el = document.elementFromPoint?.(event.clientX, event.clientY);
    return el?.dataset?.cell !== undefined ? Number(el.dataset.cell) : null;
  };

  const onGridDown = (event) => {
    paintingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const index = cellAt(event);
    if (index !== null) paintCell(index, false);
  };

  const onGridMove = (event) => {
    if (!paintingRef.current) return;
    const index = cellAt(event);
    if (index !== null) paintCell(index, true);
  };

  const onGridUp = () => {
    paintingRef.current = false;
  };

  const choosePaint = (id) => {
    setPaint(id);
    sayColor(id);
  };

  const goNext = () => {
    if (sessionWins.length >= SESSION_SIZE) {
      setShowSession(true);
      recordSession(userKey, 'color:PAINT');
      sfxTada();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
      say(t.sessionDone, 'cheer');
      onSessionComplete?.({ activity: 'PAINT' });
      return;
    }
    setTaskSeq((value) => value + 1);
  };

  const shellProps = {
    className: 'cg',
    stars: sessionWins.length,
    totalStars: SESSION_SIZE,
    labels: { home: t.home, listen: t.listen },
    onExit,
    onListen: () => say(t.intro),
    bubble,
    irbiMood,
    onIrbiTap: () => say(t.intro),
    session: {
      open: showSession,
      title: t.sessionDone,
      pictures: sessionWins.map((id) => pictureUrl(id)),
      moreLabel: t.more,
      menuLabel: t.menu,
      onMore: () => {
        setShowSession(false);
        setSessionWins([]);
        setTaskSeq((value) => value + 1);
      },
      onMenu: onExit
    }
  };

  if (!task) return <GameShell {...shellProps} />;
  const isDone = status === 'done';

  return (
    <GameShell {...shellProps}>
      <GameBoard icon="palette" className="cg-board" data-answer={task.id}>
        <div
          className={`cg-grid ${isDone ? 'is-done' : ''}`}
          onPointerDown={onGridDown}
          onPointerMove={onGridMove}
          onPointerUp={onGridUp}
          onPointerCancel={onGridUp}
          role="grid"
          aria-label={names[task.id]}
        >
          {task.cells.map((value, index) => {
            const isPainted = painted[index] || isDone;
            const style = value
              ? { '--fill': PAINTS[value][0], '--edge': PAINTS[value][1], '--i': index }
              : undefined;
            return (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`${taskSeq}-${index}`}
                className={`cg-cell ${value ? '' : 'is-empty'} ${isPainted ? 'is-painted' : ''} ${value && value === paint && !isPainted ? 'is-target' : ''} ${wobble === index ? 'is-wobble' : ''}`}
                style={style}
                data-cell={value ? index : undefined}
              >
                {value && !isPainted ? value : ''}
              </span>
            );
          })}
        </div>
      </GameBoard>

      {isDone ? <NextButton onClick={goNext}>{t.next}</NextButton> : (
        <section className="gs-shelf cg-paints">
          {task.paints.map((id, index) => (
            <button
              key={`${taskSeq}-${id}`}
              type="button"
              className={`cg-pot ${paint === id ? 'is-on' : ''} ${hintPaint === id ? 'is-hint' : ''}`}
              style={{ '--fill': PAINTS[id][0], '--edge': PAINTS[id][1], '--i': index }}
              onClick={() => choosePaint(id)}
              aria-label={`${id} ${colorNames[id]}`}
              data-paint={id}
            >
              <span className="cg-pot-number">{id}</span>
            </button>
          ))}
        </section>
      )}
    </GameShell>
  );
}

// Everything the coloring game says in `lang`, for the offline voice pack.
export const voicePhrases = (lang) => {
  const out = textPhrases(TEXT[lang] || TEXT.RU, LABEL_KEYS);
  Object.values(COLOR_NAMES[lang] || COLOR_NAMES.RU).forEach((name) => out.push(wordPhrase(name, AS_WORD)));
  Object.values(PICTURE_NAMES[lang] || PICTURE_NAMES.RU).forEach((name) => out.push(sayPhrase(`${name}!`)));
  return out;
};
