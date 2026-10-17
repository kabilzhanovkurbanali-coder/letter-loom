import React, { useMemo } from 'react';

const buildCharSignature = (text) => {
  const chars = Array.from(String(text || ''));
  const baseSeed = chars.reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 5), chars.length * 23);

  return chars.map((char, index) => {
    const seed = baseSeed + char.charCodeAt(0) * (index + 9);
    return {
      char,
      rotate: ((seed % 17) - 8) * 1.15,
      skewX: (((seed >> 1) % 11) - 5) * 1.2,
      scaleX: 0.88 + (((seed >> 2) % 18) / 100),
      scaleY: 0.87 + (((seed >> 3) % 20) / 100),
      shiftX: (((seed >> 4) % 7) - 3) * 0.75,
      shiftY: (((seed >> 5) % 9) - 4) * 1.45
    };
  });
};

export function PlayfulGlyphText({ text, className = '', style }) {
  const chars = useMemo(() => buildCharSignature(text), [text]);
  const wrapperTransform = useMemo(() => {
    const charsArray = Array.from(String(text || ''));
    const seed = charsArray.reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), charsArray.length * 31);
    const rotate = ((seed % 9) - 4) * 0.8;
    const skewY = (((seed >> 2) % 7) - 3) * 0.7;
    const scaleX = 0.98 + (((seed >> 3) % 6) / 100);
    return `rotate(${rotate}deg) skewY(${skewY}deg) scaleX(${scaleX})`;
  }, [text]);

  return (
    <span className={`playful-glyph-text ${className}`.trim()} style={{ ...style, transform: wrapperTransform }}>
      {chars.map(({ char, rotate, skewX, scaleX, scaleY, shiftX, shiftY }, index) => (
        <span
          key={`${char}-${index}`}
          className="playful-glyph-char"
          style={{
            transform: `translate(${shiftX}px, ${shiftY}px) rotate(${rotate}deg) skewX(${skewX}deg) scale(${scaleX}, ${scaleY})`
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export function PlayfulGlyphDefs() {
  return (
    <svg className="playful-glyph-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id="playful-glyph-wobble" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="2" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
