import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell } from './GameShell';
import { pictureUrl } from '../lib/api';
import { ALPHABET_UNITS, getLetterName } from '../lib/letters';
import { recordSession, recordTask } from '../lib/progress';
import { sfxNote, sfxPlace, sfxTada, sfxWhoosh } from '../lib/sfx';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import './AlphabetBook.css';

// A picture alphabet to explore freely: hear the letter, see a word that starts with it,
// and trace it with a finger. Every five traced letters fill the star bar.
const SESSION_SIZE = 5;
const AS_WORD = { kind: 'word', rate: 0.85 };
const AS_TOKEN = { kind: 'token' };
const INK = ['#ff5e7e', '#ffaa2b', '#22c47a', '#3a8bff', '#8c64f0'];

const TEXT = {
  EN: { letterIs: 'This is the letter {letter}', trace: 'Trace the letter with your finger', sessionDone: 'Hooray! Five letters!', more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home', prev: 'Back', next: 'Next' },
  RU: { letterIs: 'Это буква {letter}', trace: 'Обведи букву пальчиком', sessionDone: 'Ура! Пять букв!', more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой', prev: 'Назад', next: 'Дальше' },
  KG: { letterIs: 'Бул {letter} тамгасы', trace: 'Тамганы манжаң менен тартып чык', sessionDone: 'Ура! Беш тамга!', more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө', prev: 'Артка', next: 'Кийинки' },
  UZ: { letterIs: 'Bu {letter} harfi', trace: 'Harfni barmoq bilan chizib chiq', sessionDone: 'Ura! Beshta harf!', more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga', prev: 'Orqaga', next: 'Keyingi' }
};

const spoken = (text) => String(text || '').replace(/-/g, '').toLowerCase();

// The first catalog word for every letter that has one.
const wordsByLetter = (vocabulary) => {
  const map = {};
  (vocabulary || []).forEach((item) => {
    if (!item?.image || !item?.text) return;
    const first = (item.units?.[0] || String(item.text).charAt(0)).toUpperCase();
    if (!map[first]) map[first] = { image: item.image, text: String(item.text).replace(/-/g, ''), units: item.units || [], word: spoken(item.text) };
  });
  return map;
};

export function AlphabetBook({ lang, vocabulary, userKey, speakText, onExit }) {
  const t = TEXT[lang] || TEXT.RU;
  const letters = useMemo(() => ALPHABET_UNITS[lang] || ALPHABET_UNITS.RU, [lang]);
  const words = useMemo(() => wordsByLetter(vocabulary), [vocabulary]);
  const [index, setIndex] = useState(0);
  const [traced, setTraced] = useState([]);
  const [sessionStart, setSessionStart] = useState(0);
  const [showSession, setShowSession] = useState(false);
  const [bubble, setBubble] = useState('');
  const [irbiMood, setIrbiMood] = useState('idle');
  const canvasRef = useRef(null);
  const drawRef = useRef(null);
  const stripRef = useRef(null);
  const timersRef = useRef([]);
  const inkRef = useRef(0);
  const letter = letters[index];
  const entry = words[letter];

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  useEffect(() => () => timersRef.current.forEach((id) => window.clearTimeout(id)), []);

  const say = useCallback((phrase, mood = 'talking') => {
    setBubble(phrase);
    setIrbiMood(mood);
    speakText?.(phrase, { interrupt: true });
    later(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
  }, [later, speakText]);

  const sayLetter = useCallback(() => {
    say(t.letterIs.replace('{letter}', getLetterName(lang, letter)));
  }, [lang, letter, say, t.letterIs]);

  const sayWord = useCallback(() => {
    if (entry) speakText?.(entry.word, { ...AS_WORD, interrupt: true });
  }, [entry, speakText]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext?.('2d');
    if (context) context.scale(ratio, ratio);
  }, []);

  // A new page: clean canvas, Irbi names the letter and the word.
  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    clearCanvas();
    sayLetter();
    if (entry) later(() => speakText?.(entry.word, { ...AS_WORD, interrupt: true }), 1900);
    // the tracing tip is spoken until the child has traced a first letter, then only shown
    later(() => (traced.length ? setBubble(t.trace) : say(t.trace, 'happy')), entry ? 3300 : 1900);
    stripRef.current?.querySelector('.ab-strip-item.is-current')?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang]);

  const turn = (step) => {
    sfxWhoosh();
    setIndex((value) => (value + step + letters.length) % letters.length);
  };

  // ----- finger tracing -----
  const pointAt = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDraw = (event) => {
    const context = canvasRef.current?.getContext?.('2d');
    if (!context) return;
    event.preventDefault();
    canvasRef.current.setPointerCapture?.(event.pointerId);
    inkRef.current = (inkRef.current + 1) % INK.length;
    context.strokeStyle = INK[inkRef.current];
    context.lineWidth = Math.max(14, canvasRef.current.getBoundingClientRect().width * 0.07);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const point = pointAt(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.stroke();
    drawRef.current = { context, length: 0, last: point };
    sfxNote(inkRef.current * 2);
  };

  const moveDraw = (event) => {
    const draw = drawRef.current;
    if (!draw) return;
    const point = pointAt(event);
    draw.length += Math.hypot(point.x - draw.last.x, point.y - draw.last.y);
    draw.last = point;
    draw.context.lineTo(point.x, point.y);
    draw.context.stroke();
  };

  const endDraw = () => {
    const draw = drawRef.current;
    drawRef.current = null;
    // a real stroke (not a dot) counts the letter as traced
    if (!draw || draw.length < 40 || traced.includes(letter)) return;
    const next = [...traced, letter];
    setTraced(next);
    recordTask(userKey, 'alphabet:BOOK', true);
    sfxPlace(letter, false);
    if (next.length - sessionStart >= SESSION_SIZE) {
      later(() => {
        setShowSession(true);
        recordSession(userKey, 'alphabet:BOOK');
        sfxTada();
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
        say(t.sessionDone, 'cheer');
      }, 500);
    }
  };

  const stars = Math.min(SESSION_SIZE, traced.length - sessionStart);
  const sessionLetters = traced.slice(sessionStart, sessionStart + SESSION_SIZE);

  const shellProps = {
    className: 'ab',
    stars,
    totalStars: SESSION_SIZE,
    labels: { home: t.home, listen: t.listen },
    onExit,
    onListen: sayLetter,
    bubble,
    irbiMood,
    onIrbiTap: sayLetter,
    session: {
      open: showSession,
      title: t.sessionDone,
      pictures: sessionLetters.map((item) => pictureUrl(words[item]?.image || 'star')),
      moreLabel: t.more,
      menuLabel: t.menu,
      onMore: () => {
        setShowSession(false);
        setSessionStart(traced.length);
        turn(1);
      },
      onMenu: onExit
    }
  };

  return (
    <GameShell {...shellProps}>
      <GameBoard icon="alphabet" className="ab-board" data-letter={letter}>
        <button type="button" className="ab-turn ab-turn-prev" onClick={() => turn(-1)} aria-label={t.prev}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="ab-page" key={letter}>
          <div className={`ab-letter-card ${traced.includes(letter) ? 'is-traced' : ''}`}>
            <button type="button" className="ab-letter" onClick={sayLetter} aria-label={letter}>{letter}</button>
            <canvas
              ref={canvasRef}
              className="ab-canvas"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
            />
            <button type="button" className="ab-hear" onClick={sayLetter} aria-label={t.listen}>
              <img src={pictureUrl('speaker')} alt="" />
            </button>
          </div>

          <button type="button" className="ab-word-card" onClick={sayWord} disabled={!entry} aria-label={entry?.word || letter}>
            <img src={pictureUrl(entry?.image || 'alphabet')} alt="" draggable="false" />
            {entry ? (
              <span className="ab-word">
                <b>{entry.units[0] || entry.text.charAt(0)}</b>
                {entry.text.slice((entry.units[0] || entry.text.charAt(0)).length)}
              </span>
            ) : null}
          </button>
        </div>

        <button type="button" className="ab-turn ab-turn-next" onClick={() => turn(1)} aria-label={t.next}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </GameBoard>

      <nav className="gs-shelf ab-strip" ref={stripRef}>
        {letters.map((item, position) => (
          <button
            key={item}
            type="button"
            className={`ab-strip-item ${position === index ? 'is-current' : ''} ${traced.includes(item) ? 'is-traced' : ''}`}
            onClick={() => setIndex(position)}
          >
            {item}
          </button>
        ))}
      </nav>
    </GameShell>
  );
}

// Everything the alphabet says in `lang`, for the offline voice pack.
export const voicePhrases = (lang, { words = [] } = {}) => {
  const t = TEXT[lang] || TEXT.RU;
  const out = textPhrases(t, [...LABEL_KEYS, 'prev']);
  (ALPHABET_UNITS[lang] || []).forEach((unit) => {
    out.push(sayPhrase(t.letterIs.replace('{letter}', getLetterName(lang, unit))), wordPhrase(unit, AS_TOKEN));
  });
  Object.values(wordsByLetter(words)).forEach((item) => out.push(wordPhrase(item.word, AS_WORD)));
  return out;
};
