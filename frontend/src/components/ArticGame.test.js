import { render, fireEvent, act } from '@testing-library/react';
import { ArticGame, EXERCISES, buildArticSession, voicePhrases } from './ArticGame';
import { readActivityLevel, readStats, setLevelLocked } from '../lib/progress';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({ sfxClick: jest.fn(), sfxNote: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn() }));

const renderGame = (speakText = jest.fn()) => render(
  <ArticGame lang="RU" userKey="kid" speakText={speakText} prefetchSpeech={jest.fn()} onSessionComplete={jest.fn()} onExit={jest.fn()} />
);

// one exercise: show (≤ 6 s), "together" + five counts (~7 s), then praise
const playOneExercise = () => act(() => { jest.advanceTimersByTime(16000); });

describe('ArticGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  test('sessions grow from lips to tongue', () => {
    const first = buildArticSession(1);
    expect(first).toHaveLength(4);
    first.forEach((item) => expect(item.level).toBe(1));
    const third = buildArticSession(3);
    expect(third[0].level).toBeLessThan(3);
    third.slice(1).forEach((item) => expect(item.level).toBe(3));
    expect(new Set(EXERCISES.map((item) => item.id)).size).toBe(EXERCISES.length);
  });

  test('Irbi names the exercise, counts with the child and gives a star', () => {
    const speakText = jest.fn();
    renderGame(speakText);
    act(() => { jest.advanceTimersByTime(1700); });
    const id = document.querySelector('.ag-board').dataset.exercise;
    expect(speakText).toHaveBeenCalledWith(expect.stringMatching(/^[А-ЯЁ][а-яё ]+! /), expect.anything());
    playOneExercise();
    ['раз', 'два', 'три', 'четыре', 'пять'].forEach((word) => expect(speakText).toHaveBeenCalledWith(word, expect.anything()));
    expect(document.querySelector('.ag-board').dataset.phase).toBe('done');
    expect(document.querySelectorAll('.ag-count .is-on')).toHaveLength(5);
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
    expect(readStats('kid').activities['artic:GYM']).toMatchObject({ tasks: 1, clean: 1 });
    expect(id).toBeTruthy();
  });

  test('a full session moves up a level after two sessions, unless the teacher locked it', () => {
    const playSession = () => {
      const { unmount } = renderGame();
      act(() => { jest.advanceTimersByTime(1700); });
      for (let i = 0; i < 4; i += 1) {
        playOneExercise();
        fireEvent.click(document.querySelector('.gs-next'));
        act(() => { jest.advanceTimersByTime(400); });
      }
      expect(document.querySelector('.gs-session')).not.toBeNull();
      unmount();
    };
    playSession();
    playSession();
    expect(readActivityLevel('kid', 'artic:GYM')).toBe(2);
    setLevelLocked('kid', true);
    playSession();
    playSession();
    expect(readActivityLevel('kid', 'artic:GYM')).toBe(2);
  });

  test('every exercise is in the offline voice pack', () => {
    const texts = voicePhrases('UZ').map((phrase) => phrase.text);
    expect(texts).toContain('Qurbaqa! Keng-keng jilmay, tishlaring ko‘rinsin');
    expect(texts).toContain('besh');
  });
});
