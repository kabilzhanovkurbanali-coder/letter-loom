import { render, screen, fireEvent, act } from '@testing-library/react';
import { MathGame, buildTask, makeChoices } from './MathGame';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxBoop: jest.fn(), sfxPick: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn(), sfxWhoosh: jest.fn()
}));

describe('MathGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('answer cards always contain the answer, sorted, within range', () => {
    for (let i = 0; i < 200; i += 1) {
      const answer = 1 + (i % 10);
      const choices = makeChoices(answer, 3, 10);
      expect(choices).toContain(answer);
      expect(choices).toEqual([...choices].sort((a, b) => a - b));
      expect(new Set(choices).size).toBe(choices.length);
      choices.forEach((value) => expect(value).toBeGreaterThanOrEqual(1));
    }
  });

  test('tasks respect the beginner range', () => {
    for (let i = 0; i < 100; i += 1) {
      const count = buildTask('COUNT', 1);
      expect(count.n).toBeLessThanOrEqual(3);
      expect(count.choices).toHaveLength(2);
      const add = buildTask('ADD', 1);
      expect(add.a + add.b).toBeLessThanOrEqual(3);
      expect(add.a).toBeGreaterThanOrEqual(1);
      const compare = buildTask('COMPARE', 1);
      expect(Math.abs(compare.left - compare.right)).toBeGreaterThanOrEqual(3);
      expect(compare.ask).toBe('more');
    }
  });

  test('a child counts the objects and picks the right number', () => {
    const speakText = jest.fn();
    render(
      <MathGame lang="RU" activity="COUNT" userKey="kid" speakText={speakText} prefetchSpeech={jest.fn()} onSessionComplete={jest.fn()} onExit={jest.fn()} />
    );

    const objects = document.querySelectorAll('.mg-object');
    expect(objects.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(objects[0]);
    expect(speakText).toHaveBeenCalledWith('один', expect.anything());
    expect(document.querySelector('.mg-count-badge').textContent).toBe('1');

    const answer = document.querySelector('.mg-board').dataset.answer;
    fireEvent.click(document.querySelector(`.mg-card[aria-label="${answer}"]`));
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByRole('button', { name: /дальше/i })).toBeInTheDocument();
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});
