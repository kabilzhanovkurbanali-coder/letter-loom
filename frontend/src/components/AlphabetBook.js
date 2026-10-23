import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell } from './GameShell';
import { LetterTrace } from './LetterTrace';
import { colorFor } from './LivingLetter';
import { pictureUrl } from '../lib/api';
import {
  FULL_ALPHABETS, NAME_SPEECH, SOUND_SPEECH, displayUnit, getLetterName, getLetterSound, letterSpeech, readLetterMode, writeLetterMode
} from '../lib/letters';
import { recordSession, recordTask } from '../lib/progress';
import { sfxNote, sfxPlace, sfxTada, sfxWhoosh } from '../lib/sfx';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import './AlphabetBook.css';

// A picture alphabet to explore freely: hear the letter (its sound or its name), see a word with
// it, and trace it along a dotted road with arrows. Every five traced letters fill the star bar.
const SESSION_SIZE = 5;
const AS_WORD = { kind: 'word', rate: 0.85 };
const HINT_GAP_MS = 7000;

const TEXT = {
  EN: {
    letterIs: 'This is the letter {letter}', trace: 'Trace the letter with your finger',
    startHere: 'Start at the green dot', followPath: 'Keep your finger on the path',
    praise: ['Great job!', 'Beautiful!', 'Well done!', 'Super!'], sessionDone: 'Hooray! Five letters!',
    modeSound: 'Sound', modeName: 'Letter', again: 'Again',
    more: 'More', menu: 'Menu', listen: 'Listen again', home: 'Home', prev: 'Back', next: 'Next'
  },
  RU: {
    letterIs: 'Это буква {letter}', trace: 'Обведи букву пальчиком',
    startHere: 'Начни с зелёной точки', followPath: 'Веди пальчиком по дорожке',
    praise: ['Молодец!', 'Красиво!', 'Отлично!', 'Здорово!'], sessionDone: 'Ура! Пять букв!',
    modeSound: 'Звук', modeName: 'Буква', again: 'Ещё раз',
    more: 'Ещё', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой', prev: 'Назад', next: 'Дальше'
  },
  KG: {
    letterIs: 'Бул {letter} тамгасы', trace: 'Тамганы манжаң менен тартып чык',
    startHere: 'Жашыл чекиттен башта', followPath: 'Манжаңды жол менен жүргүз',
    praise: ['Азамат!', 'Кооз!', 'Мыкты!', 'Сонун!'], sessionDone: 'Ура! Беш тамга!',
    modeSound: 'Тыбыш', modeName: 'Тамга', again: 'Дагы бир жолу',
    more: 'Дагы', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө', prev: 'Артка', next: 'Кийинки'
  },
  UZ: {
    letterIs: 'Bu {letter} harfi', trace: 'Harfni barmoq bilan chizib chiq',
    startHere: 'Yashil nuqtadan boshla', followPath: 'Barmog‘ingni yo‘lakcha bo‘ylab yurgiz',
    praise: ['Barakalla!', 'Chiroyli!', 'Zo‘r!', 'Ofarin!'], sessionDone: 'Ura! Beshta harf!',
    modeSound: 'Tovush', modeName: 'Harf', again: 'Yana bir marta',
    more: 'Yana', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga', prev: 'Orqaga', next: 'Keyingi'
  }
};

const spoken = (text) => String(text || '').replace(/-/g, '').toLowerCase();
const sameUnit = (unit) => String(unit || '').toUpperCase().replace(/[‘’ʻ`]/g, "'");

// For every letter a catalog word that starts with it, or at least has it (Ъ, Ь, Ы).
const wordsByLetter = (vocabulary, letters) => {
  const items = (vocabulary || []).filter((item) => item?.image && item?.text).map((item) => {
    const text = String(item.text).replace(/-/g, '');
    return { image: item.image, units: (item.units?.length ? item.units : text.split('')).map(sameUnit), word: spoken(item.text) };
  });
  const map = {};
  letters.forEach((letter) => {
    const key = sameUnit(letter);
    const entry = items.find((item) => item.units[0] === key) || items.find((item) => item.units.includes(key));
    if (entry) map[letter] = entry;
  });
  return map;
};

export function AlphabetBook({ lang, vocabulary, userKey, speakText, onExit }) {
  const t = TEXT[lang] || TEXT.RU;
  const letters = useMemo(() => FULL_ALPHABETS[lang] || FULL_ALPHABETS.RU, [lang]);
  const words = useMemo(() => wordsByLetter(vocabulary, letters), [vocabulary, letters]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState(() => readLetterMode());
  const [traced, setTraced] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [tryKey, setTryKey] = useState(0);
  const [sessionStart, setSessionStart] = useState(0);
  const [showSession, setShowSession] = useState(false);
  const [bubble, setBubble] = useState('');
  const [irbiMood, setIrbiMood] = useState('idle');
  const stripRef = useRef(null);
  const timersRef = useRef([]);
  const moodTimerRef = useRef(null);
  const lastHintRef = useRef(0);
  const letter = letters[index];
  const entry = words[letter];
  const colors = colorFor(letter);
  const sound = getLetterSound(lang, letter);
  const name = getLetterName(lang, letter);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => {
    clearTimers();
    window.clearTimeout(moodTimerRef.current);
  }, [clearTimers]);

  const talk = useCallback((mood, length) => {
    setIrbiMood(mood);
    window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setIrbiMood('idle'), Math.min(4200, 900 + length * 65));
  }, []);

  // display: what the bubble shows when it differs from what is spoken ("М", spoken "эм")
  const say = useCallback((phrase, mood = 'talking', display = phrase) => {
    setBubble(display);
    talk(mood, phrase.length);
    speakText?.(phrase, { interrupt: true });
  }, [speakText, talk]);

  // The letter itself: its sound ("ммм") or its name ("эм"), as the grown-ups chose.
  const sayLetter = useCallback((letterMode = mode) => {
    const speech = letterSpeech(lang, letter, letterMode);
    setBubble(letterMode === 'name' ? t.letterIs.replace('{letter}', displayUnit(letter)) : `${displayUnit(letter)} — ${sound}`);
    talk('talking', 8);
    speakText?.(speech.text, { ...speech.options, interrupt: true });
  }, [lang, letter, mode, sound, speakText, t.letterIs, talk]);

  // In name mode Irbi says a whole sentence; in sound mode just the sound, the way reading starts.
  const introduce = useCallback(() => {
    if (mode === 'name') say(t.letterIs.replace('{letter}', name), 'talking', t.letterIs.replace('{letter}', displayUnit(letter)));
    else sayLetter('sound');
  }, [letter, mode, name, say, sayLetter, t.letterIs]);

  const sayWord = useCallback(() => {
    if (entry) speakText?.(entry.word, { ...AS_WORD, interrupt: true });
  }, [entry, speakText]);

  // A new page: a fresh road, Irbi says the letter and the word.
  useEffect(() => {
    clearTimers();
    setIsDone(false);
    introduce();
    const wordAt = mode === 'name' ? 1900 : 1300;
    if (entry) later(() => speakText?.(entry.word, { ...AS_WORD, interrupt: true }), wordAt);
    // the tracing tip is spoken until the child has traced a first letter, then only shown
    later(() => (traced.length ? setBubble(t.trace) : say(t.trace, 'happy')), entry ? wordAt + 1400 : wordAt);
    stripRef.current?.querySelector('.ab-strip-item.is-current')?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang]);

  const turn = (step) => {
    sfxWhoosh();
    setTryKey(0);
    setIndex((value) => (value + step + letters.length) % letters.length);
  };

  const chooseMode = (next) => {
    setMode(next);
    writeLetterMode(next);
    sayLetter(next);
  };

  const again = () => {
    clearTimers();
    setIsDone(false);
    setTryKey((value) => value + 1);
    say(t.trace, 'happy');
  };

  // ----- the tracing road -----
  const onHint = (kind) => {
    const phrase = kind === 'path' ? t.followPath : t.startHere;
    const now = Date.now();
    if (now - lastHintRef.current < HINT_GAP_MS) {
      setBubble(phrase);
      return;
    }
    lastHintRef.current = now;
    say(phrase);
  };

  const onDone = () => {
    clearTimers();
    setIsDone(true);
    sfxPlace(letter, true);
    say(t.praise[Math.floor(Math.random() * t.praise.length)], 'cheer');
    later(() => sayLetter(), 1300);
    if (entry) later(sayWord, 2500);
    if (traced.includes(letter)) return;
    const next = [...traced, letter];
    setTraced(next);
    recordTask(userKey, 'alphabet:BOOK', true);
    if (next.length - sessionStart >= SESSION_SIZE) {
      later(() => {
        setShowSession(true);
        recordSession(userKey, 'alphabet:BOOK');
        sfxTada();
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
        say(t.sessionDone, 'cheer');
      }, 3600);
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
    onListen: introduce,
    bubble,
    irbiMood,
    onIrbiTap: introduce,
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
          <div className="ab-trace-wrap">
            <div className={`ab-trace-card ${isDone ? 'is-done' : ''}`} style={{ '--c1': colors[0], '--c2': colors[1] }}>
              <LetterTrace
                unit={letter}
                colors={colors}
                resetKey={tryKey}
                onTick={(step) => sfxNote(step)}
                onStroke={(stroke, total) => (stroke < total - 1 ? sfxPlace(`${letter}${stroke}`) : null)}
                onHint={onHint}
                onDone={onDone}
                onTapDone={() => sayLetter()}
              />
            </div>
            {/* outside the card, so it never covers the letter */}
            {isDone ? (
              <button type="button" className="ab-again" onClick={again} aria-label={t.again} title={t.again}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12a6.5 6.5 0 1 0 2-4.7M5.5 4v4h4" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ) : null}
          </div>

          <div className="ab-side">
            <button type="button" className="ab-word-card" onClick={sayWord} disabled={!entry} aria-label={entry?.word || displayUnit(letter)}>
              <img src={pictureUrl(entry?.image || 'alphabet')} alt="" draggable="false" />
              {entry ? (
                <span className="ab-word">
                  {entry.units.map((unit, position) => (
                    unit === sameUnit(letter)
                      ? <b key={position} style={{ color: colors[1] }}>{displayUnit(unit)}</b>
                      : <span key={position}>{displayUnit(unit)}</span>
                  ))}
                </span>
              ) : null}
            </button>

            <div className="ab-mode" role="radiogroup" aria-label={`${t.modeSound} / ${t.modeName}`}>
              {[['sound', t.modeSound, sound], ['name', t.modeName, name]].map(([value, label, example]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  className={`ab-mode-btn ${mode === value ? 'is-on' : ''}`}
                  onClick={() => chooseMode(value)}
                >
                  <b>{label}</b>
                  <span>{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" className={`ab-turn ab-turn-next ${isDone ? 'is-ready' : ''}`} onClick={() => turn(1)} aria-label={t.next}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </GameBoard>

      <nav className="gs-shelf ab-strip" ref={stripRef}>
        {letters.map((item, position) => (
          <button
            key={item}
            type="button"
            className={`ab-strip-item ${position === index ? 'is-current' : ''} ${traced.includes(item) ? 'is-traced' : ''}`}
            onClick={() => {
              setTryKey(0);
              setIndex(position);
            }}
          >
            {displayUnit(item)}
          </button>
        ))}
      </nav>
    </GameShell>
  );
}

// Everything the alphabet says in `lang`, for the offline voice pack.
export const voicePhrases = (lang, { words = [] } = {}) => {
  const t = TEXT[lang] || TEXT.RU;
  const letters = FULL_ALPHABETS[lang] || FULL_ALPHABETS.RU;
  const out = textPhrases(t, [...LABEL_KEYS, 'prev', 'again', 'modeSound', 'modeName']);
  letters.forEach((unit) => {
    out.push(
      sayPhrase(t.letterIs.replace('{letter}', getLetterName(lang, unit))),
      wordPhrase(unit, NAME_SPEECH),
      wordPhrase(getLetterSound(lang, unit), SOUND_SPEECH)
    );
  });
  Object.values(wordsByLetter(words, letters)).forEach((item) => out.push(wordPhrase(item.word, AS_WORD)));
  return out;
};
