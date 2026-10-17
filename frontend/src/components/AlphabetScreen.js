import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALPHABET_BY_LANG } from '../data/alphabetEntries';
import { uiText } from '../data/uiText';

const LETTER_PALETTE = [
  ['#ff6b6b','#feca57'],['#ff9f43','#ffd166'],['#48dbfb','#74b9ff'],['#1dd1a1','#00b894'],
  ['#a29bfe','#6c5ce7'],['#fd79a8','#e84393'],['#00d2d3','#01abc7'],['#e17055','#fdcb6e'],
  ['#55efc4','#00cec9'],['#f9ca24','#f0932b'],['#6c5ce7','#a29bfe'],['#00b894','#55efc4'],
];
const BRUSH_PALETTE = ['#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444'];
const BRUSH_SIZES = [8, 14, 22];

const alphabetText = {
  EN: {
    title: 'Alphabet Mode',
    subtitle: 'Turn the pages, listen to the letter, and learn a word.',
    traceTitle: 'Trace the letter',
    traceHint: 'Follow the light letter shape with the brush.',
    listen: 'Listen Again',
    clear: 'Clear',
    prev: 'Previous',
    next: 'Next',
    progress: 'Letter'
  },
  RU: {
    title: 'Режим Азбука',
    subtitle: 'Листай буквы, слушай озвучку и учи слово.',
    traceTitle: 'Обведи букву',
    traceHint: 'Веди кисточку по светлому шаблону.',
    listen: 'Послушать ещё раз',
    clear: 'Очистить',
    prev: 'Назад',
    next: 'Дальше',
    progress: 'Буква'
  },
  KG: {
    title: 'Алиппе режими',
    subtitle: 'Тамганы барактап, үнүн угуп, сөздү үйрөн.',
    traceTitle: 'Тамганы бастырып чык',
    traceHint: 'Жарык шаблондун үстүнөн кыл калем менен тарт.',
    listen: 'Дагы ук',
    clear: 'Тазалоо',
    prev: 'Артка',
    next: 'Кийинки',
    progress: 'Тамга'
  },
  UZ: {
    title: 'Alifbo rejimi',
    subtitle: 'Harflarni varaqlang, ovozni tinglang va so`zni o`rganing.',
    traceTitle: 'Harfni chizing',
    traceHint: 'Yengil shablon ustidan mo`yqalam bilan yuring.',
    listen: 'Yana tinglash',
    clear: 'Tozalash',
    prev: 'Orqaga',
    next: 'Keyingi',
    progress: 'Harf'
  }
};

function TracePracticeBoard({ letter, accentColor, panelColor, text }) {
  const boardRef = useRef(null);
  const canvasRef = useRef(null);
  const [brushColor, setBrushColor] = useState(BRUSH_PALETTE[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return undefined;

    const resizeCanvas = () => {
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [brushColor, brushSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [letter]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const drawSegment = (from, to) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    const point = getPoint(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
    drawSegment(point, { x: point.x + 0.01, y: point.y + 0.01 });
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;
    const point = getPoint(event);
    if (!point || !lastPointRef.current) return;
    drawSegment(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const finishStroke = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ marginTop: '22px', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div>
          <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>{text.traceTitle}</div>
          <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.98rem' }}>{text.traceHint}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={toolPillStyle}>
            <BrushIcon color={accentColor} />
          </div>
          {BRUSH_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setBrushColor(color)}
              style={{
                ...colorDotStyle,
                background: color,
                boxShadow: brushColor === color ? `0 0 0 3px rgba(255,255,255,0.22), 0 0 0 5px ${color}55` : 'none'
              }}
            />
          ))}
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              style={{
                ...sizeButtonStyle,
                borderColor: brushSize === size ? accentColor : 'rgba(255,255,255,0.18)',
                background: brushSize === size ? `${accentColor}22` : 'rgba(255,255,255,0.08)'
              }}
            >
              <span style={{ width: `${Math.max(6, size)}px`, height: `${Math.max(6, size)}px`, borderRadius: '999px', background: 'white', display: 'block' }} />
            </button>
          ))}
          <button type="button" onClick={clearCanvas} style={clearButtonStyle}>
            {text.clear}
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        style={{
          position: 'relative',
          minHeight: '300px',
          borderRadius: '30px',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.18)',
          background: `linear-gradient(180deg, ${panelColor}, rgba(255,255,255,0.05))`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'
        }}
      >
        <div style={traceGridStyle}>
          {[0, 1, 2].map((index) => (
            <div key={`${letter}-${index}`} style={traceCellStyle}>
              <div style={{ ...traceGuideStyle, color: `${accentColor}35` }}>
                {letter}
              </div>
            </div>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}

function BrushIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.2 4.8 19.2 9.8 10.1 19c-.7.7-1.7 1.1-2.8 1.1H4.5l.1-2.7c0-1.1.4-2.1 1.1-2.8l8.5-8.5Z" fill={color} />
      <path d="m13.4 5.6 1.7-1.7a2.3 2.3 0 0 1 3.2 0l1.8 1.8a2.3 2.3 0 0 1 0 3.2l-1.7 1.7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.6 19.4c.7-.1 1.4-.4 1.9-.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AlphabetScreen({ lang, currentTheme, speakText, onClose }) {
  const text = uiText[lang] || uiText.RU;
  const extra = alphabetText[lang] || alphabetText.RU;
  const entries = useMemo(() => ALPHABET_BY_LANG[lang] || ALPHABET_BY_LANG.RU, [lang]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEntry = entries[currentIndex] || entries[0];
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    setCurrentIndex(0);
  }, [lang]);

  useEffect(() => {
    if (!currentEntry || typeof speakText !== 'function') return undefined;
    const timer = window.setTimeout(() => {
      speakText(currentEntry.speech, {
        pitch: 0.98,
        rate: lang === 'EN' ? 0.94 : 0.9,
        interrupt: true
      });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [currentEntry, lang, speakText]);

  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + entries.length) % entries.length);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % entries.length);
  const replay = () => {
    if (!currentEntry || typeof speakText !== 'function') return;
    speakText(currentEntry.speech, {
      pitch: 0.98,
      rate: lang === 'EN' ? 0.94 : 0.9,
      interrupt: true
    });
  };

  const colors = LETTER_PALETTE[currentIndex % LETTER_PALETTE.length];
  const letterSize = currentEntry?.letter?.length > 1
    ? (isCompact ? '4.1rem' : '5.8rem')
    : (isCompact ? '5.6rem' : '7.8rem');

  return (
    <div style={{ width: '100%', maxWidth: '920px', margin: '10px auto 0', textAlign: 'center', padding: isCompact ? '18px 12px 34px' : '22px 18px 40px', boxSizing: 'border-box' }}>
      <button type="button" onClick={onClose} style={backButtonStyle}>
        {text.home}
      </button>

      <div style={{ background: currentTheme.cardBg, borderRadius: isCompact ? '30px' : '42px', padding: isCompact ? '22px 16px 28px' : '34px 28px 36px', border: '2px solid rgba(255,255,255,0.28)', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', color: 'white' }}>
        <div style={headerPillStyle}>{extra.title}</div>
        <div style={subtitleStyle}>{extra.subtitle}</div>

        <div style={{ ...heroCardStyle, gridTemplateColumns: isCompact ? '1fr' : heroCardStyle.gridTemplateColumns }}>
          <div style={{ ...letterBadgeStyle, fontSize: letterSize, background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`, color: 'white', textShadow: '0 3px 8px rgba(0,0,0,0.22)' }}>
            <div style={{ fontSize: isCompact ? '2.8rem' : '3.4rem', lineHeight: 1, marginBottom: '10px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))' }}>
              {currentEntry?.emoji || '🔤'}
            </div>
            {currentEntry?.letter}
          </div>
          <div style={{ ...wordCardStyle, borderTop: `5px solid ${colors[0]}` }}>
            <div style={wordLabelStyle}>{extra.progress} {currentIndex + 1}/{entries.length}</div>
            <div style={{ ...wordTextStyle, color: colors[0] }}>{currentEntry?.word}</div>
            <div style={phraseTextStyle}>{currentEntry?.speech}</div>
          </div>
        </div>

        <div style={actionRowStyle}>
          <button type="button" onClick={goPrev} style={{ ...navButtonStyle, background: 'linear-gradient(135deg, #5888ff, #7aa8ff)' }}>
            {extra.prev}
          </button>
          <button type="button" onClick={replay} style={{ ...navButtonStyle, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
            🔊 {extra.listen}
          </button>
          <button type="button" onClick={goNext} style={{ ...navButtonStyle, background: 'linear-gradient(135deg, #2fb55a, #77d98d)' }}>
            {extra.next}
          </button>
        </div>

        <div style={progressRailStyle}>
          <div
            style={{
              ...progressFillStyle,
              width: `${((currentIndex + 1) / Math.max(1, entries.length)) * 100}%`,
              background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`
            }}
          />
        </div>

        <TracePracticeBoard
          letter={currentEntry?.letter || ''}
          accentColor={colors[0]}
          panelColor={currentTheme.cardBg}
          text={extra}
        />
      </div>
    </div>
  );
}

const backButtonStyle = {
  background: 'rgba(255,255,255,0.24)',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: '18px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  marginBottom: '14px'
};

const headerPillStyle = {
  display: 'inline-flex',
  padding: '10px 18px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.2)',
  fontWeight: 'bold',
  fontSize: '0.98rem',
  marginBottom: '14px'
};

const subtitleStyle = {
  color: 'rgba(255,255,255,0.9)',
  fontSize: '1.02rem',
  maxWidth: '560px',
  margin: '0 auto 24px'
};

const heroCardStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 260px) 1fr',
  gap: '18px',
  alignItems: 'stretch',
  marginBottom: '22px'
};

const letterBadgeStyle = {
  minHeight: '220px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '32px',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,244,210,0.92))',
  color: '#77421d',
  boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.55), 0 16px 28px rgba(0,0,0,0.12)',
  fontWeight: '900'
};

const wordCardStyle = {
  minHeight: '220px',
  borderRadius: '32px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,235,221,0.94))',
  color: '#5f3416',
  textAlign: 'left',
  padding: '24px 24px 20px',
  boxShadow: '0 16px 28px rgba(0,0,0,0.12)'
};

const wordLabelStyle = {
  fontSize: '0.9rem',
  fontWeight: 'bold',
  opacity: 0.72,
  marginBottom: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const wordTextStyle = {
  fontSize: '2rem',
  fontWeight: '900',
  marginBottom: '14px'
};

const phraseTextStyle = {
  fontSize: '1.18rem',
  lineHeight: 1.45
};

const actionRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
  marginBottom: '18px'
};

const toolPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '46px',
  height: '46px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.12)'
};

const colorDotStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '999px',
  border: '2px solid rgba(255,255,255,0.8)',
  cursor: 'pointer'
};

const sizeButtonStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '16px',
  border: '2px solid rgba(255,255,255,0.18)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const clearButtonStyle = {
  border: 'none',
  borderRadius: '16px',
  padding: '12px 18px',
  fontWeight: '800',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.92)',
  color: '#263238'
};

const traceGridStyle = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
};

const traceCellStyle = {
  position: 'relative',
  borderRight: '1px dashed rgba(255,255,255,0.14)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const traceGuideStyle = {
  fontSize: 'clamp(5rem, 15vw, 8.6rem)',
  lineHeight: 1,
  fontWeight: '900',
  userSelect: 'none',
  pointerEvents: 'none'
};

const navButtonStyle = {
  border: 'none',
  color: 'white',
  padding: '16px 14px',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 10px 18px rgba(0,0,0,0.16)'
};

const progressRailStyle = {
  height: '14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.2)',
  overflow: 'hidden'
};

const progressFillStyle = {
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #ffd166, #ff9f43)'
};
