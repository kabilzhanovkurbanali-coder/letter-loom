import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PlayfulGlyphText } from './PlayfulGlyphText';

const speechCodeByLang = {
  EN: 'en-US',
  RU: 'ru-RU',
  KG: 'ky-KG',
  UZ: 'uz-UZ'
};

const vowelSetsByLang = {
  EN: new Set(['A', 'E', 'I', 'O', 'U', 'Y']),
  RU: new Set(['А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']),
  KG: new Set(['А', 'Е', 'Ё', 'И', 'О', 'Ө', 'У', 'Ү', 'Ы', 'Э']),
  UZ: new Set(['A', 'E', 'I', 'O', 'U'])
};

const getMonsterColor = (char) => {
  const colors = [
    { bg: 'linear-gradient(135deg, #ff4757, #ff6b81)', shadow: '#cc0000', leg: '#ff4757', glow: 'rgba(255, 107, 129, 0.35)' },
    { bg: 'linear-gradient(135deg, #1e90ff, #70a1ff)', shadow: '#0050b3', leg: '#1e90ff', glow: 'rgba(112, 161, 255, 0.34)' },
    { bg: 'linear-gradient(135deg, #2ed573, #7bed9f)', shadow: '#1b9b4c', leg: '#2ed573', glow: 'rgba(123, 237, 159, 0.34)' },
    { bg: 'linear-gradient(135deg, #ffa502, #eccc68)', shadow: '#cc8400', leg: '#ffa502', glow: 'rgba(236, 204, 104, 0.34)' },
    { bg: 'linear-gradient(135deg, #9b59b6, #cd84f1)', shadow: '#6b3fa0', leg: '#9b59b6', glow: 'rgba(205, 132, 241, 0.34)' },
    { bg: 'linear-gradient(135deg, #ff1493, #ff69b4)', shadow: '#c2006b', leg: '#ff1493', glow: 'rgba(255, 105, 180, 0.34)' },
    { bg: 'linear-gradient(135deg, #00ced1, #48d1cc)', shadow: '#008b8b', leg: '#00ced1', glow: 'rgba(72, 209, 204, 0.34)' },
  ];
  const charCode = char.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const getLetterSoundProfile = (token, lang, playMode) => {
  const normalizedToken = String(token || '').trim().toUpperCase();
  const baseProfile = {
    type: 'consonant',
    pitchOffset: 0,
    voicePitch: 1.12,
    voiceRate: normalizedToken.length > 1 ? 0.74 : 0.86
  };

  if (!normalizedToken) return baseProfile;
  if (playMode === 'SYLLABLES' || normalizedToken.length > 1) {
    return {
      type: 'syllable',
      pitchOffset: 48,
      voicePitch: 1.18,
      voiceRate: 0.78
    };
  }

  const vowelSet = vowelSetsByLang[lang] || vowelSetsByLang.EN;
  if (vowelSet.has(normalizedToken)) {
    return {
      type: 'vowel',
      pitchOffset: 84,
      voicePitch: 1.22,
      voiceRate: 0.9
    };
  }

  return baseProfile;
};

let creatureTouchAudioContext = null;

const getCreatureTouchAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!creatureTouchAudioContext) {
    creatureTouchAudioContext = new AudioContextCtor();
  }
  return creatureTouchAudioContext;
};

const buildCreatureTouchPattern = (baseFreq, soundType) => {
  if (soundType === 'vowel') {
    return [
      { freqStart: baseFreq * 1.08, freqEnd: baseFreq * 1.24, time: 0, duration: 0.06, type: 'triangle', peak: 0.02 },
      { freqStart: baseFreq * 1.34, freqEnd: baseFreq * 1.56, time: 0.05, duration: 0.08, type: 'sine', peak: 0.018 },
      { freqStart: baseFreq * 1.72, freqEnd: baseFreq * 1.96, time: 0.12, duration: 0.11, type: 'sine', peak: 0.014 }
    ];
  }

  if (soundType === 'syllable') {
    return [
      { freqStart: baseFreq * 0.94, freqEnd: baseFreq * 1.08, time: 0, duration: 0.06, type: 'triangle', peak: 0.018 },
      { freqStart: baseFreq * 1.16, freqEnd: baseFreq * 1.22, time: 0.055, duration: 0.065, type: 'square', peak: 0.012 },
      { freqStart: baseFreq * 1.34, freqEnd: baseFreq * 1.48, time: 0.11, duration: 0.08, type: 'triangle', peak: 0.02 },
      { freqStart: baseFreq * 1.62, freqEnd: baseFreq * 1.92, time: 0.17, duration: 0.12, type: 'sine', peak: 0.016 }
    ];
  }

  return [
    { freqStart: baseFreq * 0.96, freqEnd: baseFreq * 1.02, time: 0, duration: 0.045, type: 'square', peak: 0.012 },
    { freqStart: baseFreq * 1.12, freqEnd: baseFreq * 1.2, time: 0.035, duration: 0.05, type: 'triangle', peak: 0.018 },
    { freqStart: baseFreq * 1.34, freqEnd: baseFreq * 1.46, time: 0.085, duration: 0.085, type: 'triangle', peak: 0.014 }
  ];
};

const playCreatureTouchTone = async (letter, soundProfile) => {
  const context = getCreatureTouchAudioContext();
  if (!context) return;
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const seed = String(letter || '')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const profile = soundProfile || getLetterSoundProfile(letter, 'RU', 'WORDS');
  const baseFreq = 280 + (seed % 9) * 16 + profile.pitchOffset;
  const chirpNotes = buildCreatureTouchPattern(baseFreq, profile.type);
  const now = context.currentTime;

  chirpNotes.forEach((note) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.freqStart, now + note.time);
    oscillator.frequency.linearRampToValueAtTime(note.freqEnd, now + note.time + note.duration);
    gain.gain.setValueAtTime(0.0001, now + note.time);
    gain.gain.linearRampToValueAtTime(note.peak, now + note.time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + note.time);
    oscillator.stop(now + note.time + note.duration + 0.03);
  });
};

export function DraggableLetter({ id, letter, isFound, index, lang, playMode, letterStyle = 'CARTOON', speakText, prefetchSpeech, scatterStyle }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isExpressive, setIsExpressive] = useState(false);
  const expressiveTimeoutRef = useRef(null);
  const lastTouchToneRef = useRef(0);
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 768;

  const theme = getMonsterColor(letter.toUpperCase());
  const tokenWidth = Math.max(isCompact ? 82 : 102, letter.length * (isCompact ? 24 : 31));
  const soundProfile = useMemo(() => getLetterSoundProfile(letter, lang, playMode), [lang, letter, playMode]);
  const glyphFontSize = letter.length > 2
    ? (isCompact ? '2.55rem' : '3.4rem')
    : letter.length > 1
      ? (isCompact ? '3.45rem' : '4.6rem')
      : (isCompact ? '5.05rem' : '6.45rem');

  const randomPos = useMemo(() => ({
    marginTop: `${Math.random() * 40 - 20}px`,
    marginLeft: `${Math.random() * 40 - 20}px`,
    rotate: `${Math.random() * 20 - 10}deg`
  }), []);

  useEffect(() => {
    if (isFound || typeof prefetchSpeech !== 'function') return undefined;
    const timer = window.setTimeout(() => {
      prefetchSpeech(letter, {
        kind: 'token',
        languageCode: speechCodeByLang[lang] || 'ru-RU',
        pitch: soundProfile.voicePitch,
        rate: soundProfile.voiceRate
      });
    }, 80 + Math.min(index, 6) * 45);

    return () => window.clearTimeout(timer);
  }, [index, isFound, lang, letter, playMode, prefetchSpeech, soundProfile.voicePitch, soundProfile.voiceRate]);

  useEffect(() => () => {
    if (expressiveTimeoutRef.current) {
      window.clearTimeout(expressiveTimeoutRef.current);
    }
  }, []);

  const playSound = () => {
    if (!isFound) {
      const now = Date.now();
      if (now - lastTouchToneRef.current < 180) return;
      lastTouchToneRef.current = now;
      void playCreatureTouchTone(letter, soundProfile);
      setIsExpressive(true);
      if (expressiveTimeoutRef.current) {
        window.clearTimeout(expressiveTimeoutRef.current);
      }
      expressiveTimeoutRef.current = window.setTimeout(() => setIsExpressive(false), 650);
      const languageCode = speechCodeByLang[lang] || 'ru-RU';
      speakText(letter, {
        kind: 'token',
        languageCode,
        pitch: soundProfile.voicePitch,
        rate: soundProfile.voiceRate,
        interrupt: true
      });
    }
  };

  const renderCreatureFace = () => (
    <>
      <div className="eyes"><div className="eye"></div><div className="eye"></div></div>
    </>
  );

  const dragStyle = {
    width: `${tokenWidth}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : 1,
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    opacity: isFound ? 0 : 1,
    pointerEvents: isFound ? 'none' : 'auto'
  };

  if (isFound) return null;

  return (
    <div
      style={{
        ...(scatterStyle || randomPos),
        animationDelay: `${index * 0.1}s`,
        '--alive-delay': `${index * 0.27}s`,
        '--monster-accent': theme.leg,
        '--monster-fill-color': theme.leg,
        '--monster-shadow-color': theme.shadow,
        '--monster-glow': theme.glow,
        '--monster-pupil-shift-x': soundProfile.type === 'vowel' ? '-1px' : soundProfile.type === 'syllable' ? '1px' : '0px',
        '--monster-pupil-shift-y': soundProfile.type === 'syllable' ? '-1px' : '0px'
      }}
      className={`letter-pop monster-letter-stage ${isExpressive ? 'is-speaking' : ''} ${isDragging ? 'is-dragging' : ''} sound-${soundProfile.type}`}
    >
      <div className="monster-letter-shadow" />
      <div className={`monster-letter-bob ${isExpressive ? 'is-speaking' : ''} ${isDragging ? 'is-dragging' : ''}`}>
        <div className="monster-letter-arm monster-letter-arm-left" />
        <div className="monster-letter-arm monster-letter-arm-right" />
        <div
          ref={setNodeRef}
          style={dragStyle}
          {...listeners}
          {...attributes}
          className={`monster-letter-container ${isDragging ? 'dragging' : 'idle-wiggle'} ${isExpressive ? 'is-speaking' : ''} ${letterStyle === 'CALM' ? 'style-calm' : 'style-cartoon'}`}
          onMouseDown={playSound}
          onTouchStart={playSound}
        >
          <div className={`monster-letter-glyph-shell ${letter.length > 1 ? 'is-token' : 'is-single'}`}>
            <div className="glyph-stick-arm glyph-stick-arm-left" />
            <div className="glyph-stick-arm glyph-stick-arm-right" />
            <PlayfulGlyphText
              text={letter}
              className={`monster-letter-glyph ${letter.length > 1 ? 'is-token' : 'is-single'}`}
              style={{
                fontSize: glyphFontSize,
                textShadow: 'none'
              }}
            />
            {renderCreatureFace()}
          </div>
        </div>
      </div>
    </div>
  );
}
