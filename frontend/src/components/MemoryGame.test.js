import { render, fireEvent, act } from '@testing-library/react';
import { MemoryGame, buildMemoryTask } from './MemoryGame';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxBoop: jest.fn(), sfxPick: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn(), sfxWhoosh: jest.fn()
}));

const vocabulary = ['cat', 'dog', 'fish', 'car', 'sun', 'tree', 'moon', 'star', 'cow', 'duck', 'frog', 'bird']
  .map((image) => ({ image, text: image.toUpperCase() }));

describe('MemoryGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('builds boards that fit each activity and level', () => {
    const pairs = buildMemoryTask('PAIRS', 1, vocabulary);
    expect(pairs.cards).toHaveLength(6);
    expect(new Set(pairs.cards.map((card) => card.image)).size).toBe(3);

    const missing = buildMemoryTask('MISSING', 2, vocabulary);
    expect(missing.items).toHaveLength(4);
    expect(missing.choices.map((c) => c.image)).toContain(missing.answer);
    expect(missing.items.map((i) => i.image)).toContain(missing.answer);

    const sequence = buildMemoryTask('SEQUENCE', 3, vocabulary);
    expect(sequence.sequence).toHaveLength(4);
    sequence.sequence.forEach((index, i) => {
      expect(index).toBeLessThan(sequence.pads.length);
      if (i > 0) expect(index).not.toBe(sequence.sequence[i - 1]);
    });
  });

  test('matching all pairs finishes the board and names each picture', () => {
    const speakText = jest.fn();
    render(
      <MemoryGame lang="RU" activity="PAIRS" vocabulary={vocabulary} userKey="kid" speakText={speakText} prefetchSpeech={jest.fn()} onSessionComplete={jest.fn()} onExit={jest.fn()} />
    );
    const images = Array.from(document.querySelectorAll('.mm-card')).map((el) => el.dataset.image);
    expect(images).toHaveLength(6);

    const done = new Set();
    images.forEach((image, i) => {
      if (done.has(image)) return;
      const j = images.findIndex((other, k) => k !== i && other === image);
      const cards = document.querySelectorAll('.mm-card');
      fireEvent.click(cards[i]);
      fireEvent.click(cards[j]);
      act(() => { jest.advanceTimersByTime(600); });
      done.add(image);
    });

    expect(speakText).toHaveBeenCalledWith(images[0], expect.objectContaining({ kind: 'word' }));
    expect(document.querySelectorAll('.mm-card.is-matched')).toHaveLength(6);
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});
