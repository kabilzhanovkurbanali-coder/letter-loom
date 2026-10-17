import { render, screen, fireEvent, act } from '@testing-library/react';
import { WordGame, pickNextIndex } from './WordGame';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxBoop: jest.fn(), sfxPick: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn(), sfxWhoosh: jest.fn()
}));

const levels = [
  { id: 1, text: 'КОТ', units: ['К', 'О', 'Т'], img: '/images/cat.webp', image: 'cat' },
  { id: 2, text: 'СОБАКА', units: ['С', 'О', 'Б', 'А', 'К', 'А'], img: '/images/dog.webp', image: 'dog' },
  { id: 3, text: 'РЫБА', units: ['Р', 'Ы', 'Б', 'А'], img: '/images/fish.webp', image: 'fish' }
];

const tapTile = (letter) => {
  const tile = screen.getAllByRole('button', { name: letter }).find((node) => node.classList.contains('wg-tile'));
  fireEvent.pointerDown(tile, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerUp(tile, { clientX: 10, clientY: 10, pointerId: 1 });
};

describe('WordGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('picks the next short unsolved word for a beginner', () => {
    expect(pickNextIndex(levels, 0, 1, 'WORDS', [])).toBe(2);
    expect(pickNextIndex(levels, 0, 3, 'WORDS', [])).toBe(1);
    expect(pickNextIndex(levels, 2, 1, 'WORDS', [3])).toBe(0);
  });

  test('a beginner builds a word by tapping letters and gets the reward', () => {
    const onWordComplete = jest.fn();
    const speakText = jest.fn();
    render(
      <WordGame
        lang="RU"
        playMode="WORDS"
        levels={levels}
        currentIdx={0}
        setCurrentIdx={jest.fn()}
        solvedIds={[]}
        userKey="kid"
        speakText={speakText}
        prefetchSpeech={jest.fn()}
        onWordComplete={onWordComplete}
        onExit={jest.fn()}
      />
    );

    // beginner level: only the word's own letters, ghost letters in the slots
    expect(document.querySelectorAll('.wg-tile')).toHaveLength(3);
    expect(document.querySelectorAll('.wg-ghost')).toHaveLength(3);

    // tapping a letter that does not come next is not a mistake, it is just spoken
    tapTile('Т');
    expect(document.querySelectorAll('.wg-slot.is-filled')).toHaveLength(0);
    expect(speakText).toHaveBeenCalledWith('Т', expect.objectContaining({ kind: 'token' }));

    tapTile('К');
    tapTile('О');
    tapTile('Т');
    expect(onWordComplete).toHaveBeenCalledWith(levels[0], { mistakes: 0 });

    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.getByRole('button', { name: /дальше/i })).toBeInTheDocument();
  });
});
