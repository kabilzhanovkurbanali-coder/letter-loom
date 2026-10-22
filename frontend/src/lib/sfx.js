// Tiny synthesized sound effects (no audio files, works offline).
// There is deliberately no "error" buzzer: a misplaced letter gets a soft, friendly "boop".
let sfxContext = null;

const getContext = async () => {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sfxContext) sfxContext = new AudioContextCtor();
  if (sfxContext.state === 'suspended') {
    try {
      await sfxContext.resume();
    } catch {
      return null;
    }
  }
  return sfxContext;
};

const playNotes = async (notes) => {
  const context = await getContext();
  if (!context) return;
  const now = context.currentTime;
  notes.forEach((note) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = note.type || 'sine';
    oscillator.frequency.setValueAtTime(note.start, now + note.time);
    oscillator.frequency.exponentialRampToValueAtTime(note.end || note.start, now + note.time + note.duration);
    gain.gain.setValueAtTime(0.0001, now + note.time);
    gain.gain.linearRampToValueAtTime(note.peak || 0.02, now + note.time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + note.time);
    oscillator.stop(now + note.time + note.duration + 0.03);
  });
};

const seedOf = (token) => String(token || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

export const sfxPick = (token) => {
  const base = 360 + (seedOf(token) % 6) * 30;
  return playNotes([
    { type: 'triangle', start: base, end: base * 1.25, time: 0, duration: 0.07, peak: 0.018 }
  ]);
};

export const sfxPlace = (token, isLast = false) => {
  const base = 420 + (seedOf(token) % 7) * 22;
  const notes = [
    { type: 'triangle', start: base, end: base * 1.18, time: 0, duration: 0.08, peak: 0.025 },
    { type: 'sine', start: base * 1.24, end: base * 1.42, time: 0.06, duration: 0.1, peak: 0.02 },
    { type: 'triangle', start: base * 1.5, end: base * 1.78, time: 0.14, duration: 0.12, peak: 0.018 }
  ];
  if (isLast) {
    notes.push(
      { type: 'sine', start: base * 1.96, end: base * 2.22, time: 0.24, duration: 0.16, peak: 0.022 },
      { type: 'triangle', start: base * 2.34, end: base * 2.62, time: 0.34, duration: 0.2, peak: 0.018 }
    );
  }
  return playNotes(notes);
};

export const sfxBoop = () => playNotes([
  { type: 'sine', start: 330, end: 262, time: 0, duration: 0.14, peak: 0.02 },
  { type: 'sine', start: 294, end: 330, time: 0.13, duration: 0.12, peak: 0.016 }
]);

export const sfxWhoosh = () => playNotes([
  { type: 'sine', start: 300, end: 900, time: 0, duration: 0.28, peak: 0.012 },
  { type: 'triangle', start: 600, end: 1400, time: 0.05, duration: 0.25, peak: 0.008 }
]);

export const sfxTada = () => playNotes([
  { type: 'triangle', start: 523, time: 0, duration: 0.14, peak: 0.024 },
  { type: 'triangle', start: 659, time: 0.12, duration: 0.14, peak: 0.024 },
  { type: 'triangle', start: 784, time: 0.24, duration: 0.16, peak: 0.024 },
  { type: 'sine', start: 1046, time: 0.38, duration: 0.42, peak: 0.022 },
  { type: 'sine', start: 1318, time: 0.42, duration: 0.38, peak: 0.012 }
]);

// One clear note of a pentatonic scale, so any run of steps sounds like a little tune.
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
export const sfxNote = (step) => {
  const frequency = PENTATONIC[((step % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length];
  return playNotes([
    { type: 'sine', start: frequency, time: 0, duration: 0.26, peak: 0.03 },
    { type: 'triangle', start: frequency * 2, time: 0, duration: 0.08, peak: 0.008 }
  ]);
};

// A soft hand clap: a short burst of filtered noise.
export const sfxClap = async () => {
  const context = await getContext();
  if (!context) return;
  const length = Math.floor(context.sampleRate * 0.12);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.8;
  const gain = context.createGain();
  gain.gain.value = 0.35;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
};

// A pony's tongue click: one short, bright "tsok".
export const sfxClick = () => playNotes([
  { type: 'triangle', start: 1900, end: 650, time: 0, duration: 0.05, peak: 0.05 },
  { type: 'sine', start: 900, end: 500, time: 0.01, duration: 0.06, peak: 0.02 }
]);
