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

    // beginner level: only the word's own letters, and a letter-shaped shadow for each of them
    expect(document.querySelectorAll('.wg-tile')).toHaveLength(3);
    expect(Array.from(document.querySelectorAll('.wg-slot .lv.is-shadow')).map((node) => node.dataset.unit)).toEqual(['К', 'О', 'Т']);

    act(() => { jest.advanceTimersByTime(400); });
    expect(speakText).toHaveBeenCalledWith('Собери слово: кот', expect.anything());

    // tapping a letter that does not come next is not a mistake: the letter says its sound
    tapTile('Т');
    expect(document.querySelectorAll('.wg-slot.is-filled')).toHaveLength(0);
    expect(speakText).toHaveBeenCalledWith('ты', expect.objectContaining({ kind: 'sound' }));

    // a letter speaks when it is picked up, not again when it lands
    speakText.mockClear();
    tapTile('К');
    expect(speakText.mock.calls.map(([text]) => text)).toEqual(['кы']);
    tapTile('О');
    tapTile('Т');
    expect(onWordComplete).toHaveBeenCalledWith(levels[0], { mistakes: 0 });

    // the built word is sounded out letter by letter, then read
    speakText.mockClear();
    act(() => { jest.advanceTimersByTime(6000); });
    expect(speakText.mock.calls.map(([text]) => text).slice(0, 4)).toEqual(['кы', 'о', 'ты', 'кот']);
    expect(screen.getByRole('button', { name: /дальше/i })).toBeInTheDocument();
  });

  test('with letter names chosen, letters say their names and the word is read at once', () => {
    window.localStorage.setItem('ll_letter_mode', 'name');
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
        onWordComplete={jest.fn()}
        onExit={jest.fn()}
      />
    );
    tapTile('Т');
    expect(speakText).toHaveBeenCalledWith('Т', expect.objectContaining({ kind: 'token' }));
    tapTile('К');
    tapTile('О');
    tapTile('Т');
    speakText.mockClear();
    act(() => { jest.advanceTimersByTime(4000); });
    expect(speakText.mock.calls[0][0]).toBe('кот');
    expect(screen.getByRole('button', { name: /дальше/i })).toBeInTheDocument();
  });
});
