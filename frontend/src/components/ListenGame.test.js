import { render, fireEvent, act } from '@testing-library/react';
import { ListenGame, buildListenTask } from './ListenGame';
import { ColoringGame, buildColoringTask } from './ColoringGame';
import { AlphabetBook } from './AlphabetBook';
import { glyphFor } from '../lib/glyphs';

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
  beforeEach(() => window.localStorage.clear());

  // jsdom draws nothing: the card is mapped 1:1 onto glyph units, so a finger can follow the strokes
  const roadOf = () => {
    const svg = document.querySelector('.lt');
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, x: 0, y: 0, width: vw, height: vh, right: vw, bottom: vh });
    return { svg, at: (point) => ({ clientX: point.x - vx, clientY: point.y - vy, pointerId: 1 }) };
  };

  test('turns pages and says the letter as a sound, or by its name if chosen', () => {
    const speakText = jest.fn();
    const { unmount } = render(<AlphabetBook {...props} speakText={speakText} />);
    expect(document.querySelector('.ab-board').dataset.letter).toBe('А');
    fireEvent.click(document.querySelector('.ab-turn-next'));
    expect(document.querySelector('.ab-board').dataset.letter).toBe('Б');
    expect(speakText).toHaveBeenCalledWith('бы', expect.objectContaining({ kind: 'sound' }));
    unmount();

    window.localStorage.setItem('ll_letter_mode', 'name');
    render(<AlphabetBook {...props} speakText={speakText} />);
    fireEvent.click(document.querySelector('.ab-turn-next'));
    expect(speakText).toHaveBeenCalledWith('Это буква бэ', expect.anything());
  });

  test('has the whole alphabet, Ё and Щ too', () => {
    render(<AlphabetBook {...props} />);
    const letters = Array.from(document.querySelectorAll('.ab-strip-item')).map((item) => item.textContent);
    expect(letters).toHaveLength(33);
    expect(letters).toEqual(expect.arrayContaining(['Ё', 'Й', 'Щ', 'Ъ', 'Ь']));
  });

  test('a letter traced along its road comes alive and fills a star', () => {
    const speakText = jest.fn();
    render(<AlphabetBook {...props} speakText={speakText} />);
    const { svg, at } = roadOf();

    // touching away from the start: Irbi shows where to begin
    fireEvent.pointerDown(svg, at({ x: 80, y: 110 }));
    fireEvent.pointerUp(svg, at({ x: 80, y: 110 }));
    expect(speakText).toHaveBeenCalledWith('Начни с зелёной точки', expect.anything());
    expect(svg.dataset.done).toBe('no');

    glyphFor('А').strokes.forEach((stroke) => {
      fireEvent.pointerDown(svg, at(stroke.points[0]));
      stroke.points.forEach((point) => fireEvent.pointerMove(svg, at(point)));
      fireEvent.pointerUp(svg, at(stroke.points[stroke.points.length - 1]));
    });
    expect(svg.dataset.done).toBe('yes');
    expect(document.querySelector('.ab-trace-card.is-done')).not.toBeNull();
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('a scribble that leaves the road does not count', () => {
    render(<AlphabetBook {...props} />);
    const { svg, at } = roadOf();
    const first = glyphFor('А').strokes[0];
    fireEvent.pointerDown(svg, at(first.points[0]));
    [{ x: 60, y: 40 }, { x: 80, y: 80 }, { x: 20, y: 100 }].forEach((point) => fireEvent.pointerMove(svg, at(point)));
    fireEvent.pointerUp(svg, at({ x: 20, y: 100 }));
    expect(svg.dataset.stroke).toBe('0');
    expect(svg.dataset.done).toBe('no');
  });
});

describe('first sound', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  test('asks for the first sound, or for the letter name if grown-ups chose names', () => {
    const speakText = jest.fn();
    const { unmount } = render(<ListenGame {...props} activity="FIRST" speakText={speakText} />);
    act(() => { jest.advanceTimersByTime(2500); });
    expect(speakText.mock.calls.some(([text]) => /^Что начинается на звук /.test(text))).toBe(true);
    unmount();

    window.localStorage.setItem('ll_letter_mode', 'name');
    speakText.mockClear();
    render(<ListenGame {...props} activity="FIRST" speakText={speakText} />);
    act(() => { jest.advanceTimersByTime(2500); });
    expect(speakText.mock.calls.some(([text]) => /^Что начинается на (?!звук)/.test(text))).toBe(true);
  });
});
