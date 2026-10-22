// Gentle, predictable rewards. Every few finished games Irbi brings a gift with a new friend,
// always in the same order (no random "rare" prizes), and awards simply reflect real progress.

export const GIFT_EVERY = 3;

export const FRIENDS = [
  { id: 'panda', names: { EN: 'panda', RU: 'панда', KG: 'панда', UZ: 'panda' } },
  { id: 'koala', names: { EN: 'koala', RU: 'коала', KG: 'коала', UZ: 'koala' } },
  { id: 'penguin', names: { EN: 'penguin', RU: 'пингвин', KG: 'пингвин', UZ: 'pingvin' } },
  { id: 'owl', names: { EN: 'owl', RU: 'сова', KG: 'үкү', UZ: 'boyqush' } },
  { id: 'dolphin', names: { EN: 'dolphin', RU: 'дельфин', KG: 'дельфин', UZ: 'delfin' } },
  { id: 'hedgehog', names: { EN: 'hedgehog', RU: 'ёжик', KG: 'кирпи', UZ: 'tipratikan' } },
  { id: 'turtle', names: { EN: 'turtle', RU: 'черепаха', KG: 'ташбака', UZ: 'toshbaqa' } },
  { id: 'butterfly', names: { EN: 'butterfly', RU: 'бабочка', KG: 'көпөлөк', UZ: 'kapalak' } },
  { id: 'giraffe', names: { EN: 'giraffe', RU: 'жираф', KG: 'жираф', UZ: 'jirafa' } },
  { id: 'zebra', names: { EN: 'zebra', RU: 'зебра', KG: 'зебра', UZ: 'zebra' } },
  { id: 'camel', names: { EN: 'camel', RU: 'верблюд', KG: 'төө', UZ: 'tuya' } },
  { id: 'eagle', names: { EN: 'eagle', RU: 'орёл', KG: 'бүркүт', UZ: 'burgut' } }
];

const FRIEND_IDS = new Set(FRIENDS.map((friend) => friend.id));
export const isFriendId = (id) => FRIEND_IDS.has(id);
export const friendName = (id, lang) => {
  const friend = FRIENDS.find((item) => item.id === id);
  return friend ? friend.names[lang] || friend.names.RU : '';
};

// The first friend the child does not have yet (and is not already waiting in a gift).
export const nextFriendId = (takenIds) => {
  const taken = new Set(takenIds);
  return FRIENDS.find((friend) => !taken.has(friend.id))?.id || null;
};

const sessionsWhere = (stats, test) => Object.entries(stats?.activities || {})
  .filter(([id]) => test(id))
  .reduce((sum, [, entry]) => sum + (entry?.sessions || 0), 0);

const starts = (...prefixes) => (id) => prefixes.some((prefix) => id.startsWith(prefix));

// [id, picture, how to measure, goal]
const AWARD_RULES = [
  ['firstWord', 'blocks', (p) => p.words, 1],
  ['words10', 'book', (p) => p.words, 10],
  ['words30', 'crown', (p) => p.words, 30],
  ['syllables5', 'puzzle', (p) => p.syllables, 5],
  ['counting', 'abacus', (p) => sessionsWhere(p.stats, starts('math:')), 3],
  ['logic', 'shapes', (p) => sessionsWhere(p.stats, starts('logic:')), 3],
  ['memory', 'cards', (p) => sessionsWhere(p.stats, starts('memory:')), 3],
  ['speech', 'microphone', (p) => sessionsWhere(p.stats, starts('speak:', 'listen:CLAP', 'listen:RHYME')), 3],
  ['artic', 'mirror', (p) => sessionsWhere(p.stats, starts('artic:')), 3],
  ['listening', 'ear', (p) => sessionsWhere(p.stats, starts('listen:GUESS', 'listen:FIRST')), 3],
  ['artist', 'palette', (p) => sessionsWhere(p.stats, starts('color:')), 3],
  ['friends', 'gift', (p) => p.friends, 6],
  ['days', 'calendar', (p) => Object.values(p.stats?.days || {}).filter((count) => count > 0).length, 7]
];

export const AWARD_TITLES = {
  EN: {
    firstWord: 'First word', words10: '10 words', words30: '30 words', syllables5: 'Syllables: 5 words',
    counting: 'I can count', logic: 'Clever thinker', memory: 'Great memory', speech: 'Great talker',
    artic: 'Happy tongue', listening: 'Good listener', artist: 'Artist', friends: 'Lots of friends', days: '7 days with Irbi'
  },
  RU: {
    firstWord: 'Первое слово', words10: '10 слов', words30: '30 слов', syllables5: 'Слоги: 5 слов',
    counting: 'Умею считать', logic: 'Смекалка', memory: 'Хорошая память', speech: 'Красиво говорю',
    artic: 'Весёлый язычок', listening: 'Внимательные ушки', artist: 'Художник', friends: 'Много друзей', days: '7 дней с Ирби'
  },
  KG: {
    firstWord: 'Биринчи сөз', words10: '10 сөз', words30: '30 сөз', syllables5: 'Муундар: 5 сөз',
    counting: 'Санай алам', logic: 'Тапкыч', memory: 'Жакшы эс тутум', speech: 'Сонун сүйлөйм',
    artic: 'Шайыр тил', listening: 'Сак кулак', artist: 'Сүрөтчү', friends: 'Достор көп', days: 'Ирби менен 7 күн'
  },
  UZ: {
    firstWord: 'Birinchi so‘z', words10: '10 ta so‘z', words30: '30 ta so‘z', syllables5: 'Bo‘g‘inlar: 5 so‘z',
    counting: 'Sanay olaman', logic: 'Zukko', memory: 'Yaxshi xotira', speech: 'Chiroyli gapiraman',
    artic: 'Quvnoq til', listening: 'Ziyrak quloq', artist: 'Rassom', friends: 'Do‘stlar ko‘p', days: 'Irbi bilan 7 kun'
  }
};

// progress: { words, syllables, friends, stats } → every award with its value, goal and state.
export const computeAwards = (progress) => AWARD_RULES.map(([id, icon, measure, goal]) => {
  const value = Math.max(0, Number(measure(progress)) || 0);
  return { id, icon, goal, value: Math.min(value, goal), done: value >= goal };
});

const seenKey = (userKey) => `ll_awards_seen_${userKey}`;

export const readSeenAwards = (userKey) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenKey(userKey)) || 'null');
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeSeenAwards = (userKey, ids) => {
  try {
    localStorage.setItem(seenKey(userKey), JSON.stringify(ids));
  } catch {
    // nothing to remember
  }
};
