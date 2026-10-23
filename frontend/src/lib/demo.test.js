import { demoProfiles, removeDemoKids, seedDemoOnce } from './demo';
import { addLocalScore, readLocalScore, readProfiles, readStats, rememberProfile } from './progress';

beforeEach(() => window.localStorage.clear());

test('the website copy opens with children who have already played', () => {
  window.localStorage.setItem('er_lang', 'UZ');
  seedDemoOnce();
  expect(readProfiles()).toEqual(['Malika', 'Aziz', 'Aybek', 'Madina']);
  expect(demoProfiles()).toHaveLength(4);
  // stars, stats and album friends, as if they had played for days
  expect(readLocalScore('Malika')).toBeGreaterThan(100);
  expect(Object.keys(readStats('Malika').activities).length).toBeGreaterThan(5);
  expect(JSON.parse(window.localStorage.getItem('er_reward_collection_Malika'))).toHaveLength(6);
});

test('demo children come only once, next to the children who already play here', () => {
  rememberProfile('Айгерим');
  seedDemoOnce();
  expect(readProfiles()).toEqual(['Айгерим', 'Малика', 'Азиз', 'Айбек', 'Мадина']);

  // removed in teacher mode, they stay removed
  removeDemoKids();
  seedDemoOnce();
  expect(readProfiles()).toEqual(['Айгерим']);
});

test('a child playing without the server keeps stars on the device', () => {
  expect(readLocalScore('Айгерим')).toBe(0);
  addLocalScore('Айгерим', 10);
  expect(addLocalScore('Айгерим', 10)).toBe(20);
  expect(readLocalScore('Айгерим')).toBe(20);
});
