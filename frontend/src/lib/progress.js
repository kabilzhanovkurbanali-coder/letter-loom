// Per-child progress kept only on this device (localStorage): who plays here, their adaptive level
// in every activity, and simple counters for the teacher. Nothing here is sent to the server.

export const PROFILES_STORAGE_KEY = 'll_profiles';
export const KID_NAME_PATTERN = /^[\p{L}\p{M}0-9' -]{1,24}$/u;
// a kindergarten group shares one tablet
export const MAX_PROFILES = 30;
const LANGS = ['RU', 'KG', 'UZ', 'EN'];
const MAX_DAYS_KEPT = 60;

// Every activity the teacher can see, grouped the way the brief lists the modules.
// `id` is "<game>:<mode>"; `menuKey` names it with the main menu's own labels.
export const MODULES = [
  {
    id: 'letters',
    icon: 'blocks',
    activities: [
      { id: 'word:WORDS', menuKey: 'words' }, { id: 'word:SYLLABLES', menuKey: 'syllables' }, { id: 'alphabet:BOOK', menuKey: 'alphabet', noLevel: true },
      { id: 'listen:FIRST', menuKey: 'firstSound' }, { id: 'listen:GUESS', menuKey: 'soundQuiz' }
    ]
  },
  {
    id: 'speech',
    icon: 'microphone',
    activities: [
      { id: 'artic:GYM', menuKey: 'gym' }, { id: 'speak:ECHO', menuKey: 'echo' }, { id: 'speak:SYLLABLES', menuKey: 'sayIt' },
      { id: 'speak:BLOW', menuKey: 'blow' },
      { id: 'listen:CLAP', menuKey: 'clap' }, { id: 'listen:RHYME', menuKey: 'rhyme' }
    ]
  },
  {
    id: 'math',
    icon: 'abacus',
    activities: [
      { id: 'math:COUNT', menuKey: 'mathCount' }, { id: 'math:NUMBERS', menuKey: 'mathNumbers' },
      { id: 'math:COMPARE', menuKey: 'mathCompare' }, { id: 'math:ADD', menuKey: 'mathAdd' }
    ]
  },
  {
    id: 'memory',
    icon: 'cards',
    activities: [
      { id: 'memory:PAIRS', menuKey: 'memory' }, { id: 'memory:MISSING', menuKey: 'missing' }, { id: 'memory:SEQUENCE', menuKey: 'sequence' },
      { id: 'color:PAINT', menuKey: 'color' }
    ]
  },
  { id: 'logic', icon: 'brain', activities: [{ id: 'logic:ODD', menuKey: 'odd' }, { id: 'logic:PATTERN', menuKey: 'pattern' }, { id: 'logic:SORT', menuKey: 'sort' }] }
];

const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage can be unavailable (private mode); progress then lives for this visit only
  }
};

// ---------- profiles ----------
export const readProfiles = () => {
  try {
    const parsed = JSON.parse(safeGet(PROFILES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, MAX_PROFILES) : [];
  } catch {
    return [];
  }
};

export const writeProfiles = (profiles) => {
  safeSet(PROFILES_STORAGE_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
};

// Puts the child first (most recent) without duplicating names that differ only in case.
export const rememberProfile = (name) => {
  const next = [name, ...readProfiles().filter((item) => item.toLowerCase() !== name.toLowerCase())].slice(0, MAX_PROFILES);
  writeProfiles(next);
  return next;
};

// ---------- levels ----------
export const levelKeys = (userKey, activityId, lang) => {
  const [game, mode] = activityId.split(':');
  // word games keep a level per language because the words differ
  if (game === 'word') return (lang ? [lang] : LANGS).map((code) => `ll_word_level_${userKey}_${code}_${mode}`);
  return [`ll_${game}_level_${userKey}_${mode}`];
};

export const readActivityLevel = (userKey, activityId, lang) => {
  const value = Number(safeGet(levelKeys(userKey, activityId, lang)[0]));
  return value >= 1 && value <= 3 ? value : 1;
};

export const writeActivityLevel = (userKey, activityId, level) => {
  levelKeys(userKey, activityId).forEach((key) => safeSet(key, String(level)));
};

const lockKey = (userKey) => `ll_level_lock_${userKey}`;
// When the teacher locks levels, games keep the chosen level instead of adapting it.
export const isLevelLocked = (userKey) => safeGet(lockKey(userKey)) === '1';
export const setLevelLocked = (userKey, locked) => safeSet(lockKey(userKey), locked ? '1' : '0');

// ---------- counters ----------
const statsKey = (userKey) => `ll_stats_${userKey}`;
const emptyStats = () => ({ activities: {}, days: {} });

export const todayKey = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const readStats = (userKey) => {
  try {
    const parsed = JSON.parse(safeGet(statsKey(userKey)) || 'null');
    if (parsed && typeof parsed === 'object') return { activities: parsed.activities || {}, days: parsed.days || {} };
  } catch {
    // fall through to empty
  }
  return emptyStats();
};

const updateStats = (userKey, activityId, change) => {
  if (!userKey || !activityId) return;
  const stats = readStats(userKey);
  const entry = { tasks: 0, clean: 0, sessions: 0, last: null, ...stats.activities[activityId] };
  change(entry, stats);
  entry.last = todayKey();
  stats.activities[activityId] = entry;
  const days = Object.keys(stats.days).sort();
  days.slice(0, Math.max(0, days.length - MAX_DAYS_KEPT)).forEach((day) => { delete stats.days[day]; });
  safeSet(statsKey(userKey), JSON.stringify(stats));
};

// One finished task; `clean` means the child solved it without slips or help.
export const recordTask = (userKey, activityId, clean) => updateStats(userKey, activityId, (entry, stats) => {
  entry.tasks += 1;
  if (clean) entry.clean += 1;
  const day = todayKey();
  stats.days[day] = (stats.days[day] || 0) + 1;
});

export const recordSession = (userKey, activityId) => updateStats(userKey, activityId, (entry) => {
  entry.sessions += 1;
});

// Activities worth practising together: enough tasks, and most of them needed help.
export const needsPractice = (entry) => Boolean(entry && entry.tasks >= 5 && entry.clean / entry.tasks < 0.5);

// Removes everything this device stores about one child (levels, counters, stickers).
export const clearChildData = (userKey) => {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!/^(ll|er)_/.test(key) || key === PROFILES_STORAGE_KEY) continue;
      if (key.endsWith(`_${userKey}`) || key.includes(`_${userKey}_`)) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    // nothing to clear
  }
};
