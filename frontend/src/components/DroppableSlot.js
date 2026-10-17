import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PlayfulGlyphText } from './PlayfulGlyphText';

const getMonsterColor = (char) => {
  const colors = [
    { bg: 'linear-gradient(135deg, #ff4757, #ff6b81)', shadow: '#cc0000', leg: '#ff4757' },
    { bg: 'linear-gradient(135deg, #1e90ff, #70a1ff)', shadow: '#0050b3', leg: '#1e90ff' },
    { bg: 'linear-gradient(135deg, #2ed573, #7bed9f)', shadow: '#1b9b4c', leg: '#2ed573' },
    { bg: 'linear-gradient(135deg, #ffa502, #eccc68)', shadow: '#cc8400', leg: '#ffa502' },
    { bg: 'linear-gradient(135deg, #9b59b6, #cd84f1)', shadow: '#6b3fa0', leg: '#9b59b6' },
    { bg: 'linear-gradient(135deg, #ff1493, #ff69b4)', shadow: '#c2006b', leg: '#ff1493' },
    { bg: 'linear-gradient(135deg, #00ced1, #48d1cc)', shadow: '#008b8b', leg: '#00ced1' },
  ];
  const charCode = char.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export function DroppableSlot({ id, expectedLetter, isFound, unitCount = 0 }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isDenseLayout = unitCount >= (isCompact ? 5 : 6);

  const theme = getMonsterColor(expectedLetter.toUpperCase());
  const slotWidth = Math.max(
    isCompact ? (isDenseLayout ? 64 : 78) : (isDenseLayout ? 82 : 98),
    expectedLetter.length * (isCompact ? (isDenseLayout ? 18 : 22) : (isDenseLayout ? 22 : 28))
  );
  const slotHeight = isDenseLayout ? (isCompact ? 76 : 92) : (isCompact ? 88 : 108);
  const placeholderFontSize = expectedLetter.length > 2
    ? (isCompact ? (isDenseLayout ? '1.95rem' : '2.25rem') : (isDenseLayout ? '2.8rem' : '3.05rem'))
    : expectedLetter.length > 1
      ? (isCompact ? (isDenseLayout ? '2.75rem' : '3.2rem') : (isDenseLayout ? '4rem' : '4.35rem'))
      : (isCompact ? (isDenseLayout ? '3.9rem' : '4.55rem') : (isDenseLayout ? '5.4rem' : '5.95rem'));
  const placeholderColor = 'rgba(126, 188, 226, 0.58)';

  const slotStyle = {
    width: `${slotWidth}px`,
    height: `${slotHeight}px`,
    '--outline-slot-width': `${slotWidth}px`,
    '--outline-slot-height': `${slotHeight}px`,
    '--monster-accent': theme.leg,
    '--monster-fill-color': theme.leg,
    '--monster-shadow-color': theme.shadow
  };

  return (
    <div
      ref={setNodeRef}
      style={slotStyle}
      className={`word-outline-slot ${isFound ? 'slot-success' : ''} ${isOver ? 'is-over' : ''}`.trim()}
    >
      {isFound ? (
        <div className={`monster-letter-glyph-shell in-slot ${expectedLetter.length > 1 ? 'is-token' : 'is-single'}`}>
          <div className="glyph-stick-arm glyph-stick-arm-left" />
          <div className="glyph-stick-arm glyph-stick-arm-right" />
          <PlayfulGlyphText
            text={expectedLetter}
            className={`monster-letter-glyph ${expectedLetter.length > 1 ? 'is-token' : 'is-single'}`}
            style={{
              fontSize: placeholderFontSize,
              textShadow: 'none'
            }}
          />
          <div className="eyes"><div className="eye"></div><div className="eye"></div></div>
        </div>
      ) : (
        <>
          <PlayfulGlyphText
            text={expectedLetter}
            className="word-outline-text"
            style={{
              fontSize: placeholderFontSize,
              color: placeholderColor
            }}
          />
          <div className="word-outline-foot" />
        </>
      )}
    </div>
  );
}
