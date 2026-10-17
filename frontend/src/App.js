import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import confetti from 'canvas-confetti';

import './App.css';
import { themes } from './data/themes'; 
import { uiText } from './data/uiText';
import { approvedSyllables } from './data/approvedSyllables';

import { StickerAlbum } from './components/StickerAlbum';
import { AdminPanel } from './components/AdminPanel';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { MiniMathScreen } from './components/MiniMathScreen';
import { AlphabetScreen } from './components/AlphabetScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RewardChestModal } from './components/RewardChestModal';
import { AiTutorPanel } from './components/AiTutorPanel';
import { MemoryFlipScreen } from './components/MemoryFlipScreen';
import { SoundQuizScreen } from './components/SoundQuizScreen';
import { ColorByNumberScreen } from './components/ColorByNumberScreen';
import { SyllableClapScreen } from './components/SyllableClapScreen';
import { RhymeTimeScreen } from './components/RhymeTimeScreen';
import { FirstSoundScreen } from './components/FirstSoundScreen';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const resolveApiBaseUrl = () => {
  const configured = (process.env.REACT_APP_API_BASE_URL || '').trim();

  if (typeof window === 'undefined') {
    return configured || 'http://localhost:5001';
  }

  const browserHost = window.location.hostname;
  const fallback = `${window.location.protocol}//${browserHost}:5001`;
  if (!configured) return fallback;
  if (configured.startsWith('/')) return configured;

  try {
    const parsed = new URL(configured);
    if (LOCAL_HOSTS.has(parsed.hostname) && !LOCAL_HOSTS.has(browserHost)) {
      const port = parsed.port || '5001';
      return `${parsed.protocol}//${browserHost}:${port}`;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return configured.replace(/\/$/, '');
  }
};

const API_BASE_URL = resolveApiBaseUrl();
const HAS_ABSOLUTE_API_BASE = /^https?:\/\//i.test(API_BASE_URL);
const SILENT_AUDIO_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const IS_TEST_ENV = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
const SPEECH_PREFETCH_LIMIT = 48;
const buildMathCollectionStorageKey = (userKey) => `er_math_collection_${userKey}`;
const SPEECH_RATE_VALUES = ['SLOW', 'NORMAL', 'FAST'];
let placementAudioContext = null;
const WORD_IMAGE_KEYS = [
  'cat', 'dog', 'fish', 'car', 'sun', 'tree', 'moon', 'star', 'ball', 'book',
  'house', 'apple', 'flower', 'duck', 'mouse', 'cow', 'horse', 'milk', 'cake', 'hat',
  'boot', 'baby', 'bed', 'door', 'key', 'egg', 'boat', 'bird', 'milk', 'book',
  'milk', 'sun', 'moon', 'moon', 'moon', 'moon', 'tree', 'tree', 'boat', 'tree',
  'boat', 'tree', 'bed', 'book', 'door', 'book', 'moon', 'book', 'hat', 'boot',
  'boot', 'baby', 'cat', 'cat', 'cat', 'mouse', 'baby', 'book', 'book', 'book',
  'baby', 'house', 'flower', 'car', 'boat', 'car', 'car', 'bird', 'car', 'house',
  'house', 'cake', 'milk', 'apple', 'apple', 'apple', 'apple', 'apple', 'flower', 'apple',
  'apple', 'tree', 'apple', 'flower', 'milk', 'cake', 'key', 'key', 'milk', 'book',
  'key', 'book', 'book', 'book', 'milk', 'bed', 'door', 'bed', 'sun'
];

const getPlacementAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!placementAudioContext) {
    placementAudioContext = new AudioContextCtor();
  }
  return placementAudioContext;
};

const playPlacementCelebrationTone = async (token, isLevelComplete = false) => {
  const context = getPlacementAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const seed = String(token || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const baseFreq = 420 + (seed % 7) * 22;
  const notes = [
    { type: 'triangle', start: baseFreq, end: baseFreq * 1.18, time: 0, duration: 0.08, peak: 0.025 },
    { type: 'sine', start: baseFreq * 1.24, end: baseFreq * 1.42, time: 0.06, duration: 0.1, peak: 0.02 },
    { type: 'triangle', start: baseFreq * 1.5, end: baseFreq * 1.78, time: 0.14, duration: 0.12, peak: 0.018 }
  ];

  if (isLevelComplete) {
    notes.push(
      { type: 'sine', start: baseFreq * 1.96, end: baseFreq * 2.22, time: 0.24, duration: 0.16, peak: 0.022 },
      { type: 'triangle', start: baseFreq * 2.34, end: baseFreq * 2.62, time: 0.34, duration: 0.2, peak: 0.018 }
    );
  }

  const now = context.currentTime;
  notes.forEach((note) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.start, now + note.time);
    oscillator.frequency.exponentialRampToValueAtTime(note.end, now + note.time + note.duration);
    gain.gain.setValueAtTime(0.0001, now + note.time);
    gain.gain.linearRampToValueAtTime(note.peak, now + note.time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + note.time);
    oscillator.stop(now + note.time + note.duration + 0.03);
  });
};

const transliterateUzbekToCyrillic = (input) => {
  let value = String(input || '');
  if (!value) return '';

  const multiCharRules = [
    [/O['’`]/gi, 'Ў'],
    [/G['’`]/gi, 'Ғ'],
    [/SH/gi, 'Ш'],
    [/CH/gi, 'Ч'],
    [/NG/gi, 'НГ'],
    [/YO/gi, 'Ё'],
    [/YU/gi, 'Ю'],
    [/YA/gi, 'Я'],
    [/TS/gi, 'Ц']
  ];

  multiCharRules.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, (match) => {
      const isLower = match === match.toLowerCase();
      return isLower ? replacement.toLowerCase() : replacement;
    });
  });

  const charMap = {
    A: 'А', a: 'а',
    B: 'Б', b: 'б',
    D: 'Д', d: 'д',
    E: 'Е', e: 'е',
    F: 'Ф', f: 'ф',
    G: 'Г', g: 'г',
    H: 'Ҳ', h: 'ҳ',
    I: 'И', i: 'и',
    J: 'Ж', j: 'ж',
    K: 'К', k: 'к',
    L: 'Л', l: 'л',
    M: 'М', m: 'м',
    N: 'Н', n: 'н',
    O: 'О', o: 'о',
    P: 'П', p: 'п',
    Q: 'Қ', q: 'қ',
    R: 'Р', r: 'р',
    S: 'С', s: 'с',
    T: 'Т', t: 'т',
    U: 'У', u: 'у',
    V: 'В', v: 'в',
    X: 'Х', x: 'х',
    Y: 'Й', y: 'й',
    Z: 'З', z: 'з',
    "'": '',
    '’': '',
    '`': ''
  };

  return value
    .split('')
    .map((char) => charMap[char] ?? char)
    .join('');
};

const transliterateKyrgyzForRussianVoice = (input) =>
  String(input || '')
    .replace(/Ң/g, 'НГ')
    .replace(/ң/g, 'нг')
    .replace(/Ө/g, 'О')
    .replace(/ө/g, 'о')
    .replace(/Ү/g, 'У')
    .replace(/ү/g, 'у')
    .replace(/Ё/g, 'ЙО')
    .replace(/ё/g, 'йо');

const getSpeechPhoneticFallback = (input, lang) => {
  const value = String(input || '').trim();
  if (!value) return '';
  if (lang === 'UZ') return transliterateUzbekToCyrillic(value).toLowerCase();
  if (lang === 'KG') return transliterateKyrgyzForRussianVoice(value).toLowerCase();
  if (lang === 'RU') return value.toLowerCase();
  return value.toLowerCase();
};

const normalizeImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  if (/^(data:|blob:)/i.test(rawUrl)) return rawUrl;
  if (/^(https?:)?\/\//i.test(rawUrl)) return rawUrl;

  if (rawUrl.startsWith('/')) {
    return HAS_ABSOLUTE_API_BASE ? `${API_BASE_URL}${rawUrl}` : rawUrl;
  }

  return HAS_ABSOLUTE_API_BASE ? `${API_BASE_URL}/${rawUrl}` : `/${rawUrl}`;
};

const normalizeWordImageUrl = (rawUrl, wordId) => {
  const placeholderLike = !rawUrl
    || /^data:image\/svg\+xml/i.test(rawUrl)
    || /placehold\.co/i.test(rawUrl);

  if (placeholderLike) {
    const fallbackKey = WORD_IMAGE_KEYS[Math.max(0, Number(wordId || 1) - 1)] || 'book';
    return normalizeImageUrl(`/images/${fallbackKey}.png`);
  }

  return normalizeImageUrl(rawUrl);
};
const SPEECH_PROFILES = {
  EN: {
    languageCode: 'en-US',
    preferredVoices: ['en-US', 'en-GB', 'en-AU'],
    voiceNameHints: /google|microsoft|samantha|alex|zira|aria|david/i,
    rateOffset: 0.02
  },
  RU: {
    languageCode: 'ru-RU',
    preferredVoices: ['ru-RU'],
    voiceNameHints: /ru|russian|ирина|milena|alena|олга/i,
    rateOffset: 0
  },
  KG: {
    languageCode: 'ky-KG',
    preferredVoices: ['ky-KG', 'kk-KZ', 'ru-RU'],
    voiceNameHints: /ky|kyrgyz|kk|kazakh|ru|russian/i,
    rateOffset: -0.02
  },
  UZ: {
    languageCode: 'uz-UZ',
    preferredVoices: ['uz-UZ', 'uz-Cyrl-UZ', 'ru-RU'],
    voiceNameHints: /uz|uzbek|cyrl|ru|russian/i,
    rateOffset: -0.01
  }
};
const LETTER_NAME_MAPS = {
  EN: {
    A: 'ay',
    B: 'bee',
    C: 'see',
    D: 'dee',
    E: 'ee',
    F: 'ef',
    G: 'gee',
    H: 'aitch',
    I: 'eye',
    J: 'jay',
    K: 'kay',
    L: 'el',
    M: 'em',
    N: 'en',
    O: 'oh',
    P: 'pee',
    Q: 'cue',
    R: 'ar',
    S: 'ess',
    T: 'tee',
    U: 'you',
    V: 'vee',
    W: 'double u',
    X: 'ex',
    Y: 'why',
    Z: 'zee'
  },
  RU: {
    А: 'а',
    Б: 'бэ',
    В: 'вэ',
    Г: 'гэ',
    Д: 'дэ',
    Е: 'е',
    Ё: 'ё',
    Ж: 'жэ',
    З: 'зэ',
    И: 'и',
    Й: 'й',
    К: 'ка',
    Л: 'эл',
    М: 'эм',
    Н: 'эн',
    О: 'о',
    П: 'пэ',
    Р: 'эр',
    С: 'эс',
    Т: 'тэ',
    У: 'у',
    Ф: 'эф',
    Х: 'ха',
    Ц: 'це',
    Ч: 'чэ',
    Ш: 'ша',
    Щ: 'ща',
    Ъ: 'твёрдый знак',
    Ы: 'ы',
    Ь: 'мягкий знак',
    Э: 'э',
    Ю: 'ю',
    Я: 'я'
  },
  KG: {
    А: 'а',
    Б: 'бэ',
    В: 'вэ',
    Г: 'гэ',
    Д: 'дэ',
    Е: 'е',
    Ё: 'йо',
    Ж: 'жэ',
    З: 'зэ',
    И: 'и',
    Й: 'й',
    К: 'ка',
    Л: 'эл',
    М: 'эм',
    Н: 'эн',
    Ң: 'ң',
    О: 'о',
    Ө: 'ө',
    П: 'пэ',
    Р: 'эр',
    С: 'эс',
    Т: 'тэ',
    У: 'у',
    Ү: 'ү',
    Ф: 'эф',
    Х: 'ха',
    Ц: 'це',
    Ч: 'чэ',
    Ш: 'ша',
    Ы: 'ы',
    Э: 'э',
    Ю: 'йу',
    Я: 'йа'
  },
  UZ: {
    A: 'a',
    B: 'be',
    C: 'se',
    D: 'de',
    E: 'e',
    F: 'ef',
    G: 'ge',
    H: 'he',
    I: 'i',
    J: 'je',
    K: 'ke',
    L: 'el',
    M: 'em',
    N: 'en',
    O: 'o',
    P: 'pe',
    Q: 'qe',
    R: 'er',
    S: 'es',
    T: 'te',
    U: 'u',
    V: 've',
    X: 'xe',
    Y: 'ye',
    Z: 'ze'
  }
};
const PHONETIC_SPEECH_MAPS = {
  KG: {
    word: {
      'МЫШЫК': 'мышык',
      'ИТ': 'ит',
      'БАЛЫК': 'балык',
      'УНАА': 'унаа',
      'КҮН': 'кюн',
      'ДАРАК': 'дарак',
      'АЙ': 'ай',
      'ЖЫЛДЫЗ': 'жылдыз',
      'ТОП': 'топ',
      'КИТЕП': 'китеп',
      'ҮЙ': 'юй',
      'АЛМА': 'алма',
      'ГҮЛ': 'гюл',
      'ӨРДӨК': 'ёрдёк',
      'ЧЫЧКАН': 'чычкан',
      'УЙ': 'уй',
      'АТ': 'ат',
      'СҮТ': 'сют',
      'ТОРТ': 'торт',
      'КАЛПАК': 'калпак',
      'ӨТҮК': 'ётюк',
      'БӨБӨК': 'бёбёк',
      'КЕРЕБЕТ': 'керебет',
      'ЭШИК': 'эшик',
      'АЧКЫЧ': 'ачкыч',
      'ЖУМУРТКА': 'жумуртка',
      'КАЙЫК': 'кайык',
      'ЧЫМЧЫК': 'чымчык'
    },
    syllable: {
      'АЛ МА': 'ал ма',
      'БА ЛЫК': 'ба лык',
      'БО ТО': 'бо то',
      'МЫ ШЫК': 'мы шык',
      'КИ ТЕП': 'ки теп',
      'ӨР ДӨК': 'ёр дёк',
      'КА ЙЫК': 'ка йык',
      'КӨ ЛӨ КӨ': 'кё лё кё',
      'ЖУ МУР ТКА': 'жу мур тка',
      'ЧЫМ ЧЫК': 'чым чык',
      'КЕР Е БЕТ': 'кер е бет',
      'БӨ БӨК': 'бё бёк'
    },
    token: {
      'АЛ': 'ал',
      'МА': 'ма',
      'БА': 'ба',
      'ЛЫК': 'лык',
      'БО': 'бо',
      'ТО': 'то',
      'МЫ': 'мы',
      'ШЫК': 'шык',
      'КИ': 'ки',
      'ТЕП': 'теп',
      'ӨР': 'ёр',
      'ДӨК': 'дёк',
      'КА': 'ка',
      'ЙЫК': 'йык',
      'КӨ': 'кё',
      'ЛӨ': 'лё',
      'ЖУ': 'жу',
      'МУР': 'мур',
      'ТКА': 'тка',
      'ЧЫМ': 'чым',
      'ЧЫК': 'чык',
      'КЕР': 'кер',
      'Е': 'е',
      'БЕТ': 'бет',
      'БӨ': 'бё',
      'БӨК': 'бёк'
    }
  },
  UZ: {
    word: {
      'MUSHUK': 'мушук',
      'IT': 'ит',
      'BALIQ': 'балик',
      'AVTO': 'авто',
      'QUYOSH': 'куёш',
      'DARAXT': 'дарахт',
      'OY': 'ой',
      'YULDUZ': 'юлдуз',
      'TOP': 'топ',
      'KITOB': 'китоб',
      'UY': 'уй',
      'OLMA': 'олма',
      'GUL': 'гул',
      'ORDAK': 'ордак',
      'SICHQON': 'сичкон',
      'SIGIR': 'сигир',
      'OT': 'от',
      'SUT': 'сут',
      'TORT': 'торт',
      'QALPOQ': 'калпок',
      'ETIK': 'этик',
      'CHAQALOQ': 'чакалок',
      'KARAVOT': 'каравот',
      'ESHIK': 'эшик',
      'KALIT': 'калит',
      'TUXUM': 'тухум',
      'QAYIQ': 'кайик',
      'QUSH': 'куш'
    },
    syllable: {
      'OL MA': 'ол ма',
      'BA LIQ': 'ба лик',
      'MU SHUK': 'му шук',
      'KI TOB': 'ки тоб',
      'SI GIR': 'си гир',
      'QA YIQ': 'ка йик',
      'TU XUM': 'ту хум',
      'ESH IK': 'эш ик',
      'KA LIT': 'ка лит',
      'CHA QA LOQ': 'ча ка лок',
      'QAL POQ': 'кал пок',
      'QU YOSH': 'ку ёш'
    },
    token: {
      'OL': 'ол',
      'MA': 'ма',
      'BA': 'ба',
      'LIQ': 'лик',
      'MU': 'му',
      'SHUK': 'шук',
      'KI': 'ки',
      'TOB': 'тоб',
      'SI': 'си',
      'GIR': 'гир',
      'QA': 'ка',
      'YIQ': 'йик',
      'TU': 'ту',
      'XUM': 'хум',
      'ESH': 'эш',
      'IK': 'ик',
      'KA': 'ка',
      'LIT': 'лит',
      'CHA': 'ча',
      'LOQ': 'лок',
      'QAL': 'кал',
      'POQ': 'пок',
      'QU': 'ку',
      'YOSH': 'ёш',
      'SH': 'ш'
    }
  }
};
const LOOKALIKE_CHAR_MAP = {
  'А': 'A', 'A': 'A',
  'В': 'B', 'B': 'B',
  'Е': 'E', 'E': 'E',
  'К': 'K', 'K': 'K',
  'М': 'M', 'M': 'M',
  'Н': 'H', 'H': 'H',
  'О': 'O', 'O': 'O', '0': 'O',
  'Р': 'P', 'P': 'P',
  'С': 'C', 'C': 'C',
  'Т': 'T', 'T': 'T',
  'Х': 'X', 'X': 'X',
  'У': 'Y', 'Y': 'Y'
};

const LANGUAGE_CODES = ['EN', 'RU', 'KG', 'UZ'];
const buildLevelStorageKey = (userKey, lang, playMode) => `er_level_${userKey}_${lang}_${playMode}`;
const buildEmptyLangProgress = () => ({ EN: [], RU: [], KG: [], UZ: [] });
const RARITY_ORDER = ['COMMON', 'RARE', 'SECRET', 'SEASONAL'];
const RARITY_COLORS = {
  COMMON: '#6fd08c',
  RARE: '#4ca6ff',
  SECRET: '#ffb347',
  SEASONAL: '#ff6f91'
};
const SEASONAL_EVENTS = {
  SPRING: {
    key: 'SPRING',
    titles: { EN: 'Spring Parade', RU: 'Весенний парад', KG: 'Жаз майрамы', UZ: 'Bahor bayrami' },
    subtitles: {
      EN: 'Bloom event with soft pastel exclusives.',
      RU: 'Весеннее событие с эксклюзивными наградами.',
      KG: 'Жазгы өзгөчө белектер ачылды.',
      UZ: 'Bahorgi maxsus sovg‘alar ochildi.'
    }
  },
  SUMMER: {
    key: 'SUMMER',
    titles: { EN: 'Sun Quest', RU: 'Солнечный поход', KG: 'Күн жортуулу', UZ: 'Quyosh sarguzashti' },
    subtitles: {
      EN: 'Bright summer collection is active.',
      RU: 'Летняя яркая коллекция уже в игре.',
      KG: 'Жайкы жаркын коллекция активдүү.',
      UZ: 'Yozgi yorqin kolleksiya faol.'
    }
  },
  AUTUMN: {
    key: 'AUTUMN',
    titles: { EN: 'Leaf Festival', RU: 'Фестиваль листьев', KG: 'Жалбырак майрамы', UZ: 'Barglar festivali' },
    subtitles: {
      EN: 'Golden autumn rewards are waiting.',
      RU: 'Осенние золотые награды уже ждут.',
      KG: 'Күзгү алтын белектер күтүп турат.',
      UZ: 'Kuzgi oltin mukofotlar kutmoqda.'
    }
  },
  WINTER: {
    key: 'WINTER',
    titles: { EN: 'Snow Spark', RU: 'Снежная искра', KG: 'Кар учкуну', UZ: 'Qor uchquni' },
    subtitles: {
      EN: 'Winter exclusives bring frosty magic.',
      RU: 'Зимние эксклюзивы приносят волшебство.',
      KG: 'Кышкы эксклюзивдер сыйкыр алып келет.',
      UZ: 'Qishki eksklyuzivlar sehr olib keladi.'
    }
  }
};
const CHEST_REWARD_POOL = [
  {
    id: 'spark_trail',
    rarity: 'COMMON',
    icon: '✨',
    titles: { EN: 'Spark Trail', RU: 'Искристый след', KG: 'Жаркылдаган из', UZ: 'Uchqun izi' },
    descs: {
      EN: 'A cheerful sparkle follows every victory.',
      RU: 'Теперь каждую победу сопровождает искристое настроение.',
      KG: 'Ар бир жеңиш жаркыраган маанай менен коштолот.',
      UZ: 'Har bir g‘alabaga quvnoq uchqun hamroh bo‘ladi.'
    }
  },
  {
    id: 'story_portal',
    rarity: 'RARE',
    icon: '🚪',
    titles: { EN: 'Story Portal', RU: 'Портал историй', KG: 'Жомок дарбазасы', UZ: 'Hikoya portali' },
    descs: {
      EN: 'Unlocks a rare collectible from the imagination set.',
      RU: 'Открывает редкую награду из коллекции воображения.',
      KG: 'Кыял дүйнөсүнөн сейрек белек ачылды.',
      UZ: 'Tasavvur to‘plamidan noyob sovg‘a ochildi.'
    }
  },
  {
    id: 'golden_letter',
    rarity: 'SECRET',
    icon: '🌟',
    titles: { EN: 'Golden Letter', RU: 'Золотая буква', KG: 'Алтын тамга', UZ: 'Oltin harf' },
    descs: {
      EN: 'A hidden premium badge for steady learners.',
      RU: 'Секретная награда для тех, кто идёт без остановки.',
      KG: 'Тынымсыз үйрөнгөндөр үчүн жашыруун белек.',
      UZ: 'To‘xtamasdan o‘rganuvchilar uchun yashirin sovg‘a.'
    }
  },
  {
    id: 'family_duet',
    rarity: 'COMMON',
    icon: '🎤',
    titles: { EN: 'Family Duet', RU: 'Семейный дуэт', KG: 'Үй-бүлөлүк дуэт', UZ: 'Oilaviy duet' },
    descs: {
      EN: 'A warm reward for playing together.',
      RU: 'Тёплая награда за совместную игру.',
      KG: 'Бирге ойногондор үчүн жылуу белек.',
      UZ: 'Birgalikda o‘ynash uchun iliq sovg‘a.'
    }
  },
  {
    id: 'starlight_confetti',
    rarity: 'RARE',
    icon: '🎆',
    titles: { EN: 'Starlight Confetti', RU: 'Звёздный салют', KG: 'Жылдыз салюту', UZ: 'Yulduzli shou' },
    descs: {
      EN: 'A celebration reward for confident streaks.',
      RU: 'Праздничная награда за уверенные серии побед.',
      KG: 'Жеңиш сериялары үчүн майрамдык белек.',
      UZ: 'G‘alaba seriyalari uchun bayramona sovg‘a.'
    }
  },
  {
    id: 'spring_garden',
    rarity: 'SEASONAL',
    season: 'SPRING',
    icon: '🌷',
    titles: { EN: 'Spring Garden', RU: 'Весенний сад', KG: 'Жаз гүлзары', UZ: 'Bahor bog‘i' },
    descs: {
      EN: 'A spring-only collectible full of bloom.',
      RU: 'Сезонный весенний эксклюзив с цветочным настроением.',
      KG: 'Жазга гана таандык гүлдүү белек.',
      UZ: 'Faqat bahor uchun maxsus gul sovg‘asi.'
    }
  },
  {
    id: 'summer_sun',
    rarity: 'SEASONAL',
    season: 'SUMMER',
    icon: '☀️',
    titles: { EN: 'Sun Crown', RU: 'Солнечная корона', KG: 'Күн таажысы', UZ: 'Quyosh toj' },
    descs: {
      EN: 'A summer-exclusive badge with sunny energy.',
      RU: 'Летняя эксклюзивная награда с солнечным сиянием.',
      KG: 'Жайга тиешелүү күн нуру белеги.',
      UZ: 'Yozgi quyoshli eksklyuziv nishon.'
    }
  },
  {
    id: 'autumn_leaf',
    rarity: 'SEASONAL',
    season: 'AUTUMN',
    icon: '🍁',
    titles: { EN: 'Leaf Treasure', RU: 'Сокровище листьев', KG: 'Жалбырак белеги', UZ: 'Barg xazinasi' },
    descs: {
      EN: 'A cozy autumn-exclusive collectible.',
      RU: 'Уютный осенний эксклюзив для коллекции.',
      KG: 'Күзгө ылайык жылуу эксклюзив.',
      UZ: 'Kuz uchun shinam maxsus kolleksiya.'
    }
  },
  {
    id: 'winter_crystal',
    rarity: 'SEASONAL',
    season: 'WINTER',
    icon: '❄️',
    titles: { EN: 'Crystal Snow', RU: 'Хрустальный снег', KG: 'Хрустал кар', UZ: 'Billur qor' },
    descs: {
      EN: 'A winter-only collectible with frosty shine.',
      RU: 'Зимний эксклюзив с холодным сиянием.',
      KG: 'Кышкы муздак жаркыроо белеги.',
      UZ: 'Qishki muzdek yaltiragan sovg‘a.'
    }
  }
];

const hashString = (value) =>
  String(value || '').split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) % 1000003, 7);

const getSeasonKey = (date = new Date()) => {
  const month = date.getMonth();
  if (month <= 1 || month === 11) return 'WINTER';
  if (month <= 4) return 'SPRING';
  if (month <= 7) return 'SUMMER';
  return 'AUTUMN';
};

const getSeasonEvent = (lang, date = new Date()) => {
  const seasonKey = getSeasonKey(date);
  const season = SEASONAL_EVENTS[seasonKey];
  return {
    key: season.key,
    title: season.titles[lang] || season.titles.RU,
    subtitle: season.subtitles[lang] || season.subtitles.RU
  };
};

const decorateReward = (reward, lang) => ({
  ...reward,
  title: reward.titles[lang] || reward.titles.RU,
  desc: reward.descs[lang] || reward.descs.RU,
  rarityColor: RARITY_COLORS[reward.rarity] || '#ffffff'
});

const pickRandomFrom = (items) => items[Math.floor(Math.random() * items.length)];

const pickChestReward = (ownedRewardIds, seasonKey, lang) => {
  const owned = new Set(ownedRewardIds);
  const availableSeasonal = CHEST_REWARD_POOL.filter((reward) => reward.season === seasonKey && !owned.has(reward.id));
  if (availableSeasonal.length && Math.random() < 0.45) {
    return decorateReward(pickRandomFrom(availableSeasonal), lang);
  }

  const nonSeasonal = CHEST_REWARD_POOL.filter((reward) => !reward.season && !owned.has(reward.id));
  if (nonSeasonal.length) {
    const weightedPool = nonSeasonal.flatMap((reward) => {
      const copies = reward.rarity === 'COMMON' ? 4 : reward.rarity === 'RARE' ? 3 : 2;
      return Array.from({ length: copies }, () => reward);
    });
    return decorateReward(pickRandomFrom(weightedPool), lang);
  }

  const seasonFallback = CHEST_REWARD_POOL.filter((reward) => reward.season === seasonKey);
  const anyReward = seasonFallback.length ? seasonFallback : CHEST_REWARD_POOL;
  return decorateReward(pickRandomFrom(anyReward), lang);
};

const getLevelRarity = (item, languageCode, kind, seasonKey) => {
  const signature = `${languageCode}-${kind}-${item?.id || item?.text || ''}`;
  const hash = hashString(signature);
  if (seasonKey && hash % 11 === 0) return 'SEASONAL';
  if (hash % 7 === 0) return 'SECRET';
  if (hash % 3 === 0) return 'RARE';
  return 'COMMON';
};

const decorateCollection = (items, languageCode, kind, seasonKey) =>
  (items || []).map((item, index) => {
    const rarity = getLevelRarity(item, languageCode, kind, seasonKey);
    return {
      ...item,
      rarity,
      rarityOrder: RARITY_ORDER.indexOf(rarity),
      rarityColor: RARITY_COLORS[rarity] || '#ffffff',
      seasonalExclusive: rarity === 'SEASONAL',
      promoSeed: hashString(`${languageCode}-${kind}-${item?.id || index}`)
    };
  });

const normalizeLangProgress = (rawValue, fallbackLang) => {
  const empty = buildEmptyLangProgress();
  if (!rawValue) return empty;

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      if (fallbackLang && empty[fallbackLang]) {
        empty[fallbackLang] = parsed.filter(Boolean);
      }
      return empty;
    }
    if (!parsed || typeof parsed !== 'object') return empty;

    LANGUAGE_CODES.forEach((code) => {
      empty[code] = Array.isArray(parsed[code]) ? parsed[code].filter(Boolean) : [];
    });
    return empty;
  } catch {
    return empty;
  }
};

export default function App() {
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem('er_lang');
    return LANGUAGE_CODES.includes(savedLang) ? savedLang : 'RU';
  }); 
  const [theme, setTheme] = useState('OCEAN'); 
  const [gameState, setGameState] = useState('MENU'); 
  const [menuSelectedGame, setMenuSelectedGame] = useState(null);
  const [playMode, setPlayMode] = useState('WORDS');
  const [mathMode, setMathMode] = useState('FRUITS');
  const [serverData, setServerData] = useState(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [foundLetters, setFoundLetters] = useState([]);
  const [usedDragIndices, setUsedDragIndices] = useState([]);
  const [stickersByLang, setStickersByLang] = useState(buildEmptyLangProgress);
  const [syllableStickersByLang, setSyllableStickersByLang] = useState(buildEmptyLangProgress);
  const [achievements, setAchievements] = useState([]);
  
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [authMode, setAuthMode] = useState('WELCOME'); 
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [adminToken, setAdminToken] = useState(null);
  const [toast, setToast] = useState(null);

  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [musicVolume, setMusicVolume] = useState(() => {
    const savedVolume = localStorage.getItem('er_music_volume');
    const parsedVolume = Number(savedVolume);
    if (savedVolume !== null && Number.isFinite(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 100) {
      return parsedVolume;
    }
    return 42;
  });
  const [speechRate, setSpeechRate] = useState(() => {
    const savedRate = localStorage.getItem('er_speech_rate');
    return SPEECH_RATE_VALUES.includes(savedRate) ? savedRate : 'NORMAL';
  });
  const [speechRuntimeStatus, setSpeechRuntimeStatus] = useState('IDLE');
  const [loadError, setLoadError] = useState('');
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < window.innerHeight
  );
  const [isTouchLandscapeHintDevice, setIsTouchLandscapeHintDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.matchMedia?.('(pointer: coarse)')?.matches || navigator.maxTouchPoints > 1);
  });

  useEffect(() => {
    const tryLockLandscape = async () => {
      try {
        await window.screen?.orientation?.lock?.('landscape');
      } catch {
        // browser doesn't support it — overlay will handle it
      }
    };
    tryLockLandscape();

    const checkOrientation = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
      setIsTouchLandscapeHintDevice(Boolean(window.matchMedia?.('(pointer: coarse)')?.matches || navigator.maxTouchPoints > 1));
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    if (authMode === 'WELCOME') {
      setMenuSelectedGame(null);
    }
  }, [authMode]);
  const letterStyle = 'CARTOON';
  const [winStreak, setWinStreak] = useState(0);
  const [rewardCollection, setRewardCollection] = useState([]);
  const [mathCollection, setMathCollection] = useState([]);
  const [pendingChestRewards, setPendingChestRewards] = useState([]);
  const [isChestOpened, setIsChestOpened] = useState(false);
  const [loadedProfileKey, setLoadedProfileKey] = useState(null);
  const userKey = currentUser?.username || 'guest';
  const seasonEvent = useMemo(() => getSeasonEvent(lang), [lang]);
  const audioContextRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicIntervalRef = useRef(null);
  const speechAudioRef = useRef(null);
  const speechObjectUrlRef = useRef(null);
  const speechAbortRef = useRef(null);
  const speechRequestSeqRef = useRef(0);
  const speechPrefetchCacheRef = useRef(new Map());
  const speechPrefetchInflightRef = useRef(new Map());
  const speechPrefetchQueueRef = useRef(Promise.resolve());
  const audioUnlockedRef = useRef(false);
  const isMusicOnRef = useRef(false);
  const gameStateRef = useRef(gameState);
  const toastTimeoutRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchWords = () => {
    fetch(`${API_BASE_URL}/api/words`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Не удалось загрузить слова');
        }
        return data;
      })
      .then((data) => {
        const normalizedData = Object.fromEntries(
          Object.entries(data || {}).map(([language, wordsList]) => {
            if (!Array.isArray(wordsList)) return [language, wordsList];
            const normalizedWords = wordsList.map((word) => ({
              ...word,
              img: normalizeWordImageUrl(word.img, word.id)
            }));
            return [language, normalizedWords];
          })
        );
        setLoadError('');
        setServerData(normalizedData);
      })
      .catch((e) => {
        console.error('Ошибка сервера:', e);
        setLoadError(e.message || 'Не удалось загрузить данные');
        setServerData(buildEmptyLangProgress());
      });
  };

  useEffect(() => {
    setIsMounted(true);
    fetchWords();
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('er_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('er_music_volume', String(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('er_speech_rate', speechRate);
  }, [speechRate]);

  useEffect(() => {
    isMusicOnRef.current = isMusicOn;
  }, [isMusicOn]);

  useEffect(() => {
    if (musicGainRef.current) {
      const gainValue = musicVolume <= 0 ? 0.0001 : Math.max(0.02, musicVolume / 220);
      musicGainRef.current.gain.value = gainValue;
    }
  }, [musicVolume]);

  useEffect(() => () => {
    if (musicIntervalRef.current) window.clearInterval(musicIntervalRef.current);
    if (speechAbortRef.current) speechAbortRef.current.abort();
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.src = '';
    }
    if (speechObjectUrlRef.current) cleanupSpeechUrl(speechObjectUrlRef.current);
    speechPrefetchCacheRef.current.clear();
    speechPrefetchInflightRef.current.clear();
    speechPrefetchQueueRef.current = Promise.resolve();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    audioContextRef.current?.close?.();
  }, []);

  const showToast = (message, tone = 'info') => {
    if (!message) return;
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToast({ id: Date.now(), message, tone });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  };

  useEffect(() => {
    const savedStickers =
      localStorage.getItem(`er_stickers_map_${userKey}`) ??
      localStorage.getItem(`er_stickers_${userKey}`);
    setStickersByLang(normalizeLangProgress(savedStickers, lang));

    const savedSyllableStickers =
      localStorage.getItem(`er_syllable_stickers_map_${userKey}`) ??
      localStorage.getItem(`er_syllable_stickers_${userKey}_${lang}`);
    setSyllableStickersByLang(normalizeLangProgress(savedSyllableStickers, lang));

    const savedAchievements = localStorage.getItem(`er_achievements_${userKey}`);
    setAchievements(savedAchievements ? JSON.parse(savedAchievements) : []);

    const savedLevel = localStorage.getItem(buildLevelStorageKey(userKey, lang, playMode));
    setCurrentIdx(savedLevel ? parseInt(savedLevel, 10) : 0);
  }, [userKey, lang, playMode]); 

  useEffect(() => {
    const savedRewards = localStorage.getItem(`er_reward_collection_${userKey}`);
    const savedMathCollection = localStorage.getItem(buildMathCollectionStorageKey(userKey));
    const savedStreak = localStorage.getItem(`er_win_streak_${userKey}`);
    const savedChestQueue = localStorage.getItem(`er_chest_queue_${userKey}`);
    const savedChestOpened = localStorage.getItem(`er_chest_opened_${userKey}`);

    setRewardCollection(savedRewards ? JSON.parse(savedRewards) : []);
    setMathCollection(savedMathCollection ? JSON.parse(savedMathCollection) : []);
    setWinStreak(savedStreak ? parseInt(savedStreak, 10) || 0 : 0);
    setPendingChestRewards(savedChestQueue ? JSON.parse(savedChestQueue) : []);
    setIsChestOpened(savedChestOpened === '1');
    setLoadedProfileKey(userKey);
  }, [userKey]);

  useEffect(() => {
    localStorage.setItem(buildLevelStorageKey(userKey, lang, playMode), String(currentIdx));
    setFoundLetters([]);
    setUsedDragIndices([]);
  }, [currentIdx, userKey, lang, playMode]);

  const wordsByLang = useMemo(
    () => LANGUAGE_CODES.reduce((acc, code) => {
      acc[code] = decorateCollection(serverData?.[code] || [], code, 'word', seasonEvent.key);
      return acc;
    }, buildEmptyLangProgress()),
    [serverData, seasonEvent.key]
  );
  const syllablesByLang = useMemo(
    () => LANGUAGE_CODES.reduce((acc, code) => {
      acc[code] = decorateCollection(
        approvedSyllables[code]
          ? approvedSyllables[code].map((item) => ({ ...item, img: normalizeImageUrl(item.img) }))
          : [],
        code,
        'syllable',
        seasonEvent.key
      );
      return acc;
    }, buildEmptyLangProgress()),
    [seasonEvent.key]
  );
  const words = useMemo(
    () => wordsByLang[lang] || [],
    [wordsByLang, lang]
  );
  const syllableContent = useMemo(
    () => syllablesByLang[lang] || [],
    [syllablesByLang, lang]
  );
  const stickers = stickersByLang[lang] || [];
  const syllableStickers = syllableStickersByLang[lang] || [];
  const levels = playMode === 'SYLLABLES' ? syllableContent : words;
  const currentLevel = useMemo(
    () => levels[currentIdx] || { text: "LOAD", img: "", units: [] },
    [levels, currentIdx]
  );
  const chestQueue = pendingChestRewards;
  const activeChestReward = chestQueue[0]
    ? decorateReward(CHEST_REWARD_POOL.find((reward) => reward.id === chestQueue[0]) || CHEST_REWARD_POOL[0], lang)
    : null;
  const nextChestIn = chestQueue.length ? 0 : (3 - (winStreak % 3 || 3) + 3) % 3 || 3;
  const unlockedRewardItems = useMemo(
    () => rewardCollection
      .map((rewardId) => CHEST_REWARD_POOL.find((reward) => reward.id === rewardId))
      .filter(Boolean)
      .map((reward) => decorateReward(reward, lang)),
    [rewardCollection, lang]
  );

  useEffect(() => {
    if (loadedProfileKey !== userKey) return;
    localStorage.setItem(`er_reward_collection_${userKey}`, JSON.stringify(rewardCollection));
  }, [rewardCollection, loadedProfileKey, userKey]);

  useEffect(() => {
    if (loadedProfileKey !== userKey) return;
    localStorage.setItem(buildMathCollectionStorageKey(userKey), JSON.stringify(mathCollection));
  }, [mathCollection, loadedProfileKey, userKey]);

  useEffect(() => {
    if (loadedProfileKey !== userKey) return;
    localStorage.setItem(`er_win_streak_${userKey}`, String(winStreak));
  }, [winStreak, loadedProfileKey, userKey]);

  useEffect(() => {
    if (loadedProfileKey !== userKey) return;
    localStorage.setItem(`er_chest_queue_${userKey}`, JSON.stringify(pendingChestRewards));
    localStorage.setItem(`er_chest_opened_${userKey}`, isChestOpened ? '1' : '0');
  }, [pendingChestRewards, isChestOpened, loadedProfileKey, userKey]);
  const displayText = currentLevel?.text || '';
  const maskedDisplayText = useMemo(() => {
    if (!displayText) return '';
    if (playMode === 'SYLLABLES') {
      return displayText.replace(/[A-ZА-ЯЁӨҮҢ]/gi, '•');
    }
    return foundLetters.length ? displayText.replace(/./g, '•') : '';
  }, [displayText, foundLetters.length, playMode]);
  const levelUnits = useMemo(() => {
    if (playMode === 'SYLLABLES') return currentLevel.units || [];
    return displayText ? displayText.split('') : [];
  }, [playMode, currentLevel, displayText]);

  const shuffledLetters = useMemo(() => {
    if (!levelUnits.length) return [];
    return levelUnits.map((char, index) => ({ char, index })).sort(() => Math.random() - 0.5);
  }, [levelUnits]);

  const speechEngineStatus = 'NEURAL_AI';
  const feedbackText = {
    EN: {
      logout: 'You have been logged out.',
      progressReset: 'Progress reset.',
      loginMissing: 'Enter your username and password.',
      loginSuccess: 'Signed in successfully.',
      connectionError: 'Connection error.',
      registerMissing: 'Create a username and password.',
      registerLoginFailed: 'Account created, but sign-in failed.',
      accountCreated: 'Account created.',
      serverError: 'Server error.'
    },
    RU: {
      logout: 'Вы вышли из аккаунта.',
      progressReset: 'Прогресс сброшен.',
      loginMissing: 'Введите логин и пароль!',
      loginSuccess: 'Вы успешно вошли.',
      connectionError: 'Ошибка соединения!',
      registerMissing: 'Придумайте логин и пароль!',
      registerLoginFailed: 'Аккаунт создан, но вход не выполнен.',
      accountCreated: 'Аккаунт создан',
      serverError: 'Ошибка сервера!'
    },
    KG: {
      logout: 'Сиз аккаунттан чыктыңыз.',
      progressReset: 'Прогресс тазаланды.',
      loginMissing: 'Логин менен сырсөздү жазыңыз.',
      loginSuccess: 'Сиз ийгиликтүү кирдиңиз.',
      connectionError: 'Туташуу катасы.',
      registerMissing: 'Логин жана сырсөз ойлоп табыңыз.',
      registerLoginFailed: 'Аккаунт түзүлдү, бирок кирүү аткарылган жок.',
      accountCreated: 'Аккаунт түзүлдү.',
      serverError: 'Сервер катасы.'
    },
    UZ: {
      logout: 'Siz akkauntdan chiqdingiz.',
      progressReset: 'Progress tozalandi.',
      loginMissing: 'Login va parolni kiriting.',
      loginSuccess: 'Muvaffaqiyatli kirdingiz.',
      connectionError: 'Ulanish xatosi.',
      registerMissing: 'Login va parol o`ylab toping.',
      registerLoginFailed: 'Akkaunt yaratildi, lekin kirish bajarilmadi.',
      accountCreated: 'Akkaunt yaratildi.',
      serverError: 'Server xatosi.'
    }
  }[lang] || {
    logout: 'Вы вышли из аккаунта.',
    progressReset: 'Прогресс сброшен.',
    loginMissing: 'Введите логин и пароль!',
    loginSuccess: 'Вы успешно вошли.',
    connectionError: 'Ошибка соединения!',
    registerMissing: 'Придумайте логин и пароль!',
    registerLoginFailed: 'Аккаунт создан, но вход не выполнен.',
    accountCreated: 'Аккаунт создан',
    serverError: 'Ошибка сервера!'
  };

  const activeSpeechProfile = SPEECH_PROFILES[lang] || SPEECH_PROFILES.RU;
  const resolveSpeechRate = useCallback((requestedRate) => {
    const baseRate = Number.isFinite(requestedRate)
      ? requestedRate
      : 1 + (activeSpeechProfile.rateOffset || 0);
    const speedDelta = speechRate === 'SLOW' ? -0.16 : speechRate === 'FAST' ? 0.16 : 0;
    return Math.max(0.68, Math.min(1.28, baseRate + speedDelta));
  }, [activeSpeechProfile.rateOffset, speechRate]);

  const normalizeSpeechText = useCallback((text, options = {}) => {
    const kind = options.kind || 'text';
    const engine = options.engine || 'browser';
    const voiceLang = options.voiceLang || '';
    const rawText = String(text || '').trim();
    if (!rawText) return '';

    const withSpaces = rawText
      .replaceAll('-', ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!withSpaces) return '';

    const isSingleToken = !withSpaces.includes(' ');
    const isSingleChar = isSingleToken && withSpaces.length === 1;
    const isLatinOnly = /^[A-Z]+(?: [A-Z]+)*$/i.test(withSpaces);
    const isCyrillicOnly = /^[\u0400-\u04FF]+(?: [\u0400-\u04FF]+)*$/i.test(withSpaces);

    if (kind === 'token' && isSingleChar) {
      const upperToken = withSpaces.toUpperCase();
      return LETTER_NAME_MAPS[lang]?.[upperToken] || upperToken.toLowerCase();
    }

    if (engine === 'remote') {
      if (kind === 'token') {
        const tokenKey = withSpaces.toUpperCase();
        const tokenName = LETTER_NAME_MAPS[lang]?.[tokenKey];
        if (tokenName) return tokenName.toLowerCase();
      }
      if (lang === 'UZ') return withSpaces.toLowerCase();
      if (lang === 'KG' && isCyrillicOnly) return withSpaces.toLowerCase();
      if (lang === 'RU' && isCyrillicOnly) return withSpaces.toLowerCase();
      if (lang === 'EN' && isLatinOnly) return withSpaces.toLowerCase();
      return withSpaces;
    }

    const key = withSpaces.toUpperCase();
    const shouldUseRussianPhonetics = lang !== 'EN' && voiceLang.startsWith('ru');
    if (shouldUseRussianPhonetics) {
      const phonetic = PHONETIC_SPEECH_MAPS[lang]?.[kind]?.[key];
      if (phonetic) return phonetic;
      return getSpeechPhoneticFallback(withSpaces, lang);
    }

    if (lang === 'UZ') {
      return transliterateUzbekToCyrillic(withSpaces).toLowerCase();
    }

    if (lang === 'KG') {
      return transliterateKyrgyzForRussianVoice(withSpaces).toLowerCase();
    }

    if ((lang === 'EN' || lang === 'UZ') && isLatinOnly) {
      return withSpaces.toLowerCase();
    }

    if ((lang === 'RU' || lang === 'KG') && isCyrillicOnly) {
      return withSpaces.toLowerCase();
    }

    return withSpaces;
  }, [lang]);

  const getReusableSpeechAudio = () => {
    if (!speechAudioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      speechAudioRef.current = audio;
    }
    return speechAudioRef.current;
  };

  const cleanupSpeechUrl = (url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const applySpeechAudioSettings = (audio, playbackRate, volume) => {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = volume ?? 1;
    audio.playsInline = true;
    audio.defaultPlaybackRate = playbackRate;
    audio.playbackRate = playbackRate;
    if ('preservesPitch' in audio) audio.preservesPitch = true;
    if ('mozPreservesPitch' in audio) audio.mozPreservesPitch = true;
    if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
  };

  const buildRemoteSpeechStreamUrl = useCallback((remoteText, requestOptions) => {
    const params = new URLSearchParams({
      text: remoteText,
      lang,
      rate: String(requestOptions.playbackRate ?? resolveSpeechRate(requestOptions.rate))
    });
    return `${API_BASE_URL}/api/speech?${params.toString()}`;
  }, [lang, resolveSpeechRate]);

  const buildSpeechPrefetchKey = useCallback((remoteText, requestOptions) => JSON.stringify({
    text: remoteText,
    lang,
    rate: String(requestOptions.playbackRate ?? resolveSpeechRate(requestOptions.rate))
  }), [lang, resolveSpeechRate]);

  const rememberSpeechBlob = (cacheKey, audioBlob) => {
    if (!(audioBlob instanceof Blob) || !audioBlob.size) return;
    const cache = speechPrefetchCacheRef.current;
    if (cache.has(cacheKey)) {
      cache.delete(cacheKey);
    }
    cache.set(cacheKey, audioBlob);
    while (cache.size > SPEECH_PREFETCH_LIMIT) {
      const oldestKey = cache.keys().next().value;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
  };

  const prefetchRemoteSpeech = useCallback(async (text, options = {}) => {
    if (IS_TEST_ENV) return null;
    const remoteText = normalizeSpeechText(text, { ...options, engine: 'remote' });
    if (!remoteText) return null;

    const requestOptions = {
      ...options,
      playbackRate: resolveSpeechRate(options.rate)
    };
    const cacheKey = buildSpeechPrefetchKey(remoteText, requestOptions);
    const cachedBlob = speechPrefetchCacheRef.current.get(cacheKey);
    if (cachedBlob?.size) {
      return cachedBlob;
    }

    const inflight = speechPrefetchInflightRef.current.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const streamUrl = buildRemoteSpeechStreamUrl(remoteText, requestOptions);
    const runFetch = async () => {
      const response = await fetch(streamUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Speech prefetch failed: ${response.status}`);
        }
      const audioBlob = await response.blob();
      if (!audioBlob.size) {
        throw new Error('Speech prefetch returned empty audio');
      }
      rememberSpeechBlob(cacheKey, audioBlob);
      return audioBlob;
    };

    const fetchPromise = speechPrefetchQueueRef.current
      .catch(() => null)
      .then(runFetch)
      .catch((error) => {
        speechPrefetchCacheRef.current.delete(cacheKey);
        throw error;
      })
      .finally(() => {
        speechPrefetchInflightRef.current.delete(cacheKey);
      });

    speechPrefetchQueueRef.current = fetchPromise.catch(() => null);
    speechPrefetchInflightRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [buildRemoteSpeechStreamUrl, buildSpeechPrefetchKey, normalizeSpeechText, resolveSpeechRate]);

  const playRemoteAudioUrl = async (url, requestOptions) => {
    const audio = getReusableSpeechAudio();
    const playbackRate = requestOptions.playbackRate ?? resolveSpeechRate(requestOptions.rate);
    applySpeechAudioSettings(audio, playbackRate, requestOptions.volume);
    audio.src = url;
    audio.load();
    await audio.play();
    speechObjectUrlRef.current = url;
    setSpeechRuntimeStatus('REMOTE_TTS');
    return true;
  };

  const unlockSpeechPlayback = useCallback(async () => {
    if (IS_TEST_ENV) return false;
    if (audioUnlockedRef.current) return true;
    try {
      const audio = getReusableSpeechAudio();
      audio.muted = true;
      audio.src = SILENT_AUDIO_DATA_URI;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
      audio.muted = false;
      audioUnlockedRef.current = true;
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    const unlock = () => {
      void unlockSpeechPlayback();
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('mousedown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('mousedown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlockSpeechPlayback]);

  const stopRemoteSpeech = () => {
    if (IS_TEST_ENV) return;
    if (speechAbortRef.current) {
      speechAbortRef.current.abort();
      speechAbortRef.current = null;
    }
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.currentTime = 0;
      speechAudioRef.current.src = '';
      speechAudioRef.current.load();
    }
    if (speechObjectUrlRef.current) {
      cleanupSpeechUrl(speechObjectUrlRef.current);
      speechObjectUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speakWithBrowserTts = (text, options = {}) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return false;

    const rawText = normalizeSpeechText(text, { ...options, engine: 'browser' });
    if (!rawText) return false;

    synth.cancel();

    // Voice priority per language: KG uses Kazakh (closest Turkic+Cyrillic), UZ uses Uzbek then Turkish
    const voicePriority = {
      EN: ['en-US', 'en-GB', 'en'],
      RU: ['ru-RU', 'ru'],
      KG: ['kk-KZ', 'kk', 'ru-RU', 'ru'],
      UZ: ['uz-UZ', 'uz', 'tr-TR', 'tr', 'ru-RU', 'ru'],
    };

    const preferredCodes = voicePriority[lang] || ['ru-RU'];
    const voices = synth.getVoices();

    let selectedVoice = null;
    for (const code of preferredCodes) {
      const match = voices.find((v) =>
        v.lang === code || v.lang.startsWith(code.split('-')[0] + '-') || v.lang === code.split('-')[0]
      );
      if (match) { selectedVoice = match; break; }
    }

    const utter = new SpeechSynthesisUtterance(rawText);
    if (selectedVoice) utter.voice = selectedVoice;
    utter.lang = preferredCodes[0];
    utter.rate = Math.min(1.0, options.playbackRate || 0.85);
    utter.pitch = options.pitch || 1;

    synth.speak(utter);
    setSpeechRuntimeStatus('BROWSER_TTS');
    return true;
  };

  const speakRemoteText = async (text, options = {}) => {
    const remoteText = normalizeSpeechText(text, { ...options, engine: 'remote' });
    if (!remoteText) return false;
    const requestId = options.requestId || speechRequestSeqRef.current;
    const cacheKey = buildSpeechPrefetchKey(remoteText, options);
    const prefetchedBlob = speechPrefetchCacheRef.current.get(cacheKey);

    if (prefetchedBlob?.size) {
      if (speechObjectUrlRef.current) cleanupSpeechUrl(speechObjectUrlRef.current);
      speechObjectUrlRef.current = null;
      await playRemoteAudioUrl(URL.createObjectURL(prefetchedBlob), options);
      if (requestId !== speechRequestSeqRef.current) return false;
      return true;
    }

    const inflightPrefetch = speechPrefetchInflightRef.current.get(cacheKey);
    if (inflightPrefetch) {
      try {
        const inflightBlob = await inflightPrefetch;
        if (requestId !== speechRequestSeqRef.current) return false;
        if (inflightBlob?.size) {
          if (speechObjectUrlRef.current) cleanupSpeechUrl(speechObjectUrlRef.current);
          speechObjectUrlRef.current = null;
          await playRemoteAudioUrl(URL.createObjectURL(inflightBlob), options);
          return true;
        }
      } catch (error) {
        console.warn('[TTS] Prefetch audio unavailable, falling back to direct request.', error);
      }
    }

    const streamUrl = buildRemoteSpeechStreamUrl(remoteText, options);

    try {
      if (speechObjectUrlRef.current) cleanupSpeechUrl(speechObjectUrlRef.current);
      speechObjectUrlRef.current = null;
      await playRemoteAudioUrl(streamUrl, options);
      if (requestId !== speechRequestSeqRef.current) return false;
      return true;
    } catch (streamError) {
      console.warn('[TTS] Direct stream playback failed, retrying with blob audio.', streamError);
    }

    const controller = new AbortController();
    speechAbortRef.current = controller;
    try {
      const response = await fetch(`${API_BASE_URL}/api/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: remoteText,
          lang,
          rate: options.playbackRate ?? resolveSpeechRate(options.rate)
        }),
        signal: controller.signal
      });

      if (requestId !== speechRequestSeqRef.current || controller.signal.aborted) return false;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || `Speech API error: ${response.status}`;
        console.warn('[TTS] API error:', response.status, message);
        throw new Error(message);
      }

      const audioBlob = await response.blob();
      if (!audioBlob.size) return false;
      if (requestId !== speechRequestSeqRef.current || controller.signal.aborted) return false;

      rememberSpeechBlob(cacheKey, audioBlob);
      if (speechObjectUrlRef.current) cleanupSpeechUrl(speechObjectUrlRef.current);
      const nextUrl = URL.createObjectURL(audioBlob);
      await playRemoteAudioUrl(nextUrl, options);
      return true;
    } finally {
      if (speechAbortRef.current === controller) speechAbortRef.current = null;
    }
  };

  const speakText = (text, options = {}) => {
    if (IS_TEST_ENV) return;
    if (!text) return;
    const interrupt = options.interrupt !== false;
    const requestId = speechRequestSeqRef.current + 1;
    speechRequestSeqRef.current = requestId;
    const requestOptions = {
      ...options,
      requestId,
      playbackRate: resolveSpeechRate(options.rate)
    };

    if (interrupt) {
      stopRemoteSpeech();
    }

    void unlockSpeechPlayback();

    const handleRemoteError = (error) => {
      if (requestId !== speechRequestSeqRef.current) return;
      if (error?.name === 'AbortError') return;
      console.warn('[TTS] Remote unavailable, trying browser TTS.', error);
      if (!speakWithBrowserTts(text, requestOptions)) {
        setSpeechRuntimeStatus('REMOTE_ERROR');
      }
    };

    void speakRemoteText(text, requestOptions).catch(handleRemoteError);
  };

  useEffect(() => {
    if (gameState !== 'PLAYING' || !displayText) return undefined;

    const timer = window.setTimeout(() => {
      void prefetchRemoteSpeech(displayText, {
        kind: playMode === 'SYLLABLES' ? 'syllable' : 'word',
        rate: lang === 'EN' ? 0.9 : lang === 'UZ' ? 0.84 : 0.82
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [displayText, gameState, lang, playMode, prefetchRemoteSpeech]);

  const handleLanguageChange = (nextLang) => {
    if (!nextLang || nextLang === lang) return;
    setFoundLetters([]);
    setUsedDragIndices([]);
    setSpeechRuntimeStatus('IDLE');
    setLang(nextLang);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminToken(null);
    setUsernameInput('');
    setPasswordInput('');
    setAuthMode('READY');
    setMenuSelectedGame(null);
    showToast(feedbackText.logout, 'info');
  };

  const handleResetProgress = () => {
    setCurrentIdx(0);
    setFoundLetters([]);
    setUsedDragIndices([]);
    setStickersByLang(buildEmptyLangProgress());
    setSyllableStickersByLang(buildEmptyLangProgress());
    setAchievements([]);
    setWinStreak(0);
    setRewardCollection([]);
    setMathCollection([]);
    setPendingChestRewards([]);
    setIsChestOpened(false);

    localStorage.removeItem(`er_stickers_map_${userKey}`);
    localStorage.removeItem(`er_stickers_${userKey}`);
    localStorage.removeItem(`er_syllable_stickers_map_${userKey}`);
    localStorage.removeItem(`er_achievements_${userKey}`);
    localStorage.removeItem(`er_reward_collection_${userKey}`);
    localStorage.removeItem(buildMathCollectionStorageKey(userKey));
    localStorage.removeItem(`er_win_streak_${userKey}`);
    localStorage.removeItem(`er_chest_queue_${userKey}`);
    localStorage.removeItem(`er_chest_opened_${userKey}`);
    LANGUAGE_CODES.forEach((code) => {
      localStorage.removeItem(`er_syllable_stickers_${userKey}_${code}`);
      localStorage.removeItem(buildLevelStorageKey(userKey, code, 'WORDS'));
      localStorage.removeItem(buildLevelStorageKey(userKey, code, 'SYLLABLES'));
      localStorage.removeItem(buildLevelStorageKey(userKey, code, 'ALPHABET'));
    });

    showToast(feedbackText.progressReset, 'success');
  };

  const playMusicPhrase = () => {
    const context = audioContextRef.current;
    const gain = musicGainRef.current;
    if (!context || !gain) return;

    const now = context.currentTime;
    const isMenuMusic = gameStateRef.current === 'MENU';
    const chordProgression = isMenuMusic
      ? [
          { root: 261.63, third: 329.63, fifth: 392.0, time: 0.0, duration: 1.55 },
          { root: 392.0, third: 493.88, fifth: 587.33, time: 1.6, duration: 1.55 },
          { root: 440.0, third: 523.25, fifth: 659.25, time: 3.2, duration: 1.55 },
          { root: 349.23, third: 440.0, fifth: 523.25, time: 4.8, duration: 1.55 }
        ]
      : [
          { root: 261.63, third: 329.63, fifth: 392.0, time: 0.0, duration: 1.55 },
          { root: 329.63, third: 392.0, fifth: 493.88, time: 1.6, duration: 1.55 },
          { root: 349.23, third: 440.0, fifth: 523.25, time: 3.2, duration: 1.55 },
          { root: 392.0, third: 493.88, fifth: 587.33, time: 4.8, duration: 1.55 }
        ];
    const melodyNotes = isMenuMusic
      ? [
          { freq: 523.25, time: 0.08, duration: 0.2 },
          { freq: 659.25, time: 0.42, duration: 0.22 },
          { freq: 783.99, time: 0.78, duration: 0.2 },
          { freq: 659.25, time: 1.12, duration: 0.22 },
          { freq: 587.33, time: 1.68, duration: 0.2 },
          { freq: 783.99, time: 2.04, duration: 0.22 },
          { freq: 880.0, time: 2.4, duration: 0.2 },
          { freq: 783.99, time: 2.74, duration: 0.22 },
          { freq: 659.25, time: 3.3, duration: 0.2 },
          { freq: 698.46, time: 3.64, duration: 0.22 },
          { freq: 880.0, time: 4.0, duration: 0.2 },
          { freq: 783.99, time: 4.34, duration: 0.22 },
          { freq: 523.25, time: 4.92, duration: 0.22 },
          { freq: 659.25, time: 5.3, duration: 0.2 },
          { freq: 587.33, time: 5.66, duration: 0.24 },
          { freq: 523.25, time: 6.0, duration: 0.28 }
        ]
      : [
          { freq: 392.0, time: 0.1, duration: 0.2 },
          { freq: 523.25, time: 0.46, duration: 0.22 },
          { freq: 659.25, time: 0.82, duration: 0.2 },
          { freq: 523.25, time: 1.16, duration: 0.22 },
          { freq: 493.88, time: 1.72, duration: 0.2 },
          { freq: 659.25, time: 2.08, duration: 0.22 },
          { freq: 783.99, time: 2.44, duration: 0.2 },
          { freq: 659.25, time: 2.78, duration: 0.22 },
          { freq: 523.25, time: 3.34, duration: 0.2 },
          { freq: 587.33, time: 3.7, duration: 0.22 },
          { freq: 698.46, time: 4.06, duration: 0.2 },
          { freq: 587.33, time: 4.4, duration: 0.22 },
          { freq: 493.88, time: 4.96, duration: 0.2 },
          { freq: 523.25, time: 5.32, duration: 0.22 },
          { freq: 440.0, time: 5.68, duration: 0.24 },
          { freq: 392.0, time: 6.02, duration: 0.28 }
        ];

    const scheduleTone = ({ freq, time, duration, type = 'sine', peak = 0.03, attack = 0.08, releaseTail = 0.06 }) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now + time);
      noteGain.gain.setValueAtTime(0.0001, now + time);
      noteGain.gain.linearRampToValueAtTime(peak, now + time + attack);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);
      oscillator.connect(noteGain);
      noteGain.connect(gain);
      oscillator.start(now + time);
      oscillator.stop(now + time + duration + releaseTail);
    };

    chordProgression.forEach((chord) => {
      scheduleTone({ freq: chord.root / 2, time: chord.time, duration: chord.duration + 0.2, type: 'sine', peak: 0.018, attack: 0.18, releaseTail: 0.1 });
      scheduleTone({ freq: chord.root, time: chord.time + 0.02, duration: chord.duration - 0.06, type: 'triangle', peak: 0.012, attack: 0.12 });
      scheduleTone({ freq: chord.third, time: chord.time + 0.18, duration: chord.duration - 0.14, type: 'sine', peak: 0.009, attack: 0.14 });
      scheduleTone({ freq: chord.fifth, time: chord.time + 0.34, duration: chord.duration - 0.2, type: 'sine', peak: 0.008, attack: 0.14 });
    });

    melodyNotes.forEach((note) => {
      scheduleTone({ ...note, type: 'triangle', peak: 0.034, attack: 0.02, releaseTail: 0.04 });
      scheduleTone({ freq: note.freq * 2, time: note.time + 0.01, duration: Math.max(0.12, note.duration - 0.04), type: 'sine', peak: 0.008, attack: 0.012, releaseTail: 0.03 });
    });
  };

  const ensureMusic = () => {
    if (audioContextRef.current) return audioContextRef.current;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.value = musicVolume <= 0 ? 0.0001 : Math.max(0.02, musicVolume / 220);
    gain.connect(context.destination);

    audioContextRef.current = context;
    musicGainRef.current = gain;
    return context;
  };

  const startMusic = async (requestedVolume = musicVolume) => {
    if (isMusicOnRef.current) return;
    const startVolume = requestedVolume <= 0 ? 25 : requestedVolume;
    if (requestedVolume <= 0) {
      setMusicVolume(startVolume);
    }
    const context = ensureMusic();
    if (!context) return;
    if (context.state === 'suspended') {
      await context.resume();
    }
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = Math.max(0.02, startVolume / 220);
    }
    isMusicOnRef.current = true;
    playMusicPhrase();
    musicIntervalRef.current = window.setInterval(() => {
      if (!isMusicOnRef.current) return;
      playMusicPhrase();
    }, 6400);
    setIsMusicOn(true);
  };

  const stopMusic = () => {
    isMusicOnRef.current = false;
    if (musicIntervalRef.current) window.clearInterval(musicIntervalRef.current);
    musicIntervalRef.current = null;
    audioContextRef.current?.close?.();
    audioContextRef.current = null;
    musicGainRef.current = null;
    setIsMusicOn(false);
  };

  const toggleMusic = async () => {
    if (isMusicOnRef.current) {
      stopMusic();
      return;
    }
    await startMusic(musicVolume);
  };

  const handleMusicVolumeChange = async (nextVolume) => {
    setMusicVolume(nextVolume);
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = nextVolume <= 0 ? 0.0001 : Math.max(0.02, nextVolume / 220);
    }
    if (nextVolume > 0 && !isMusicOnRef.current) {
      await startMusic(nextVolume);
    }
  };

  const handleLogin = async () => {
    if (!usernameInput || !passwordInput) {
      showToast(feedbackText.loginMissing, 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        const isAdmin = Boolean(data.isAdmin);
        setCurrentUser({ username: data.username, score: data.score, isAdmin });
        setAdminToken(isAdmin ? data.adminToken : null);
        setAuthMode('READY');
        setGameState('MENU');
        setUsernameInput(''); setPasswordInput('');
        showToast(feedbackText.loginSuccess, 'success');
      } else { showToast(data.error, 'error'); }
    } catch (e) { showToast(feedbackText.connectionError, 'error'); }
  };

  const handleRegister = async () => {
    if (!usernameInput || !passwordInput) {
      showToast(feedbackText.registerMissing, 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        const loginRes = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok || !loginData.success) {
          showToast(loginData.error || feedbackText.registerLoginFailed, 'error');
          setAuthMode('LOGIN');
          return;
        }
        const isAdmin = Boolean(loginData.isAdmin);
        setCurrentUser({ username: loginData.username, score: loginData.score, isAdmin });
        setAdminToken(isAdmin ? loginData.adminToken : null);
        setAuthMode('READY');
        setGameState('MENU');
        setUsernameInput('');
        setPasswordInput('');
        showToast(feedbackText.accountCreated, 'success');
      } else { showToast(data.error, 'error'); }
    } catch (e) { showToast(feedbackText.serverError, 'error'); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Не удалось загрузить рейтинг');
      }
      if (!Array.isArray(data)) {
        throw new Error('Некорректный формат рейтинга');
      }
      setLeaderboard(data);
      setGameState('LEADERBOARD');
    } catch (e) {
      console.error('Ошибка загрузки рейтинга', e);
      showToast(e.message || 'Не удалось загрузить рейтинг', 'error');
    }
  };

  const handleCloseOverlay = () => {
    setGameState('MENU');
  };

  const allAchievementsList = useMemo(() => {
    if (lang === 'EN') {
      return [
        { id: 'FIRST_WORD', title: 'First Word!', icon: '🌟', desc: 'Build your very first word' },
        { id: 'THREE_WORDS', title: 'Learner', icon: '🔥', desc: 'Build 3 words' },
        { id: 'FIVE_WORDS', title: 'Word Master', icon: '🏆', desc: 'Build 5 words' },
        { id: 'TEN_WORDS', title: 'Legend', icon: '👑', desc: 'Build 10 words' },
        { id: 'MATH_FIRST', title: 'First Count!', icon: '🔢', desc: 'Open your first math reward' },
        { id: 'MATH_THREE', title: 'Number Explorer', icon: '🧠', desc: 'Collect 3 math rewards' },
        { id: 'MATH_LISTENER', title: 'Number Echo', icon: '🔊', desc: 'Unlock the Listen to Numbers reward' },
        { id: 'MATH_MASTER', title: 'Math Hero', icon: '🚀', desc: 'Collect 6 math rewards' }
      ];
    }
    if (lang === 'KG') {
      return [
        { id: 'FIRST_WORD', title: 'Биринчи сөз!', icon: '🌟', desc: 'Эң биринчи сөзүңдү чогулт' },
        { id: 'THREE_WORDS', title: 'Окуучу', icon: '🔥', desc: '3 сөз чогулт' },
        { id: 'FIVE_WORDS', title: 'Сөз чебери', icon: '🏆', desc: '5 сөз чогулт' },
        { id: 'TEN_WORDS', title: 'Уламыш', icon: '👑', desc: '10 сөз чогулт' },
        { id: 'MATH_FIRST', title: 'Биринчи эсеп!', icon: '🔢', desc: 'Биринчи математика белегиңди ач' },
        { id: 'MATH_THREE', title: 'Сан изилдөөчү', icon: '🧠', desc: '3 математика белегин чогулт' },
        { id: 'MATH_LISTENER', title: 'Сандын үнү', icon: '🔊', desc: 'Сандарды угуу режиминин белегин ач' },
        { id: 'MATH_MASTER', title: 'Математика баатыры', icon: '🚀', desc: '6 математика белегин чогулт' }
      ];
    }
    if (lang === 'UZ') {
      return [
        { id: 'FIRST_WORD', title: 'Birinchi so`z!', icon: '🌟', desc: 'Birinchi so`zingni yig`' },
        { id: 'THREE_WORDS', title: 'O`quvchi', icon: '🔥', desc: '3 ta so`z yig`' },
        { id: 'FIVE_WORDS', title: 'So`z ustasi', icon: '🏆', desc: '5 ta so`z yig`' },
        { id: 'TEN_WORDS', title: 'Afsona', icon: '👑', desc: '10 ta so`z yig`' },
        { id: 'MATH_FIRST', title: 'Birinchi sanoq!', icon: '🔢', desc: 'Birinchi matematika sovg`asini och' },
        { id: 'MATH_THREE', title: 'Son tadqiqotchisi', icon: '🧠', desc: '3 ta matematika sovg`asini yig`' },
        { id: 'MATH_LISTENER', title: 'Raqam sadosi', icon: '🔊', desc: 'Raqamlarni tinglash rejimi sovg`asini och' },
        { id: 'MATH_MASTER', title: 'Matematika qahramoni', icon: '🚀', desc: '6 ta matematika sovg`asini yig`' }
      ];
    }
    return [
      { id: 'FIRST_WORD', title: 'Первое слово!', icon: '🌟', desc: 'Собери своё самое первое слово' },
      { id: 'THREE_WORDS', title: 'Ученик', icon: '🔥', desc: 'Собери 3 слова' },
      { id: 'FIVE_WORDS', title: 'Мастер слов', icon: '🏆', desc: 'Собери 5 слов' },
      { id: 'TEN_WORDS', title: 'Легенда', icon: '👑', desc: 'Собери 10 слов' },
      { id: 'MATH_FIRST', title: 'Первый счёт!', icon: '🔢', desc: 'Открой первую математическую награду' },
      { id: 'MATH_THREE', title: 'Исследователь чисел', icon: '🧠', desc: 'Собери 3 математические награды' },
      { id: 'MATH_LISTENER', title: 'Голос цифр', icon: '🔊', desc: 'Открой награду в режиме «Слушай цифры»' },
      { id: 'MATH_MASTER', title: 'Герой математики', icon: '🚀', desc: 'Собери 6 математических наград' }
    ];
  }, [lang]);
  const isAdmin = Boolean(currentUser?.isAdmin);
  const effectiveWordProgressByLang = useMemo(
    () => (
      isAdmin
        ? LANGUAGE_CODES.reduce((acc, code) => {
            acc[code] = (wordsByLang[code] || []).map((item) => item.id).filter(Boolean);
            return acc;
          }, buildEmptyLangProgress())
        : stickersByLang
    ),
    [isAdmin, stickersByLang, wordsByLang]
  );
  const effectiveSyllableProgressByLang = useMemo(
    () => (
      isAdmin
        ? LANGUAGE_CODES.reduce((acc, code) => {
            acc[code] = (syllablesByLang[code] || []).map((item) => item.id).filter(Boolean);
            return acc;
          }, buildEmptyLangProgress())
        : syllableStickersByLang
    ),
    [isAdmin, syllableStickersByLang, syllablesByLang]
  );
  const derivedMathAchievementIds = useMemo(() => {
    const ids = [];
    if (mathCollection.length >= 1) ids.push('MATH_FIRST');
    if (mathCollection.length >= 3) ids.push('MATH_THREE');
    if (mathCollection.some((reward) => reward?.id === 'math-listen-badge')) ids.push('MATH_LISTENER');
    if (mathCollection.length >= 6) ids.push('MATH_MASTER');
    return ids;
  }, [mathCollection]);
  const effectiveAchievements = isAdmin
    ? allAchievementsList.map((achievement) => achievement.id)
    : Array.from(new Set([...achievements, ...derivedMathAchievementIds]));

  const checkAchievements = (stickersCount) => {
    const userKey = currentUser ? currentUser.username : 'guest';
    let newAchieve = null;
    if (stickersCount === 1 && !achievements.includes('FIRST_WORD')) newAchieve = allAchievementsList.find((item) => item.id === 'FIRST_WORD');
    else if (stickersCount === 3 && !achievements.includes('THREE_WORDS')) newAchieve = allAchievementsList.find((item) => item.id === 'THREE_WORDS');
    else if (stickersCount === 5 && !achievements.includes('FIVE_WORDS')) newAchieve = allAchievementsList.find((item) => item.id === 'FIVE_WORDS');
    else if (stickersCount === 10 && !achievements.includes('TEN_WORDS')) newAchieve = allAchievementsList.find((item) => item.id === 'TEN_WORDS');

    if (newAchieve) {
      const updatedList = [...achievements, newAchieve.id];
      setAchievements(updatedList);
      localStorage.setItem(`er_achievements_${userKey}`, JSON.stringify(updatedList));
      setCurrentAchievement(newAchieve);
      setTimeout(() => setCurrentAchievement(null), 4000);
    }
  };

  const normalizeLookalikeToken = (token) =>
    String(token || '')
      .toUpperCase()
      .split('')
      .map((char) => LOOKALIKE_CHAR_MAP[char] || char)
      .join('');

  const areUnitsCompatible = (activeUnit, expectedUnit) => {
    const active = String(activeUnit || '').trim().toUpperCase();
    const expected = String(expectedUnit || '').trim().toUpperCase();
    if (!active || !expected) return false;
    if (active === expected) return true;
    return normalizeLookalikeToken(active) === normalizeLookalikeToken(expected);
  };

  const registerFreshWin = () => {
    const nextStreak = winStreak + 1;
    setWinStreak(nextStreak);

    if (nextStreak % 3 === 0) {
      const reward = pickChestReward([...rewardCollection, ...pendingChestRewards], seasonEvent.key, lang);
      setPendingChestRewards((prev) => [...prev, reward.id]);
      setIsChestOpened(false);
      showToast(lang === 'EN'
        ? 'Treasure chest unlocked!'
        : lang === 'KG'
          ? 'Сюрприз сандык ачылды!'
          : lang === 'UZ'
            ? 'Syurpriz sandiq tayyor!'
            : 'Открыт сундук-сюрприз!', 'success');
    }
  };

  const revealChestReward = () => {
    const rewardId = pendingChestRewards[0];
    if (!rewardId) return;
    setIsChestOpened(true);
    if (!rewardCollection.includes(rewardId)) {
      setRewardCollection((prev) => [...prev, rewardId]);
    }
  };

  const closeChestReward = () => {
    setPendingChestRewards((prev) => prev.slice(1));
    setIsChestOpened(false);
  };

  const handleDragEnd = async (event) => {
    const { over, active } = event;
    if (!over) return;

    const activeIndex = parseInt(active.id.replace('drag-', ''), 10);
    const overIndex = parseInt(over.id.replace('slot-', ''), 10);

    const activeUnit = levelUnits[activeIndex];
    const expectedUnit = levelUnits[overIndex];
    const slotFilled = foundLetters.includes(overIndex);
    const dragAlreadyUsed = usedDragIndices.includes(activeIndex);
    const canPlace = areUnitsCompatible(activeUnit, expectedUnit);

    if (!slotFilled && !dragAlreadyUsed && canPlace) {
      const newFound = [...foundLetters, overIndex];
      const newUsed = [...usedDragIndices, activeIndex];
      const isLevelComplete = newFound.length === levelUnits.length;
      void playPlacementCelebrationTone(expectedUnit, isLevelComplete);
      setFoundLetters(newFound);
      setUsedDragIndices(newUsed);

      if (isLevelComplete) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

        const praiseByLang = {
          RU: ['Молодец!', 'Отлично!', 'Умница!', 'Замечательно!', 'Супер!', 'Браво!'],
          KG: ['Азамат!', 'Жакшы!', 'Сонун!', 'Мыкты!', 'Баракелде!'],
          UZ: ['Barakalla!', "Zo'r!", 'Ajoyib!', 'Yaxshi!', 'Ofarin!'],
          EN: ['Great job!', 'Excellent!', 'Well done!', 'Amazing!', 'Brilliant!']
        };
        const praises = praiseByLang[lang] || praiseByLang.RU;
        const praise = praises[Math.floor(Math.random() * praises.length)];

        // 1. Сначала произносим собранное слово
        setTimeout(() => {
          speakText(displayText, {
            kind: playMode === 'SYLLABLES' ? 'syllable' : 'word',
            pitch: 1.02,
            rate: lang === 'EN' ? 0.9 : lang === 'UZ' ? 0.84 : 0.82,
            interrupt: true
          });
        }, 200);

        // 2. Потом хвалим — мгновенно, без AI-задержки
        const praiseDelay = lang === 'KG' || lang === 'UZ'
          ? Math.max(2200, displayText.length * 260 + 800)
          : Math.max(1800, displayText.length * 230 + 600);
        setTimeout(() => {
          speakText(praise, { pitch: 0.82, rate: 0.88, interrupt: false });
        }, praiseDelay);

        const shouldRewardScore = playMode === 'SYLLABLES'
          ? currentLevel.id && !syllableStickers.includes(currentLevel.id)
          : currentLevel.id && !stickers.includes(currentLevel.id);
        const isFreshCompletion = Boolean(shouldRewardScore);

        if (currentUser && shouldRewardScore) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/update-score`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: currentUser.username, points: 10 })
            });
            const data = await res.json();
            if (data.success) setCurrentUser({ ...currentUser, score: data.newScore });
          } catch (e) { console.error("Не удалось сохранить прогресс"); }
        }

        if (playMode === 'WORDS' && currentLevel.id && !stickers.includes(currentLevel.id)) {
          const newS = [...stickers, currentLevel.id];
          setStickersByLang((prev) => {
            const next = { ...prev, [lang]: newS };
            localStorage.setItem(`er_stickers_map_${userKey}`, JSON.stringify(next));
            return next;
          });
          checkAchievements(newS.length);
        }

        if (playMode === 'SYLLABLES' && currentLevel.id && !syllableStickers.includes(currentLevel.id)) {
          const newSyllableSet = [...syllableStickers, currentLevel.id];
          setSyllableStickersByLang((prev) => {
            const next = { ...prev, [lang]: newSyllableSet };
            localStorage.setItem(`er_syllable_stickers_map_${userKey}`, JSON.stringify(next));
            return next;
          });
        }

        if (isFreshCompletion) {
          registerFreshWin();
        }
      }
    }
  };

  const isWin = foundLetters.length === levelUnits.length;
  const currentTheme = themes[theme] || themes.OCEAN;
  const aiTutorVisible = ['PLAYING', 'MATH_PLAYING', 'SYLLABLE_CLAP', 'RHYME_TIME', 'FIRST_SOUND'].includes(gameState);
  const aiTutorContext = useMemo(() => ({
    language: lang,
    playerName: currentUser?.username || '',
    gameState,
    playMode,
    mathMode,
    levelNumber: gameState === 'PLAYING' ? currentIdx + 1 : null,
    solvedCount: playMode === 'SYLLABLES' ? syllableStickers.length : stickers.length,
    foundCount: foundLetters.length,
    totalUnits: levelUnits.length,
    currentTask: gameState === 'PLAYING' ? {
      text: displayText,
      maskedText: isWin ? displayText : maskedDisplayText,
      difficulty: currentLevel?.difficulty || '',
      type: currentLevel?.syllableType || currentLevel?.rarity || ''
    } : null
  }), [
    currentIdx,
    currentLevel?.difficulty,
    currentLevel?.rarity,
    currentLevel?.syllableType,
    currentUser?.username,
    displayText,
    foundLetters.length,
    gameState,
    isWin,
    lang,
    levelUnits.length,
    maskedDisplayText,
    mathMode,
    playMode,
    stickers.length,
    syllableStickers.length
  ]);

  if (!isMounted || !serverData) return <div className="App-header"><h1>{uiText[lang]?.loading || 'Loading...'}</h1></div>;

  const rotateLabel = {
    EN: 'Rotate your device to play',
    RU: 'Поверни телефон горизонтально',
    KG: 'Телефонду капталга буруп ойно',
    UZ: 'O\'ynash uchun telefonni yotqizing'
  }[lang] || 'Поверни телефон горизонтально';

  return (
    <div style={{ background: currentTheme.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'inherit' }}>
      {isPortrait && isTouchLandscapeHintDevice && (
        <div className="rotate-overlay">
          <div className="rotate-phone-icon">📱</div>
          <div className="rotate-arrow">↻</div>
          <div className="rotate-label">{rotateLabel}</div>
        </div>
      )}
      {toast ? (
        <div className={`app-toast app-toast-${toast.tone}`} key={toast.id}>
          {toast.message}
        </div>
      ) : null}
      {loadError ? (
        <div className="app-toast app-toast-error">
          {loadError}
        </div>
      ) : null}
      
      {currentAchievement && (
        <div className="achievement-toast">
          <span style={{ fontSize: '2.5rem' }}>{currentAchievement.icon}</span>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#555', textTransform: 'uppercase' }}>{uiText[lang]?.achievementUnlocked}</div>
            <div>{currentAchievement.title}</div>
          </div>
        </div>
      )}

      <RewardChestModal
        lang={lang}
        reward={activeChestReward}
        seasonTitle={seasonEvent.title}
        opened={isChestOpened}
        pendingCount={chestQueue.length}
        onReveal={revealChestReward}
        onClose={closeChestReward}
      />

      {gameState === 'LEADERBOARD' && <Leaderboard leaderboard={leaderboard} onClose={handleCloseOverlay} lang={lang} />}
      {gameState === 'ACHIEVEMENTS' && <Achievements achievements={effectiveAchievements} allAchievementsList={allAchievementsList} onClose={handleCloseOverlay} lang={lang} />}
      {gameState === 'ADMIN' && (
        <AdminPanel
          onClose={handleCloseOverlay}
          apiBaseUrl={API_BASE_URL}
          adminToken={adminToken}
          showToast={showToast}
        />
      )}
      {gameState === 'ALBUM' && (
        <StickerAlbum
          wordsByLang={wordsByLang}
          wordProgressByLang={effectiveWordProgressByLang}
          syllablesByLang={syllablesByLang}
          syllableProgressByLang={effectiveSyllableProgressByLang}
          rewardCollection={unlockedRewardItems}
          mathCollection={mathCollection}
          onClose={handleCloseOverlay}
          lang={lang}
        />
      )}
      {gameState === 'SETTINGS' && <SettingsScreen lang={lang} onClose={handleCloseOverlay} speechRate={speechRate} setSpeechRate={setSpeechRate} toggleMusic={toggleMusic} isMusicOn={isMusicOn} musicVolume={musicVolume} onMusicVolumeChange={handleMusicVolumeChange} speechEngineStatus={speechEngineStatus} speechRuntimeStatus={speechRuntimeStatus} theme={theme} setTheme={setTheme} currentUser={currentUser} handleResetProgress={handleResetProgress} handleLogout={handleLogout} />}

      {gameState === 'MENU' && (
        <MainMenu 
          lang={lang} setLang={handleLanguageChange}
          setCurrentIdx={setCurrentIdx}
          playMode={playMode} setPlayMode={setPlayMode}
          mathMode={mathMode} setMathMode={setMathMode}
          setGameState={setGameState} 
          currentUser={currentUser}
          winStreak={winStreak}
          nextChestIn={nextChestIn}
          rewardCollectionCount={rewardCollection.length}
          mathCollectionCount={mathCollection.length}
          mathPreviewRewards={mathCollection.slice(-4)}
          seasonEvent={seasonEvent}
          hasPendingChest={Boolean(chestQueue.length)}
          handleLogout={handleLogout}
          handleResetProgress={handleResetProgress}
          authMode={authMode} setAuthMode={setAuthMode}
          usernameInput={usernameInput} setUsernameInput={setUsernameInput}
          passwordInput={passwordInput} setPasswordInput={setPasswordInput}
          selectedGame={menuSelectedGame}
          setSelectedGame={setMenuSelectedGame}
          showToast={showToast}
          handleLogin={handleLogin} handleRegister={handleRegister}
          fetchLeaderboard={fetchLeaderboard} toggleMusic={toggleMusic} isMusicOn={isMusicOn}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameScreen 
          currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}
          playMode={playMode} words={levels} word={currentLevel} foundLetters={foundLetters}
          usedDragIndices={usedDragIndices}
          letterStyle={letterStyle}
          levelUnits={levelUnits} displayText={displayText}
          speakText={speakText}
          prefetchSpeech={prefetchRemoteSpeech}
          shuffledLetters={shuffledLetters} handleDragEnd={handleDragEnd}
          isWin={isWin} currentTheme={currentTheme} lang={lang} 
          setGameState={setGameState} sensors={sensors}
        />
      )}
      {gameState === 'ALPHABET' && (
        <AlphabetScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'MATH_PLAYING' && (
        <MiniMathScreen
          lang={lang}
          mathMode={mathMode}
          currentTheme={currentTheme}
          collection={mathCollection}
          onCollectionChange={setMathCollection}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}

      {gameState === 'MEMORY_FLIP' && (
        <MemoryFlipScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'SOUND_QUIZ' && (
        <SoundQuizScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'COLOR_BY_NUMBER' && (
        <ColorByNumberScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'SYLLABLE_CLAP' && (
        <SyllableClapScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'RHYME_TIME' && (
        <RhymeTimeScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}
      {gameState === 'FIRST_SOUND' && (
        <FirstSoundScreen
          lang={lang}
          currentTheme={currentTheme}
          speakText={speakText}
          onClose={() => setGameState('MENU')}
        />
      )}

      <AiTutorPanel
        lang={lang}
        context={aiTutorContext}
        visible={aiTutorVisible}
        speakText={speakText}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}
