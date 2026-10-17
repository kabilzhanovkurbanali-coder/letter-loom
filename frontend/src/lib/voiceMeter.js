// A loudness meter for the microphone, used only to notice that a child is speaking or blowing.
// Privacy: nothing is recorded, stored or sent. Samples are read into a small buffer, reduced to one
// loudness number, and overwritten on the next read. The stream is never connected to a recorder,
// a network request or even the speakers, and the microphone is released as soon as listening ends.

export const isMicSupported = () => (
  typeof window !== 'undefined'
  && window.isSecureContext !== false
  && Boolean(navigator.mediaDevices?.getUserMedia)
  && Boolean(window.AudioContext || window.webkitAudioContext)
);

// Resolves to { level(), close() } or null when there is no microphone or permission was refused.
export const openVoiceMeter = async ({ blow = false } = {}) => {
  if (!isMicSupported()) return null;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // blowing is noise by definition, so noise suppression would hide it
        echoCancellation: !blow,
        noiseSuppression: !blow,
        autoGainControl: false
      },
      video: false
    });
  } catch {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextCtor();
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      // the meter still works once the context starts
    }
  }
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);
  let closed = false;

  return {
    level() {
      if (closed) return 0;
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const value = (buffer[i] - 128) / 128;
        sum += value * value;
      }
      return Math.sqrt(sum / buffer.length);
    },
    close() {
      if (closed) return;
      closed = true;
      stream.getTracks().forEach((track) => track.stop());
      source.disconnect();
      context.close().catch(() => {});
    }
  };
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

// Feed it one loudness reading per tick. It learns the room's noise for a moment, then reports
// a 0..1 level, each new burst of voice (roughly one per syllable) and when the child has finished.
export const createSpeechDetector = ({
  targetBursts = 1,
  calibrateMs = 300,
  minVoiceMs = 220,
  endSilenceMs = 900,
  waitMs = 7000,
  maxMs = 12000
} = {}) => {
  let elapsed = 0;
  let floorSum = 0;
  let floorCount = 0;
  let floor = 0;
  let threshold = 0.03;
  let voicedRun = 0;
  let silentRun = 0;
  let inBurst = false;
  let bursts = 0;
  let totalVoiced = 0;

  return {
    push(rms, dt) {
      elapsed += dt;
      if (elapsed <= calibrateMs) {
        floorSum += rms;
        floorCount += 1;
        floor = floorSum / floorCount;
        threshold = Math.min(0.2, Math.max(0.02, floor * 2.5 + 0.012));
        return { level: 0 };
      }
      const events = { level: clamp01((rms - floor) / (threshold * 4)) };
      if (rms > threshold) {
        voicedRun += dt;
        silentRun = 0;
        totalVoiced += dt;
        if (!inBurst && voicedRun >= 80) {
          inBurst = true;
          bursts += 1;
          events.burst = bursts;
        }
      } else {
        silentRun += dt;
        if (silentRun >= 130) {
          inBurst = false;
          voicedRun = 0;
        }
      }
      const spoke = totalVoiced >= minVoiceMs;
      if (spoke && (silentRun >= endSilenceMs || (bursts >= targetBursts && silentRun >= 450))) {
        events.done = { bursts };
      } else if (!spoke && !inBurst && elapsed >= waitMs) {
        events.silent = true;
      } else if (elapsed >= maxMs) {
        events.done = { bursts };
      }
      return events;
    }
  };
};

// Blowing is a long, loud rush of noise; every `needMs` of it puts out one candle.
export const createBlowDetector = ({ calibrateMs = 300, needMs = 400 } = {}) => {
  let elapsed = 0;
  let floorSum = 0;
  let floorCount = 0;
  let floor = 0;
  let threshold = 0.06;
  let blowMs = 0;

  return {
    push(rms, dt) {
      elapsed += dt;
      if (elapsed <= calibrateMs) {
        floorSum += rms;
        floorCount += 1;
        floor = floorSum / floorCount;
        threshold = Math.min(0.3, Math.max(0.05, floor * 3 + 0.03));
        return { level: 0 };
      }
      const events = { level: clamp01((rms - floor) / (threshold * 3)) };
      if (rms > threshold) {
        blowMs += dt;
        if (blowMs >= needMs) {
          blowMs -= needMs;
          events.out = true;
        }
      } else {
        // a short breath in between keeps most of the progress
        blowMs = Math.max(0, blowMs - dt * 0.5);
      }
      return events;
    }
  };
};
