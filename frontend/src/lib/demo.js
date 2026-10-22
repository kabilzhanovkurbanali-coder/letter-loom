// Sample children for presentations, so teacher mode is not empty on a demo day.
// They are remembered as demo profiles and can be removed in one tap; real children are never touched.
import { FRIENDS } from './rewards';
import {
  MODULES, clearChildData, readProfiles, setLevelLocked, todayKey, writeActivityLevel, writeProfiles, writeStats
} from './progress';

const DEMO_KEY = 'll_demo_profiles';
const LANGS = ['EN', 'RU', 'KG', 'UZ'];

const NAMES = {
  RU: ['Малика', 'Азиз', 'Айбек', 'Мадина'],
  KG: ['Малика', 'Азиз', 'Айбек', 'Мадина'],
  UZ: ['Malika', 'Aziz', 'Aybek', 'Madina'],
  EN: ['Malika', 'Aziz', 'Aibek', 'Madina']
};

// Each child has a story the teacher can read from the dashboard.
const PLANS = [
  // reads a lot, loves speech games
  { strong: ['letters', 'speech'], weak: [], skip: ['logic'], days: 11, words: 34, syllables: 9, friends: 6, today: true },
  // counts well, finds syllables hard
  { strong: ['math', 'logic'], weak: ['word:SYLLABLES', 'listen:CLAP'], skip: [], days: 9, words: 12, syllables: 2, friends: 4 },
  // has just started; speech needs gentle practice
  { strong: [], weak: ['speak:SYLLABLES', 'artic:GYM'], skip: ['math', 'logic', 'memory'], days: 3, words: 4, syllables: 0, friends: 1 },
  // all-round, with levels fixed by the teacher
  { strong: ['memory'], weak: [], skip: [], days: 7, words: 18, syllables: 5, friends: 3, locked: true }
];

// small deterministic generator, so a demo looks the same every time
const seeded = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
};

const pastDays = (count) => Array.from({ length: count }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return todayKey(date);
});

const readDemo = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDemo = (names) => {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(names));
  } catch {
    // demo stays until reload
  }
};

export const demoProfiles = () => readDemo();
export const isDemoProfile = (name) => readDemo().includes(name);

const fillChild = (name, plan, seed) => {
  const random = seeded(seed);
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));
  const days = pastDays(14);
  const active = (plan.today ? [days[0]] : []).concat(days.slice(1).filter(() => random() < plan.days / 13)).slice(0, plan.days);
  const activities = {};
  let total = 0;

  MODULES.forEach((module) => {
    if (plan.skip.includes(module.id)) return;
    module.activities.forEach((activity) => {
      const isWeak = plan.weak.includes(activity.id);
      const isStrong = plan.strong.includes(module.id) && !isWeak;
      if (!isWeak && !isStrong && random() < 0.35) return;
      const tasks = isStrong ? between(14, 30) : isWeak ? between(6, 10) : between(4, 12);
      const ratio = isStrong ? 0.75 + random() * 0.2 : isWeak ? 0.25 + random() * 0.15 : 0.55 + random() * 0.3;
      activities[activity.id] = {
        tasks,
        clean: Math.round(tasks * ratio),
        sessions: Math.max(1, Math.floor(tasks / 5)),
        last: active[between(0, Math.max(0, active.length - 1))] || days[0]
      };
      total += tasks;
      if (!activity.noLevel) writeActivityLevel(name, activity.id, isStrong ? 3 : isWeak ? 1 : 2);
    });
  });

  const dayCounts = {};
  active.forEach((day, index) => {
    const share = index === active.length - 1 ? total - Object.values(dayCounts).reduce((a, b) => a + b, 0) : Math.round(total / active.length);
    dayCounts[day] = Math.max(1, share);
  });
  writeStats(name, { activities, days: dayCounts });

  const wordIds = Array.from({ length: plan.words }, (_, index) => index + 1);
  const wordMap = {};
  const syllableMap = {};
  LANGS.forEach((lang) => {
    wordMap[lang] = wordIds;
    syllableMap[lang] = Array.from({ length: plan.syllables }, (_, index) => `syll-${lang.toLowerCase()}-${index + 1}`);
  });
  localStorage.setItem(`er_stickers_map_${name}`, JSON.stringify(wordMap));
  localStorage.setItem(`er_syllable_stickers_map_${name}`, JSON.stringify(syllableMap));
  localStorage.setItem(`er_reward_collection_${name}`, JSON.stringify(FRIENDS.slice(0, plan.friends).map((friend) => friend.id)));
  localStorage.setItem(`er_win_streak_${name}`, String(plan.friends * 3 + 1));
  if (plan.locked) setLevelLocked(name, true);
};

// Adds the sample children (skipping any name a real child already uses) and returns the new list.
export const addDemoKids = (lang) => {
  const names = NAMES[lang] || NAMES.RU;
  const taken = new Set(readProfiles().map((item) => item.toLowerCase()));
  const added = [];
  names.forEach((name, index) => {
    if (taken.has(name.toLowerCase())) return;
    try {
      fillChild(name, PLANS[index], 7 + index * 31);
      added.push(name);
    } catch {
      clearChildData(name);
    }
  });
  writeDemo([...readDemo(), ...added]);
  const profiles = [...readProfiles(), ...added];
  writeProfiles(profiles);
  return profiles;
};

export const removeDemoKids = () => {
  const demo = new Set(readDemo());
  demo.forEach((name) => clearChildData(name));
  const profiles = readProfiles().filter((name) => !demo.has(name));
  writeProfiles(profiles);
  writeDemo([]);
  return profiles;
};
