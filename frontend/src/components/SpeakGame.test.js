import { render, fireEvent, act } from '@testing-library/react';
import { SpeakGame, buildSpeakTask, speechForUnits } from './SpeakGame';
import { createBlowDetector, createSpeechDetector, isMicSupported, openVoiceMeter } from '../lib/voiceMeter';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../lib/sfx', () => ({
  sfxNote: jest.fn(), sfxPlace: jest.fn(), sfxTada: jest.fn(), sfxWhoosh: jest.fn()
}));
jest.mock('../lib/voiceMeter', () => {
  const actual = jest.requireActual('../lib/voiceMeter');
  return { ...actual, isMicSupported: jest.fn(() => true), openVoiceMeter: jest.fn() };
});

// a fake microphone that plays back a script of loudness readings, one per 50 ms tick
const scriptedMeter = (script) => {
  let tick = 0;
  return {
    level: () => {
      const value = script(tick * 50);
      tick += 1;
      return value;
    },
    close: jest.fn()
  };
};

const renderGame = (activity, speakText = jest.fn()) => render(
  <SpeakGame lang="RU" activity={activity} userKey="kid" speakText={speakText} prefetchSpeech={jest.fn()} onSessionComplete={jest.fn()} onExit={jest.fn()} />
);

const flush = async (ms) => {
  await act(async () => { jest.advanceTimersByTime(ms); });
};

describe('voice detectors', () => {
  const feed = (detector, script, ms) => {
    const events = [];
    for (let time = 0; time < ms; time += 50) events.push(detector.push(script(time), 50));
    return events;
  };

  test('counts bursts of voice and notices when the child has finished', () => {
    const detector = createSpeechDetector({ targetBursts: 3 });
    // quiet room, then three syllables "ма-ши-на" of 200 ms each with short gaps
    const voiced = (time) => [500, 900, 1300].some((start) => time >= start && time < start + 200);
    const events = feed(detector, (time) => (voiced(time) ? 0.2 : 0.01), 3000);
    expect(events.filter((event) => event.burst).map((event) => event.burst)).toEqual([1, 2, 3]);
    expect(events.some((event) => event.done)).toBe(true);
    expect(events.some((event) => event.silent)).toBe(false);
  });

  test('reports silence, not failure, when nobody speaks', () => {
    const events = feed(createSpeechDetector(), () => 0.01, 7500);
    expect(events.some((event) => event.silent)).toBe(true);
    expect(events.some((event) => event.burst || event.done)).toBe(false);
  });

  test('a long loud breath blows out candles', () => {
    const detector = createBlowDetector({ needMs: 400 });
    const events = feed(detector, (time) => (time > 400 ? 0.4 : 0.01), 1700);
    expect(events.filter((event) => event.out)).toHaveLength(3);
  });
});

describe('SpeakGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
    isMicSupported.mockReturnValue(true);
    openVoiceMeter.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('builds tasks for each activity', () => {
    expect(speechForUnits(['ГАВ', 'ГАВ'])).toBe('гав, гав');
    expect(speechForUnits(['МУ-У'])).toBe('муу');
    expect(buildSpeakTask('ECHO', 1, 'RU').units).toHaveLength(1);
    const word = buildSpeakTask('SYLLABLES', 1, 'UZ');
    expect(word.units).toHaveLength(2);
    expect(word.image).toBeTruthy();
    expect(buildSpeakTask('SYLLABLES', 3, 'KG').units.length).toBeGreaterThanOrEqual(3);
    expect(buildSpeakTask('BLOW', 2, 'EN').candles).toBe(3);
  });

  test('speaking into the microphone lights the syllables and earns a star', async () => {
    const meter = scriptedMeter((time) => ([500, 900, 1300, 1700].some((start) => time >= start && time < start + 200) ? 0.2 : 0.01));
    openVoiceMeter.mockResolvedValue(meter);
    renderGame('SYLLABLES');
    await flush(8000);
    const mic = document.querySelector('.sp-mic');
    expect(mic.disabled).toBe(false);
    await act(async () => { fireEvent.click(mic); });
    await flush(4000);
    const units = document.querySelectorAll('.sp-unit');
    expect(document.querySelectorAll('.sp-unit.is-lit')).toHaveLength(units.length);
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
    expect(meter.close).toHaveBeenCalled();
  });

  test('two quiet tries end with Irbi saying it together, never a dead end', async () => {
    openVoiceMeter.mockImplementation(async () => scriptedMeter(() => 0.01));
    const speakText = jest.fn();
    renderGame('ECHO', speakText);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await flush(6000);
      await act(async () => { fireEvent.click(document.querySelector('.sp-mic')); });
      await flush(7500);
    }
    await flush(2500);
    expect(speakText).toHaveBeenCalledWith(expect.stringContaining('Скажем вместе'), expect.anything());
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });

  test('without a microphone the child taps instead', async () => {
    openVoiceMeter.mockResolvedValue(null);
    renderGame('BLOW');
    await flush(3000);
    await act(async () => { fireEvent.click(document.querySelector('.sp-mic')); });
    expect(document.querySelector('.sp-mic')).toBeNull();
    document.querySelectorAll('.sp-candle').forEach((candle) => fireEvent.click(candle));
    await flush(600);
    expect(document.querySelectorAll('.sp-candle.is-out')).toHaveLength(2);
    expect(document.querySelectorAll('.gs-star.is-on')).toHaveLength(1);
  });
});
