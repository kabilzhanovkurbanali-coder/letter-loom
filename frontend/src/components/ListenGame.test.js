import { render, fireEvent, act } from '@testing-library/react';
import { ListenGame, buildListenTask } from './ListenGame';
import { ColoringGame, buildColoringTask } from './ColoringGame';
import { AlphabetBook } from './AlphabetBook';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxBoop: jest.fn(), sfxClap: jest.fn(), sfxNote: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn(), sfxWhoosh: jest.fn()
}));

const vocabulary = [
  ['cat', 'КОТ'], ['dog', 'СОБАКА'], ['fish', 'РЫБА'], ['car', 'МАШИНА'], ['sun', 'СОЛНЦЕ'], ['tree', 'ДЕРЕВО'], ['moon', 'ЛУНА']
].map(([image, text]) => ({ image, text, units: text.split('') }));

const props = { lang: 'RU', vocabulary, userKey: 'kid', speakText: jest.fn(), prefetchSpeech: jest.fn(), onSessionComplete: jest.fn(), onExit: jest.fn() };

describe('listening games', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  test('builds fair tasks for every activity', () => {
    for (let i = 0; i < 30; i += 1) {
      const level = (i % 3) + 1;
      const first = buildListenTask('FIRST', level, 'RU', vocabulary);
      const firstLetters = first.choices.map((choice) => choice.first);
      expect(firstLetters.filter((letter) => letter === first.letter)).toHaveLength(1);
      expect(first.choices.length).toBeLessThanOrEqual([0, 2, 3, 4][level]);

      const rhyme = buildListenTask('RHYME', level, 'UZ', vocabulary);
      expect(rhyme.choices.map((choice) => choice.image)).toContain(rhyme.answer);
      expect(rhyme.choices.map((choice) => choice.image)).not.toContain(rhyme.image);

      const clap = buildListenTask('CLAP', level, 'KG', vocabulary);
      expect(Number(clap.answer)).toBe(clap.units.length);
    }
  });

  test('guess: a wrong picture fades, the right one wins a star', () => {
    render(<ListenGame {...props} activity="GUESS" />);
    const answer = document.querySelector('.ls-board').dataset.answer;
    const wrong = document.querySelector(`.ls-choice:not([data-image="${answer}"])`);
    fireEvent.click(wrong);
    act(() => { jest.advanceTimersByTime(600); });
    expect(wrong.className).toContain('is-faded');
    fireEvent.click(document.querySelector(`.ls-choice[data-image="${answer}"]`));
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('clap: one clap per syllable finishes the word', () => {
    render(<ListenGame {...props} activity="CLAP" />);
    act(() => { jest.advanceTimersByTime(7000); });
    const syllables = Number(document.querySelector('.ls-board').dataset.answer);
    for (let i = 0; i < syllables; i += 1) fireEvent.click(document.querySelector('.ls-clapper'));
    act(() => { jest.advanceTimersByTime(4000); });
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('clap: a wrong count claps along with Irbi, never a dead end', () => {
    render(<ListenGame {...props} activity="CLAP" />);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      act(() => { jest.advanceTimersByTime(7000); });
      for (let i = 0; i < 6; i += 1) fireEvent.click(document.querySelector('.ls-clapper'));
      act(() => { jest.advanceTimersByTime(1500); });
    }
    act(() => { jest.advanceTimersByTime(8000); });
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});

describe('coloring', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  test('pictures use the paints their level promises', () => {
    expect(buildColoringTask(1).paints.length).toBeLessThanOrEqual(2);
    expect(buildColoringTask(3).paints.length).toBeGreaterThanOrEqual(3);
  });

  test('painting every numbered square with its paint completes the picture', () => {
    render(<ColoringGame {...props} />);
    const cells = Array.from(document.querySelectorAll('.cg-cell[data-cell]'));
    const wrongPaint = document.querySelectorAll('.cg-pot')[1];
    // a square of the first paint tapped with the second paint only wobbles
    fireEvent.click(wrongPaint);
    const firstPaint = document.querySelector('.cg-pot').dataset.paint;
    const target = cells.find((cell) => cell.textContent === firstPaint);
    document.elementFromPoint = () => target;
    fireEvent.pointerDown(document.querySelector('.cg-grid'));
    fireEvent.pointerUp(document.querySelector('.cg-grid'));
    expect(target.className).not.toContain('is-painted');

    Array.from(document.querySelectorAll('.cg-pot')).forEach((pot) => {
      fireEvent.click(pot);
      cells.filter((cell) => cell.textContent === pot.dataset.paint).forEach((cell) => {
        document.elementFromPoint = () => cell;
        fireEvent.pointerDown(document.querySelector('.cg-grid'));
        fireEvent.pointerUp(document.querySelector('.cg-grid'));
      });
    });
    expect(document.querySelector('.cg-grid.is-done')).not.toBeNull();
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});

describe('alphabet book', () => {
  // jsdom has no canvas; tracing simply draws nothing here
  beforeAll(() => { HTMLCanvasElement.prototype.getContext = () => null; });

  test('turns pages and names the letter', () => {
    const speakText = jest.fn();
    render(<AlphabetBook {...props} speakText={speakText} />);
    expect(document.querySelector('.ab-board').dataset.letter).toBe('А');
    fireEvent.click(document.querySelector('.ab-turn-next'));
    expect(document.querySelector('.ab-board').dataset.letter).toBe('Б');
    expect(speakText).toHaveBeenCalledWith('Это буква бэ', expect.anything());
  });
});
