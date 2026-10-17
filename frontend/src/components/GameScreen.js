import React, { useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';

import { DraggableLetter } from './DraggableLetter';
import { DroppableSlot } from './DroppableSlot';
import { PlayfulGlyphDefs } from './PlayfulGlyphText';
import { uiText } from '../data/uiText';

export function GameScreen({
  currentIdx, setCurrentIdx, words, word, foundLetters,
  usedDragIndices, letterStyle, levelUnits, displayText, playMode, speakText, prefetchSpeech, shuffledLetters, handleDragEnd, isWin, currentTheme, lang, setGameState, sensors
}) {
  const text = uiText[lang] || uiText.RU;
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isLastLevel = currentIdx >= words.length - 1;
  const visiblePromptText = isWin ? displayText : playMode === 'SYLLABLES' ? displayText.replace(/[A-ZА-ЯЁӨҮҢ]/gi, '•') : '';
  const difficultyMap = {
    EASY: text.difficultyEasy,
    MEDIUM: text.difficultyMedium,
    HARD: text.difficultyHard
  };
  const typeMap = {
    OPEN_OPEN: text.typeOpenOpen,
    OPEN_CLOSED: text.typeOpenClosed,
    CLOSED_OPEN: text.typeClosedOpen,
    CLOSED_CLOSED: text.typeClosedClosed,
    OPEN_OPEN_OPEN: text.typeOpenOpenOpen,
    CLOSED_OPEN_OPEN: text.typeClosedOpenOpen,
    OPEN_OPEN_CLOSED: text.typeOpenOpenClosed,
    CONSONANT_CLUSTER: text.typeConsonantCluster,
    OPEN_FINAL_E: text.typeOpenFinalE,
    COMPLEX: text.typeComplex,
    CLOSED_MIXED: text.typeClosedMixed,
    R_CONTROLLED: text.typeRControlled,
    OPEN_R_CONTROLLED: text.typeOpenRControlled,
    MIXED: text.typeMixed,
    MIXED_CLUSTER: text.typeMixedCluster
  };
  const rarityLabel = word?.seasonalExclusive ? 'SEASONAL' : word?.rarity;
  const isDenseWord = levelUnits.length >= (isCompact ? 5 : 6);
  const bankRows = shuffledLetters.length <= 4 ? 1 : shuffledLetters.length <= 8 ? 2 : 3;
  const letterBankHeight = bankRows === 1 ? (isCompact ? 156 : 204) : bankRows === 2 ? (isCompact ? 236 : 294) : (isCompact ? 316 : 378);
  const scatteredLetters = useMemo(() => {
    const count = shuffledLetters.length;
    if (!count) return {};

    const rows = count <= 4 ? 1 : count <= 8 ? 2 : 3;
    const columns = Math.ceil(count / rows);
    const rowAnchors = rows === 1 ? [50] : rows === 2 ? [30, 74] : [20, 50, 80];
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    return Object.fromEntries(
      shuffledLetters.map((item, visualIndex) => {
        const row = visualIndex % rows;
        const column = Math.floor(visualIndex / rows);
        const tokenWidth = Math.max(isCompact ? 82 : 102, String(item.char || '').length * (isCompact ? 24 : 31));
        const tokenHeight = isCompact ? 84 : 102;
        const seed = String(item.char || '')
          .split('')
          .reduce((sum, char) => sum + char.charCodeAt(0), item.index * 29 + visualIndex * 17);
        const minLeft = isCompact ? 12 : 14;
        const maxLeft = isCompact ? 88 : 86;
        const baseLeft = columns === 1
          ? 50
          : minLeft + ((maxLeft - minLeft) * column) / Math.max(columns - 1, 1);
        const leftJitter = ((seed % 9) - 4) * (isCompact ? 0.8 : 1.2);
        const topJitter = (((seed >> 3) % 5) - 2) * (isCompact ? 0.7 : 1.1);
        const leftPercent = clamp(baseLeft + leftJitter, minLeft, maxLeft);
        const topPercent = clamp(rowAnchors[row] + topJitter, rowAnchors[row] - 7, rowAnchors[row] + 7);

        return [item.index, {
          position: 'absolute',
          left: `calc(${leftPercent}% - ${tokenWidth / 2}px)`,
          top: `calc(${topPercent}% - ${tokenHeight / 2}px)`,
          rotate: `${((seed % 7) - 3)}deg`
        }];
      })
    );
  }, [isCompact, shuffledLetters]);

  return (
    <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center', marginTop: isCompact ? '10px' : '20px', padding: isCompact ? '0 10px 24px' : 0, boxSizing: 'border-box' }}>
      <PlayfulGlyphDefs />
      <button onClick={() => setGameState('MENU')} style={{ background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', padding: isCompact ? '10px 18px' : '12px 24px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: isCompact ? '1rem' : '1.1rem' }}>
        {text.home}
      </button>
      <h2 style={{ fontSize: isCompact ? '2rem' : '2.5rem', color: '#ffcc00', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: '15px 0' }}>{text.level} {currentIdx + 1}</h2>
      <div style={{ color: 'white', fontSize: isCompact ? '1rem' : '1.2rem', fontWeight: 'bold', marginBottom: '14px' }}>
        {playMode === 'SYLLABLES' ? text.buildPromptSyllables : text.buildPromptWords}
      </div>
      {(playMode === 'SYLLABLES' && word?.difficulty) || rarityLabel ? (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ background: 'rgba(255,255,255,0.18)', color: 'white', padding: '8px 14px', borderRadius: '999px', fontWeight: 'bold' }}>
            {text.difficultyLabel}: {difficultyMap[word?.difficulty] || word?.difficulty || 'Classic'}
          </span>
          {playMode === 'SYLLABLES' && word?.syllableType ? (
            <span style={{ background: 'rgba(255,255,255,0.18)', color: 'white', padding: '8px 14px', borderRadius: '999px', fontWeight: 'bold' }}>
              {text.syllableTypeLabel}: {typeMap[word.syllableType] || word.syllableType}
            </span>
          ) : null}
          {rarityLabel ? (
            <span style={{ background: `${word?.rarityColor || '#ffd166'}22`, color: word?.rarityColor || '#ffd166', padding: '8px 14px', borderRadius: '999px', fontWeight: 'bold', border: `1px solid ${(word?.rarityColor || '#ffd166')}55` }}>
              {word?.seasonalExclusive ? 'Seasonal Exclusive' : rarityLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div style={{ background: currentTheme.cardBg, borderRadius: isCompact ? '28px' : '40px', padding: isCompact ? '22px 14px 28px' : '40px', margin: isCompact ? '14px 0' : '20px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <img src={word.img} alt="task" className={isWin ? 'img-win-magic' : ''} style={{ height: isCompact ? '150px' : '220px', maxWidth: '100%', marginBottom: isCompact ? '18px' : '30px', filter: isWin ? 'none' : 'brightness(0) invert(1) opacity(0.48)', transition: '0.5s', transform: isWin ? 'scale(1.1)' : 'scale(1)' }} />
        <div style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 'bold', fontSize: isCompact ? '1.05rem' : '1.3rem', letterSpacing: '0.08em', marginBottom: '24px', minHeight: isCompact ? '1.4rem' : '1.6rem' }}>{visiblePromptText}</div>
        
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="word-outline-board">
            <div className={`word-outline-lane ${isDenseWord ? 'is-dense' : ''}`.trim()}>
              {levelUnits.map((c, i) => (
                <DroppableSlot
                  key={i}
                  id={`slot-${i}`}
                  expectedLetter={c}
                  isFound={foundLetters.includes(i)}
                  unitCount={levelUnits.length}
                />
              ))}
            </div>
          </div>
          <div className="letter-monster-bank" style={{ minHeight: `${letterBankHeight}px` }}>
            {shuffledLetters.map((item) => (
              <DraggableLetter
                key={item.index}
                index={item.index}
                id={`drag-${item.index}`}
                letter={item.char}
                isFound={usedDragIndices.includes(item.index)}
                lang={lang}
                playMode={playMode}
                letterStyle={letterStyle}
                speakText={speakText}
                prefetchSpeech={prefetchSpeech}
                scatterStyle={scatteredLetters[item.index]}
              />
            ))}
          </div>
        </DndContext>

        {isWin && (
          <button onClick={() => {
            if (isLastLevel) {
              setGameState('MENU');
              return;
            }
            setCurrentIdx((prev) => prev + 1);
          }} style={{ marginTop: '30px', padding: isCompact ? '18px 30px' : '20px 60px', fontSize: isCompact ? '1.35rem' : '1.8rem', background: '#ffcc00', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 0 #b89500', animation: 'bounce 0.5s infinite alternate' }}>
            {isLastLevel ? text.done : text.next}
          </button>
        )}
      </div>
    </div>
  );
}
