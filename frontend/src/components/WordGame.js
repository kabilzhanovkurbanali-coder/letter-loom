import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { LivingLetter } from './LivingLetter';
import { normalizeImageUrl, pictureUrl } from '../lib/api';
import { rowExtent } from '../lib/glyphs';
import {
  ALPHABET_UNITS, NAME_SPEECH, SOUND_SPEECH, displayUnit, getLetterName, getLetterSound, letterSpeech, readLetterMode
} from '../lib/letters';
import { isLevelLocked, recordSession, recordTask } from '../lib/progress';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import { sfxBoop, sfxPick, sfxPlace, sfxTada, sfxWhoosh } from '../lib/sfx';
import './WordGame.css';

// A short session keeps young children focused: 5 words, then a celebration.
const SESSION_SIZE = 5;
// Adaptive difficulty. Ghost letters stay in the slots at every level.
// 1: short words, tap-to-place. 2: longer words, one extra tile. 3: any length, two extra tiles.
const MAX_UNITS_BY_LEVEL = { WORDS: [0, 4, 6, Infinity], SYLLABLES: [0, 2, 3, Infinity] };
const DISTRACTORS_BY_LEVEL = [0, 0, 1, 2];
const IDLE_HINT_MS = 9000;
const SPEAK_WORD = { kind: 'word', rate: 0.85 };
const SPEAK_TOKEN = { kind: 'token' };
// sounding a built word out: one letter sound per beat, then the whole word
const SOUND_BEAT_MS = 760;

const TEXT = {
  EN: {
    build: 'Build the word', buildSyllables: 'Build the word from syllables',
    findLetter: 'Find the letter', findSyllable: 'Find the syllable', findSound: 'Find the sound {sound}',
    next: 'Next', more: 'More words', menu: 'Menu', listen: 'Listen again', home: 'Home',
    sessionDone: 'Hooray! Five words done!',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!']
  },
  RU: {
    build: 'Собери слово', buildSyllables: 'Собери слово из слогов',
    findLetter: 'Найди букву', findSyllable: 'Найди слог', findSound: 'Найди звук {sound}',
    next: 'Дальше', more: 'Ещё слова', menu: 'Меню', listen: 'Послушать ещё', home: 'Домой',
    sessionDone: 'Ура! Пять слов готово!',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!']
  },
  KG: {
    build: 'Сөздү чогулт', buildSyllables: 'Сөздү муундардан чогулт',
    findLetter: 'Тамганы тап', findSyllable: 'Муунду тап', findSound: '{sound} тыбышын тап',
    next: 'Кийинки', more: 'Дагы сөз', menu: 'Меню', listen: 'Дагы угуу', home: 'Үйгө',
    sessionDone: 'Ура! Беш сөз даяр!',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!']
  },
  UZ: {
    build: 'So‘zni yig‘', buildSyllables: 'So‘zni bo‘g‘inlardan yig‘',
    findLetter: 'Harfni top', findSyllable: 'Bo‘g‘inni top', findSound: '{sound} tovushini top',
    next: 'Keyingi', more: 'Yana so‘zlar', menu: 'Menyu', listen: 'Yana tinglash', home: 'Uyga',
    sessionDone: 'Ura! Beshta so‘z tayyor!',
    praise: ['Barakalla!', 'Zo‘r!', 'Ajoyib!', 'Ofarin!', 'Qoyil!']
  }
};

// How the picture "comes alive" once the word is built.
const ALIVE_KINDS = {
  fly: ['bird', 'duck', 'plane', 'airplane', 'butterfly', 'bee', 'eagle', 'owl', 'chick', 'magpie', 'titmouse', 'balloon', 'kite', 'rocket', 'cloud', 'leaf', 'letter', 'paper'],
  swim: ['fish', 'dolphin', 'whale', 'boat', 'ship', 'sea', 'ocean', 'turtle', 'octopus', 'crab', 'river', 'water', 'duck'],
  drive: ['car', 'bus', 'train', 'bicycle', 'taxi', 'tractor', 'motor', 'garage'],
  hop: ['rabbit', 'frog', 'kangaroo', 'ball', 'cat', 'dog', 'mouse', 'horse', 'lion', 'tiger', 'bear', 'monkey', 'squirrel', 'baby', 'sheep', 'goat', 'pig', 'cow', 'chicken', 'rooster', 'toy', 'egg'],
  spin: ['sun', 'star', 'flower', 'clock', 'wheel', 'globe', 'world', 'sunflower', 'circle', 'snow', 'moon', 'watermelon', 'orange', 'apple']
};

const aliveKindFor = (imageKey) => {
  const key = String(imageKey || '').replace(/\d+$/, '');
  const match = Object.entries(ALIVE_KINDS).find(([, keys]) => keys.includes(key));
  return match ? match[0] : 'pop';
};

const imageKeyOf = (word) => word?.image || String(word?.img || '').split('/').pop()?.replace(/\.\w+$/, '') || '';

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const levelStorageKey = (userKey, lang, mode) => `ll_word_level_${userKey}_${lang}_${mode}`;

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
    // progress in memory only
  }
};

const unitsOf = (word) => (word?.units?.length ? word.units : String(word?.text || '').split(''));

export const pickNextIndex = (levels, fromIdx, level, mode, solvedIds) => {
  const total = levels.length;
  if (!total) return 0;
  const maxUnits = (MAX_UNITS_BY_LEVEL[mode] || MAX_UNITS_BY_LEVEL.WORDS)[level] || Infinity;
  const solved = new Set(solvedIds || []);
  const fits = (item) => unitsOf(item).length <= maxUnits;
  const passes = [
    (item) => fits(item) && !solved.has(item.id),
    fits,
    () => true
  ];
  for (const accept of passes) {
    for (let step = 1; step <= total; step += 1) {
      const idx = (((fromIdx + step) % total) + total) % total;
      if (accept(levels[idx])) return idx;
    }
  }
  return (fromIdx + 1) % total;
};

const buildRound = (word, level, lang, mode, levels) => {
  const units = unitsOf(word).map((unit) => String(unit).toUpperCase());
  const used = new Set(units);
  const pool = mode === 'SYLLABLES'
    ? Array.from(new Set(levels.flatMap((item) => unitsOf(item).map((u) => String(u).toUpperCase())))).filter((u) => !used.has(u))
    : (ALPHABET_UNITS[lang] || ALPHABET_UNITS.RU).filter((u) => !used.has(u));
  const extras = shuffle(pool).slice(0, DISTRACTORS_BY_LEVEL[level] || 0);
  const tiles = shuffle([
    ...units.map((unit, index) => ({ id: `u${index}`, unit })),
    ...extras.map((unit, index) => ({ id: `x${index}`, unit }))
  ]);
  return { wordId: word?.id, units, tiles };
};

const spokenWord = (word) => String(word?.text || '').replace(/-/g, '').toLowerCase();
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

// How one tile is spoken: a syllable as itself, a letter as its sound or its name.
const unitSpeech = (lang, unit, mode, letterMode) => (mode === 'SYLLABLES'
  ? { text: unit, options: SPEAK_TOKEN }
  : letterSpeech(lang, unit, letterMode));

export function WordGame({
  lang, playMode, levels, currentIdx, setCurrentIdx, solvedIds,
  userKey, speakText, prefetchSpeech, onWordComplete, onSessionComplete, onExit
}) {
  const t = TEXT[lang] || TEXT.RU;
  const mode = playMode === 'SYLLABLES' ? 'SYLLABLES' : 'WORDS';
  const storageKey = levelStorageKey(userKey, lang, mode);
  const [level, setLevel] = useState(() => readLevel(storageKey));
  const [round, setRound] = useState(null);
  const [placed, setPlaced] = useState({});
  const [status, setStatus] = useState('playing');
  const [hintTileId, setHintTileId] = useState(null);
  const [hintSlot, setHintSlot] = useState(null);
  const [wobbleSlot, setWobbleSlot] = useState(null);
  const [nudgeTileId, setNudgeTileId] = useState(null);
  const [sessionWins, setSessionWins] = useState([]);
  const [showSession, setShowSession] = useState(false);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const [letterMode] = useState(() => readLetterMode());
  const [sounding, setSounding] = useState(-1);
  const [isReading, setIsReading] = useState(false);
  const [hop, setHop] = useState({ index: -1, n: 0 });
  const mistakesRef = useRef(0);
  const tapMissRef = useRef(0);
  const streakRef = useRef(0);
  const timersRef = useRef([]);
  const idleTimerRef = useRef(null);
  const moodTimerRef = useRef(null);
  const flyingRef = useRef(false);
  const slotRefs = useRef([]);
  const pictureRef = useRef(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  const word = levels[currentIdx];
  const units = useMemo(() => round?.units || [], [round]);
  const tiles = useMemo(() => round?.tiles || [], [round]);
  const usedTileIds = useMemo(() => new Set(Object.values(placed)), [placed]);
  const firstEmptySlot = units.findIndex((_, index) => placed[index] === undefined);
  // one height for every letter of the round, so letters with dots or tails share the baseline
  const extent = useMemo(() => rowExtent([...units, ...tiles.map((tile) => tile.unit)]), [tiles, units]);
  const soundOut = mode === 'WORDS' && letterMode === 'sound';
  const promptText = word ? `${mode === 'SYLLABLES' ? t.buildSyllables : t.build}: ${spokenWord(word)}` : '';

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // display: what the bubble shows when it differs from what is spoken (letter "К" vs spoken "ка").
  const say = useCallback((phrase, mood = 'talking', options = {}, display = phrase) => {
    if (!phrase) return;
    setBubble(display);
    setIrbiMood(mood);
    speakText?.(phrase, { interrupt: true, ...options });
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
  }, [speakText]);

  const speakUnit = useCallback((unit) => {
    const speech = unitSpeech(lang, unit, mode, letterMode);
    speakText?.(speech.text, { ...speech.options, interrupt: true });
  }, [lang, letterMode, mode, speakText]);

  useEffect(() => () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
  }, []);

  // If the saved word is too long for the child's current level, move to one that fits.
  useEffect(() => {
    if (!levels.length) return;
    const maxUnits = MAX_UNITS_BY_LEVEL[mode][levelRef.current];
    const current = levels[currentIdx];
    if (!current || unitsOf(current).length > maxUnits) {
      setCurrentIdx(pickNextIndex(levels, (currentIdx || 0) - 1, levelRef.current, mode, solvedIds));
    }
    // only on entering the game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new word starts: fresh tiles, spoken instruction.
  useEffect(() => {
    if (!word) return undefined;
    const nextRound = buildRound(word, levelRef.current, lang, mode, levels);
    setRound(nextRound);
    setPlaced({});
    setStatus('playing');
    setHintTileId(null);
    setHintSlot(null);
    setSounding(-1);
    setIsReading(false);
    mistakesRef.current = 0;
    tapMissRef.current = 0;
    flyingRef.current = false;
    slotRefs.current = [];
    setBubble(promptText);
    const speakTimer = window.setTimeout(() => say(promptText), 350);
    prefetchSpeech?.(spokenWord(word), SPEAK_WORD);
    Array.from(new Set(nextRound.tiles.map((tile) => tile.unit))).forEach((unit) => {
      const speech = unitSpeech(lang, unit, mode, letterMode);
      prefetchSpeech?.(speech.text, speech.options);
    });
    return () => window.clearTimeout(speakTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id, lang, mode]);

  const showHint = useCallback((withVoice = true) => {
    if (status !== 'playing' || firstEmptySlot < 0) return;
    const unit = units[firstEmptySlot];
    const tile = tiles.find((item) => item.unit === unit && !usedTileIds.has(item.id));
    if (!tile) return;
    setHintTileId(tile.id);
    setHintSlot(firstEmptySlot);
    if (withVoice) {
      if (mode === 'SYLLABLES') say(`${t.findSyllable}: ${unit.toLowerCase()}`, 'talking', {}, `${t.findSyllable}: ${unit}`);
      else if (letterMode === 'sound') say(capitalize(t.findSound.replace('{sound}', getLetterSound(lang, unit))));
      else say(`${t.findLetter}: ${getLetterName(lang, unit)}`, 'talking', {}, `${t.findLetter}: ${displayUnit(unit)}`);
    }
  }, [firstEmptySlot, lang, letterMode, mode, say, status, t.findLetter, t.findSound, t.findSyllable, tiles, units, usedTileIds]);

  // Gentle automatic hint when the child pauses for a while.
  const resetIdle = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (status !== 'playing') return;
    idleTimerRef.current = window.setTimeout(() => showHint(true), IDLE_HINT_MS);
  }, [showHint, status]);

  useEffect(() => {
    resetIdle();
  }, [resetIdle, placed]);

  const adaptLevel = useCallback(() => {
    const mistakes = mistakesRef.current;
    recordTask(userKey, `word:${mode}`, mistakes === 0);
    if (isLevelLocked(userKey)) return;
    let next = levelRef.current;
    if (mistakes === 0) {
      streakRef.current += 1;
      if (streakRef.current >= 2 && next < 3) {
        next += 1;
        streakRef.current = 0;
      }
    } else if (mistakes >= 3) {
      streakRef.current = 0;
      if (next > 1) next -= 1;
    } else {
      streakRef.current = 0;
    }
    if (next !== levelRef.current) {
      setLevel(next);
      writeLevel(storageKey, next);
    }
  }, [mode, storageKey, userKey]);

  const celebrate = useCallback(() => {
    if (!word) return;
    setStatus('celebrating');
    setHintTileId(null);
    setHintSlot(null);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    onWordComplete?.(word, { mistakes: mistakesRef.current });
    adaptLevel();

    // 1. in sound mode each letter jumps and says its sound, the way children learn to blend;
    //    then all letters jump in a wave while the word is read slowly
    setIrbiMood('happy');
    const reading = mode === 'SYLLABLES'
      ? `${units.map((unit) => unit.toLowerCase()).join(', ')}. ${spokenWord(word)}!`
      : spokenWord(word);
    let readAt = 150;
    if (soundOut) {
      units.forEach((unit, index) => later(() => {
        setSounding(index);
        setBubble(units.slice(0, index + 1).map(displayUnit).join('-'));
        speakUnit(unit);
      }, 300 + index * SOUND_BEAT_MS));
      readAt = 300 + units.length * SOUND_BEAT_MS + 120;
    }
    later(() => {
      setSounding(-1);
      setIsReading(true);
      if (soundOut) setBubble(`${units.map(displayUnit).join('-')} — ${spokenWord(word)}!`);
      speakText?.(reading, { ...SPEAK_WORD, interrupt: true });
    }, readAt);
    const flyAt = readAt + (mode === 'SYLLABLES' ? 2450 : 1350);

    // 2. the letters fly into the picture...
    later(() => {
      sfxWhoosh();
      const target = pictureRef.current?.getBoundingClientRect();
      if (!target) return;
      slotRefs.current.forEach((slot, index) => {
        if (!slot?.animate) return;
        const rect = slot.getBoundingClientRect();
        const dx = target.left + target.width / 2 - (rect.left + rect.width / 2);
        const dy = target.top + target.height / 2 - (rect.top + rect.height / 2);
        slot.animate(
          [
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.25) rotate(20deg)`, opacity: 0 }
          ],
          { duration: 620, delay: index * 70, easing: 'cubic-bezier(0.5, 0, 0.6, 1)', fill: 'forwards' }
        );
      });
    }, flyAt);

    // 3. ...and the picture comes alive
    later(() => {
      setStatus('done');
      sfxTada();
      const rect = pictureRef.current?.getBoundingClientRect();
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 38,
        origin: rect
          ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
          : { y: 0.5 },
        disableForReducedMotion: true
      });
      setSessionWins((prev) => [...prev, word]);
    }, flyAt + 650 + units.length * 70);

    // 4. Irbi praises
    later(() => {
      const praise = t.praise[Math.floor(Math.random() * t.praise.length)];
      say(praise, 'cheer');
    }, flyAt + 1500 + units.length * 70);
  }, [adaptLevel, later, mode, onWordComplete, say, soundOut, speakText, speakUnit, t.praise, units, word]);

  const placeTile = useCallback((tile, slotIndex) => {
    const nextPlaced = { ...placed, [slotIndex]: tile.id };
    setPlaced(nextPlaced);
    setHintTileId(null);
    setHintSlot(null);
    tapMissRef.current = 0;
    const isLast = Object.keys(nextPlaced).length === units.length;
    sfxPlace(tile.unit, isLast);
    // no voice here: the letter already said itself when it was picked up
    if (isLast) celebrate();
  }, [celebrate, placed, units.length]);

  const registerMistake = useCallback((slotIndex) => {
    mistakesRef.current += 1;
    sfxBoop();
    setWobbleSlot(slotIndex);
    later(() => setWobbleSlot(null), 500);
    if (mistakesRef.current >= 2) showHint(true);
  }, [later, showHint]);

  const findSlotAt = (point) => {
    let best = -1;
    let bestDistance = Infinity;
    slotRefs.current.forEach((slot, index) => {
      if (!slot) return;
      const rect = slot.getBoundingClientRect();
      const inside = point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
      const distance = Math.hypot(point.x - (rect.left + rect.width / 2), point.y - (rect.top + rect.height / 2));
      if (inside) {
        best = index;
        bestDistance = -1;
      } else if (bestDistance >= 0 && distance < 90 && distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  };

  const handleDrop = (tile, point) => {
    if (status !== 'playing') return false;
    resetIdle();
    const slotIndex = findSlotAt(point);
    if (slotIndex < 0 || placed[slotIndex] !== undefined) return false;
    if (units[slotIndex] !== tile.unit) {
      registerMistake(slotIndex);
      return false;
    }
    placeTile(tile, slotIndex);
    return true;
  };

  // a letter that is touched says its sound (or name) right away, like a real toy
  const handlePick = (tile) => {
    if (status !== 'playing' || flyingRef.current) return;
    sfxPick(tile.unit);
    speakUnit(tile.unit);
  };

  const handleTap = (tile, element) => {
    if (status !== 'playing' || flyingRef.current) return;
    resetIdle();
    const nextSlot = firstEmptySlot;
    const fits = nextSlot >= 0 && units[nextSlot] === tile.unit;

    // Level 1: tapping the right letter sends it flying into place (easier than dragging).
    if (levelRef.current === 1 && fits && !(element?.animate && slotRefs.current[nextSlot])) {
      placeTile(tile, nextSlot);
      return;
    }
    if (levelRef.current === 1 && fits) {
      flyingRef.current = true;
      const from = element.getBoundingClientRect();
      const to = slotRefs.current[nextSlot].getBoundingClientRect();
      const animation = element.animate(
        [
          { transform: 'translate(0, 0) scale(1)' },
          { transform: `translate(${to.left - from.left + (to.width - from.width) / 2}px, ${to.top - from.top + (to.height - from.height) / 2}px) scale(0.96)` }
        ],
        { duration: 420, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' }
      );
      animation.onfinish = () => {
        flyingRef.current = false;
        placeTile(tile, nextSlot);
      };
      return;
    }

    setNudgeTileId(tile.id);
    later(() => setNudgeTileId(null), 600);
    if (levelRef.current === 1 && !fits) {
      tapMissRef.current += 1;
      if (tapMissRef.current >= 2) showHint(false);
    }
  };

  const goNext = () => {
    if (sessionWins.length >= SESSION_SIZE) {
      setShowSession(true);
      recordSession(userKey, `word:${mode}`);
      onSessionComplete?.({ activity: mode });
      sfxTada();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
      say(t.sessionDone, 'cheer');
      return;
    }
    setCurrentIdx(pickNextIndex(levels, currentIdx, levelRef.current, mode, solvedIds));
  };

  const startNewSession = () => {
    setShowSession(false);
    setSessionWins([]);
    setCurrentIdx(pickNextIndex(levels, currentIdx, levelRef.current, mode, solvedIds));
  };

  const labels = { home: t.home, listen: t.listen };
  const shellProps = {
    stars: sessionWins.length,
    totalStars: SESSION_SIZE,
    labels,
    onExit,
    onListen: () => say(promptText),
    bubble,
    irbiMood,
    onIrbiTap: () => say(promptText)
  };

  if (!word || !round) {
    return <GameShell {...shellProps} />;
  }

  const pictureSrc = word.img ? normalizeImageUrl(word.img) : pictureUrl('sparkles');
  const aliveKind = aliveKindFor(imageKeyOf(word));
  const isSyllables = mode === 'SYLLABLES';

  return (
    <GameShell
      {...shellProps}
      className={`wg ${isSyllables ? 'wg-syllables' : ''} ${tiles.length >= 7 ? 'wg-crowded' : ''}`}
      session={{
        open: showSession,
        title: t.sessionDone,
        pictures: sessionWins.map((item) => (item.img ? normalizeImageUrl(item.img) : pictureUrl('sparkles'))),
        moreLabel: t.more,
        menuLabel: t.menu,
        onMore: startNewSession,
        onMenu: onExit
      }}
    >
      <GameBoard icon={isSyllables ? 'puzzle' : 'blocks'}>
        <button
          type="button"
          ref={pictureRef}
          className={`wg-picture-wrap ${status === 'done' ? `is-alive wg-alive-${aliveKind}` : ''}`}
          onClick={() => speakText?.(spokenWord(word), { ...SPEAK_WORD, interrupt: true })}
          aria-label={spokenWord(word)}
        >
          <span className="wg-spotlight" />
          <img key={word.id} className="wg-picture" src={pictureSrc} alt="" draggable="false" />
          {status === 'done' ? (
            <span className="wg-burst" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ '--a': `${index * 36}deg` }} />)}
            </span>
          ) : null}
        </button>

        {status === 'done' ? (
          <div className="wg-word" aria-live="polite">
            {units.map((unit, index) => (
              <button
                key={`${unit}-${index}`}
                type="button"
                className="wg-word-unit"
                style={{ '--i': index }}
                onClick={() => {
                  speakUnit(unit);
                  setHop((prev) => ({ index, n: prev.n + 1 }));
                }}
                aria-label={displayUnit(unit)}
              >
                <LivingLetter
                  key={hop.index === index ? hop.n : 0}
                  unit={unit}
                  extent={extent}
                  happy
                  className={hop.index === index ? 'is-hop' : ''}
                  style={{ '--lv-delay': `${index * -0.37}s` }}
                />
              </button>
            ))}
          </div>
        ) : (
          <div
            className={`wg-slots ${isReading ? 'is-wave' : ''}`}
            style={{ '--wg-base': (extent.bottom - 128) / (extent.bottom - extent.top) }}
          >
            {units.map((unit, index) => {
              const isFilled = placed[index] !== undefined;
              return (
                <div
                  key={`${round.wordId}-${index}`}
                  ref={(node) => { slotRefs.current[index] = node; }}
                  data-unit={unit}
                  className={`wg-slot ${isFilled ? 'is-filled' : ''} ${wobbleSlot === index ? 'is-wobble' : ''} ${hintSlot === index ? 'is-hint' : ''}`}
                  style={{ '--i': index }}
                >
                  <LivingLetter unit={unit} extent={extent} shadow className={hintSlot === index ? 'is-hint' : ''} />
                  {isFilled ? (
                    <LivingLetter
                      unit={unit}
                      extent={extent}
                      happy
                      className={`wg-slot-letter ${sounding === index ? 'is-hop' : 'is-land'}`}
                      style={{ '--lv-delay': `${index * -0.37}s` }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </GameBoard>

      {status === 'done' ? (
        <NextButton onClick={goNext}>{t.next}</NextButton>
      ) : (
        <section className="gs-shelf wg-bank">
          {tiles.map((tile, index) => (
            usedTileIds.has(tile.id) ? (
              <span key={tile.id} className="wg-tile-spot" aria-hidden="true">
                <LivingLetter unit={tile.unit} extent={extent} eyes={false} still />
              </span>
            ) : (
              <LetterTile
                key={tile.id}
                tile={tile}
                index={index}
                extent={extent}
                isHint={hintTileId === tile.id}
                isNudged={nudgeTileId === tile.id}
                disabled={status !== 'playing'}
                onPick={handlePick}
                onTap={handleTap}
                onDrop={handleDrop}
              />
            )
          ))}
        </section>
      )}
    </GameShell>
  );
}

// A draggable living letter. Uses raw pointer events (mouse, touch and pen) and moves with a
// CSS transform only, so dragging stays smooth on low-end tablets.
function LetterTile({ tile, index, extent, isHint, isNudged, disabled, onPick, onTap, onDrop }) {
  const ref = useRef(null);
  const startRef = useRef(null);
  const pickTimerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPicked, setIsPicked] = useState(false);

  useEffect(() => () => window.clearTimeout(pickTimerRef.current), []);

  const springBack = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transition = 'transform 0.38s cubic-bezier(0.2, 1.4, 0.4, 1)';
    node.style.transform = '';
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 400);
  };

  const onPointerDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    ref.current?.setPointerCapture?.(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY, dragging: false };
    setIsPicked(true);
    window.clearTimeout(pickTimerRef.current);
    pickTimerRef.current = window.setTimeout(() => setIsPicked(false), 420);
    onPick(tile);
  };

  const onPointerMove = (event) => {
    const start = startRef.current;
    if (!start || !ref.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.dragging && Math.hypot(dx, dy) > 8) {
      start.dragging = true;
      setIsDragging(true);
    }
    if (start.dragging) {
      ref.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.12) rotate(${Math.max(-12, Math.min(12, dx / 14))}deg)`;
    }
  };

  const onPointerUp = (event) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    if (!start.dragging) {
      onTap(tile, ref.current);
      return;
    }
    setIsDragging(false);
    const placedOk = onDrop(tile, { x: event.clientX, y: event.clientY });
    if (!placedOk) springBack();
  };

  const onPointerCancel = () => {
    startRef.current = null;
    setIsDragging(false);
    springBack();
  };

  const mood = isDragging ? 'is-drag' : isPicked ? 'is-pick' : isNudged ? 'is-nudge' : '';
  return (
    <div
      ref={ref}
      className={`wg-tile ${isDragging ? 'is-dragging' : ''} ${isHint ? 'is-hint' : ''}`}
      style={{ '--i': index }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="button"
      aria-label={tile.unit}
    >
      <LivingLetter unit={tile.unit} extent={extent} className={mood} style={{ '--lv-delay': `${index * -0.37}s`, '--lv-blink': `${index * -0.6}s` }} />
    </div>
  );
}

// Everything the word games can say in `lang`, for the offline voice pack.
export const voicePhrases = (lang, { words = [], syllables = [] } = {}) => {
  const t = TEXT[lang] || TEXT.RU;
  const out = textPhrases(t, [...LABEL_KEYS, 'build', 'buildSyllables', 'findLetter', 'findSyllable']);
  const letters = new Set(ALPHABET_UNITS[lang] || ALPHABET_UNITS.RU);
  const syllableUnits = new Set();
  words.forEach((word) => {
    out.push(sayPhrase(`${t.build}: ${spokenWord(word)}`), wordPhrase(spokenWord(word), SPEAK_WORD));
    unitsOf(word).forEach((unit) => letters.add(String(unit).toUpperCase()));
  });
  syllables.forEach((word) => {
    const units = unitsOf(word);
    out.push(
      sayPhrase(`${t.buildSyllables}: ${spokenWord(word)}`),
      wordPhrase(spokenWord(word), SPEAK_WORD),
      wordPhrase(`${units.map((unit) => unit.toLowerCase()).join(', ')}. ${spokenWord(word)}!`, SPEAK_WORD)
    );
    units.forEach((unit) => syllableUnits.add(String(unit).toUpperCase()));
  });
  // letters in both modes: the name ("эм") and the sound ("ммм"), with their hints
  letters.forEach((unit) => {
    const sound = getLetterSound(lang, unit);
    out.push(
      wordPhrase(unit, NAME_SPEECH),
      sayPhrase(`${t.findLetter}: ${getLetterName(lang, unit)}`),
      wordPhrase(sound, SOUND_SPEECH),
      sayPhrase(t.findSound.replace('{sound}', sound))
    );
  });
  syllableUnits.forEach((unit) => out.push(wordPhrase(unit, SPEAK_TOKEN), sayPhrase(`${t.findSyllable}: ${unit.toLowerCase()}`)));
  return out;
};
