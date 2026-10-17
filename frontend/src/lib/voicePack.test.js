import { downloadPhrases, uniquePhrases } from './voicePack';
import { menuVoicePhrases } from '../components/MainMenu';
import { voicePhrases as wordPhrases } from '../components/WordGame';
import { voicePhrases as mathPhrases } from '../components/MathGame';
import { voicePhrases as memoryPhrases } from '../components/MemoryGame';
import { voicePhrases as logicPhrases } from '../components/LogicGame';
import { voicePhrases as speakPhrases } from '../components/SpeakGame';

const words = [{ image: 'cat', text: 'КОТ', units: ['К', 'О', 'Т'] }, { image: 'apple', text: 'ЯБЛОКО' }];
const syllables = [{ text: 'МА-ШИ-НА', units: ['МА', 'ШИ', 'НА'] }];

const packFor = (lang) => uniquePhrases([
  ...menuVoicePhrases(lang),
  ...wordPhrases(lang, { words, syllables }),
  ...mathPhrases(lang),
  ...memoryPhrases(lang, { words }),
  ...logicPhrases(lang, { words }),
  ...speakPhrases(lang)
]);

test('the voice pack holds the phrases games say, with their speech options', () => {
  const pack = packFor('RU');
  const has = (text, kind) => pack.some((phrase) => phrase.text === text && (phrase.options.kind || '') === (kind || ''));
  expect(has('Собери слово: кот')).toBe(true);
  expect(has('кот', 'word')).toBe(true);
  expect(has('Найди букву: ка')).toBe(true);
  expect(has('ма, ши, на. машина!', 'word')).toBe(true);
  expect(has('Найди цифру пять')).toBe(true);
  expect(has('Два и три — это пять!')).toBe(true);
  expect(has('Яблоко! Остальные — животные!')).toBe(true);
  expect(has('Скажем вместе: гав, гав')).toBe(true);
  expect(has('ба', 'syllable')).toBe(true);
  expect(has('Повтори звук')).toBe(true);
  // button labels are never spoken
  expect(has('Дальше')).toBe(false);
  ['EN', 'KG', 'UZ'].forEach((lang) => expect(packFor(lang).length).toBeGreaterThan(300));
});

test('downloads a few at a time and counts failures without stopping', async () => {
  const phrases = Array.from({ length: 10 }, (_, i) => ({ text: `p${i}`, options: {} }));
  const progress = jest.fn();
  const result = await downloadPhrases(phrases, async ({ text }) => {
    if (text === 'p3') throw new Error('offline');
  }, progress);
  expect(result).toEqual({ done: 10, failed: 1, total: 10 });
  expect(progress).toHaveBeenLastCalledWith({ done: 10, failed: 1, total: 10 });
});
