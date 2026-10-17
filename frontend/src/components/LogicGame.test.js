import { render, fireEvent, act } from '@testing-library/react';
import { LogicGame, buildLogicTask } from './LogicGame';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxBoop: jest.fn(), sfxNote: jest.fn(), sfxPick: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn()
}));

const vocabulary = ['cat', 'dog', 'apple', 'banana', 'car', 'bus']
  .map((image) => ({ image, text: image.toUpperCase() }));

const renderGame = (activity, speakText = jest.fn()) => render(
  <LogicGame lang="RU" activity={activity} vocabulary={vocabulary} userKey="kid" speakText={speakText} prefetchSpeech={jest.fn()} onSessionComplete={jest.fn()} onExit={jest.fn()} />
);

describe('LogicGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('odd-one-out boards have exactly one item that stands apart', () => {
    for (let round = 0; round < 40; round += 1) {
      const level = (round % 3) + 1;
      const task = buildLogicTask('ODD', level, round);
      expect(task.items).toHaveLength([0, 3, 4, 5][level]);
      const odd = task.items.find((item) => item.id === task.answer);
      const rest = task.items.filter((item) => item.id !== task.answer);
      if (task.reason.type === 'color') rest.forEach((item) => expect(item.color).not.toBe(odd.color));
      if (task.reason.type === 'color') expect(new Set(rest.map((item) => item.color)).size).toBe(1);
      if (task.reason.type === 'shape') expect(new Set(rest.map((item) => item.shape)).size).toBe(1);
      if (task.reason.type === 'shape') rest.forEach((item) => expect(item.shape).not.toBe(odd.shape));
    }
  });

  test('patterns repeat their unit and the answer continues it', () => {
    const units = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };
    for (let round = 0; round < 40; round += 1) {
      const level = (round % 3) + 1;
      const task = buildLogicTask('PATTERN', level, round);
      const unit = units[task.pattern];
      task.beads.forEach((bead, index) => expect(bead.step).toBe(unit[index % unit.length]));
      expect(task.answerToken.step).toBe(unit[task.beads.length % unit.length]);
      expect(task.beads.length).toBeLessThanOrEqual(8);
      expect(task.choices).toHaveLength([0, 2, 3, 3][level]);
      expect(new Set(task.choices.map((choice) => choice.id)).size).toBe(task.choices.length);
      expect(task.choices.map((choice) => choice.id)).toContain(task.answer);
    }
  });

  test('sorting rounds rotate between colour, shape and size', () => {
    const criteria = [0, 1, 2].map((round) => buildLogicTask('SORT', 3, round).criterion);
    expect(criteria).toEqual(['color', 'shape', 'size']);
    const task = buildLogicTask('SORT', 3, 0);
    expect(task.bins).toHaveLength(3);
    task.items.forEach((item) => expect(task.bins).toContain(item.group));
  });

  test('a wrong pick fades softly, the odd one wins a star', () => {
    renderGame('ODD');
    const board = document.querySelector('.lg-board');
    const answer = board.dataset.answer;
    const wrong = document.querySelector(`.lg-odd-item:not([data-id="${answer}"])`);
    fireEvent.click(wrong);
    act(() => { jest.advanceTimersByTime(600); });
    expect(wrong.className).toContain('is-faded');
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(0);

    fireEvent.click(document.querySelector(`.lg-odd-item[data-id="${answer}"]`));
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('the pattern answer fills the slot after the tune is sung', () => {
    renderGame('PATTERN');
    act(() => { jest.advanceTimersByTime(6000); });
    const answer = document.querySelector('.lg-board').dataset.answer;
    fireEvent.click(document.querySelector(`.lg-choice[data-id="${answer}"]`));
    expect(document.querySelector('.lg-bead-slot.is-filled')).not.toBeNull();
    act(() => { jest.advanceTimersByTime(6000); });
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('tap an item, then its basket, to sort everything', () => {
    renderGame('SORT');
    act(() => { jest.advanceTimersByTime(500); });
    const items = Array.from(document.querySelectorAll('.lg-tray-item')).map((el) => [el.dataset.id, el.dataset.group]);
    items.forEach(([id, group]) => {
      const el = document.querySelector(`.lg-tray-item[data-id="${id}"]`);
      fireEvent.pointerDown(el);
      fireEvent.pointerUp(el);
      fireEvent.click(document.querySelector(`.lg-bin[data-bin="${group}"]`));
    });
    act(() => { jest.advanceTimersByTime(600); });
    expect(document.querySelectorAll('.lg-bin-item')).toHaveLength(items.length);
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});
