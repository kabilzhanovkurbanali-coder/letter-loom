import React, { useEffect, useMemo, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PALETTE = [
  { id: 1, color: '#ff6b6b', name: { EN: 'Red',    RU: 'Красный',     KG: 'Кызыл',   UZ: 'Qizil'      } },
  { id: 2, color: '#ffd166', name: { EN: 'Yellow',  RU: 'Жёлтый',      KG: 'Сары',    UZ: 'Sariq'      } },
  { id: 3, color: '#48dbfb', name: { EN: 'Blue',    RU: 'Синий',       KG: 'Көк',     UZ: "Ko`k"       } },
  { id: 4, color: '#1dd1a1', name: { EN: 'Green',   RU: 'Зелёный',     KG: 'Жашыл',   UZ: 'Yashil'     } },
  { id: 5, color: '#a29bfe', name: { EN: 'Purple',  RU: 'Фиолетовый',  KG: 'Күлгүн',  UZ: 'Binafsha'   } },
  { id: 6, color: '#ff9f43', name: { EN: 'Orange',  RU: 'Оранжевый',   KG: 'Апельсин',UZ: "To`q sariq" } },
];

const PICTURES = [
  {
    nameKey: 'cat',
    grid: [
      [0,1,0,0,0,0,1,0],
      [1,1,1,1,1,1,1,1],
      [1,2,1,1,1,1,2,1],
      [1,1,1,1,1,1,1,1],
      [1,1,3,1,1,3,1,1],
      [1,1,1,4,4,1,1,1],
      [1,2,1,1,1,1,2,1],
      [0,1,1,1,1,1,1,0],
    ],
  },
  {
    nameKey: 'sun',
    grid: [
      [0,0,2,0,0,2,0,0],
      [0,2,0,2,2,0,2,0],
      [2,0,2,2,2,2,0,2],
      [0,2,2,2,2,2,2,0],
      [0,2,2,2,2,2,2,0],
      [2,0,2,2,2,2,0,2],
      [0,2,0,2,2,0,2,0],
      [0,0,2,0,0,2,0,0],
    ],
  },
  {
    nameKey: 'house',
    grid: [
      [0,0,0,6,6,0,0,0],
      [0,0,6,6,6,6,0,0],
      [0,6,6,6,6,6,6,0],
      [6,6,6,6,6,6,6,6],
      [0,4,4,4,4,4,4,0],
      [0,4,4,3,3,4,4,0],
      [0,4,4,3,3,4,4,0],
      [0,4,4,4,4,4,4,0],
    ],
  },
];

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------

const T = {
  EN: {
    title:     'Color Art',
    pickColor: 'Pick a color',
    check:     'Done!',
    reset:     'Erase',
    win:       'Beautiful!',
    next:      'Next',
    back:      'Back',
    picture:   'Picture',
    bravo:     'Great job!',
  },
  RU: {
    title:     'Раскраска',
    pickColor: 'Выбери цвет',
    check:     'Готово!',
    reset:     'Стереть',
    win:       'Красота!',
    next:      'Следующая',
    back:      'Назад',
    picture:   'Картинка',
    bravo:     'Молодец!',
  },
  KG: {
    title:     'Боёк',
    pickColor: 'Түс танда',
    check:     'Даяр!',
    reset:     'Өчүр',
    win:       'Кооз!',
    next:      'Кийинки',
    back:      'Артка',
    picture:   'Сүрөт',
    bravo:     'Жарайсың!',
  },
  UZ: {
    title:     "Rasm bo`yash",
    pickColor: 'Rang tanlang',
    check:     'Tayyor!',
    reset:     "O`chir",
    win:       "Go`zal!",
    next:      'Keyingi',
    back:      'Orqaga',
    picture:   'Rasm',
    bravo:     'Barakalla!',
  },
};

const PICTURE_NAMES = {
  cat:   { EN: 'Cat',   RU: 'Кошка',  KG: 'Мышык',  UZ: 'Mushuk' },
  sun:   { EN: 'Sun',   RU: 'Солнце', KG: 'Күн',     UZ: 'Quyosh' },
  house: { EN: 'House', RU: 'Дом',    KG: 'Үй',      UZ: 'Uy'     },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const paletteById = Object.fromEntries(PALETTE.map(p => [p.id, p]));

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 600;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Cell({ value, paintedColorId, isCorrect, cellSize, onClick, shaking }) {
  if (value === 0) {
    return (
      <div
        style={{
          width: cellSize,
          height: cellSize,
          background: 'transparent',
          border: '1px solid transparent',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  const paletteColor = paletteById[value]?.color ?? '#eee';
  let bg = '#f8f8f8';
  if (paintedColorId) bg = paletteById[paintedColorId]?.color ?? '#f8f8f8';

  const showNumber = !isCorrect;
  const numberColor = paintedColorId
    ? darken(paletteById[paintedColorId]?.color ?? '#ccc', 0.45)
    : '#aaa';

  return (
    <div
      onClick={onClick}
      style={{
        width: cellSize,
        height: cellSize,
        background: bg,
        border: isCorrect
          ? `1.5px solid ${darken(bg, 0.2)}`
          : '1.5px solid #dde',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.18s ease',
        position: 'relative',
        animation: shaking ? 'cbn-shake 0.35s ease' : 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {showNumber && (
        <span
          style={{
            fontSize: cellSize * 0.32,
            fontWeight: 700,
            color: numberColor,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {value}
        </span>
      )}
      {isCorrect && (
        <span
          style={{
            fontSize: cellSize * 0.38,
            lineHeight: 1,
            pointerEvents: 'none',
            opacity: 0.7,
          }}
        >
          ✓
        </span>
      )}
      {/* color hint dot shown on unpainted cell */}
      {!paintedColorId && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 3,
            width: cellSize * 0.18,
            height: cellSize * 0.18,
            borderRadius: '50%',
            background: paletteColor,
            opacity: 0.55,
          }}
        />
      )}
    </div>
  );
}

// Very simple darkening utility (no external deps)
function darken(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ColorByNumberScreen({ lang, currentTheme, speakText, onClose }) {
  const t = T[lang] || T.EN;

  const [currentPictureIndex, setCurrentPictureIndex] = useState(0);
  // painted: { "r-c": colorId }
  const [painted, setPainted] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [shakingNoColor, setShakingNoColor] = useState(false);

  const picture = PICTURES[currentPictureIndex];
  const pictureName = PICTURE_NAMES[picture.nameKey]?.[lang] ?? picture.nameKey;
  const mobile = isMobile();
  const cellSize = mobile ? 34 : 40;

  // -------------------------------------------------------------------------
  // Completeness check
  // -------------------------------------------------------------------------

  const isComplete = useMemo(() => {
    const grid = picture.grid;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (painted[`${r}-${c}`] !== val) return false;
      }
    }
    return true;
  }, [painted, picture.grid]);

  // Fire confetti + win on completion
  useEffect(() => {
    if (isComplete && !gameWon) {
      setGameWon(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 500);
      if (typeof speakText === 'function') {
        speakText(t.bravo, { pitch: 1.2, rate: 0.9 });
      }
    }
  }, [isComplete, gameWon, speakText, t.bravo]);

  // Reset when picture changes
  useEffect(() => {
    setPainted({});
    setSelectedColor(null);
    setGameWon(false);
  }, [currentPictureIndex]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleColorSelect = useCallback((colorId) => {
    setSelectedColor(colorId);
    if (typeof speakText === 'function') {
      const colorEntry = paletteById[colorId];
      if (colorEntry) speakText(colorEntry.name[lang] ?? colorEntry.name.EN, { pitch: 1.1, rate: 0.95 });
    }
  }, [lang, speakText]);

  const handleCellClick = useCallback((r, c) => {
    if (gameWon) return;
    const val = picture.grid[r][c];
    if (val === 0) return;
    if (!selectedColor) {
      setShakingNoColor(true);
      setTimeout(() => setShakingNoColor(false), 400);
      return;
    }
    setPainted(prev => ({ ...prev, [`${r}-${c}`]: selectedColor }));
  }, [gameWon, picture.grid, selectedColor]);

  const handleReset = useCallback(() => {
    setPainted({});
    setSelectedColor(null);
    setGameWon(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPictureIndex(prev => (prev + 1) % PICTURES.length);
  }, []);

  // -------------------------------------------------------------------------
  // Theme colours
  // -------------------------------------------------------------------------

  const theme = currentTheme || {};
  const bgGradient = theme.gradient || 'linear-gradient(135deg, #e0f7fa 0%, #fce4ec 100%)';
  const accentColor = theme.accent || '#6c5ce7';
  const cardBg = theme.cardBg || 'rgba(255,255,255,0.92)';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: mobile ? '12px 8px 24px' : '20px 16px 40px',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Keyframe for shake animation injected once */}
      <style>{`
        @keyframes cbn-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes cbn-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cbn-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ---- Header ---- */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: mobile ? 10 : 14,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            color: accentColor,
            backdropFilter: 'blur(6px)',
          }}
        >
          ← {t.back}
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: mobile ? 20 : 24,
            fontWeight: 900,
            color: accentColor,
            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          🎨 {t.title}
        </h1>

        <button
          onClick={handleReset}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#e17055',
            backdropFilter: 'blur(6px)',
          }}
        >
          🗑 {t.reset}
        </button>
      </div>

      {/* ---- Picture label ---- */}
      <div
        style={{
          fontSize: mobile ? 13 : 15,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.45)',
          marginBottom: 6,
          letterSpacing: 0.5,
        }}
      >
        {t.picture} {currentPictureIndex + 1}/{PICTURES.length} — {pictureName}
      </div>

      {/* ---- Grid card ---- */}
      <div
        style={{
          background: cardBg,
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: mobile ? 10 : 14,
          display: 'inline-block',
          marginBottom: mobile ? 12 : 16,
          position: 'relative',
        }}
      >
        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(8, ${cellSize}px)`,
            gridTemplateRows: `repeat(8, ${cellSize}px)`,
            gap: 2,
            animation: shakingNoColor ? 'cbn-shake 0.35s ease' : 'none',
          }}
        >
          {picture.grid.map((row, r) =>
            row.map((val, c) => {
              const key = `${r}-${c}`;
              const paintedId = painted[key];
              const correct = val !== 0 && paintedId === val;
              return (
                <Cell
                  key={key}
                  value={val}
                  paintedColorId={paintedId}
                  isCorrect={correct}
                  cellSize={cellSize}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })
          )}
        </div>

        {/* Win overlay */}
        {gameWon && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.88)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              animation: 'cbn-pop 0.45s ease',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 52, animation: 'cbn-spin 2s linear infinite' }}>🌟</div>
            <div
              style={{
                fontSize: mobile ? 22 : 28,
                fontWeight: 900,
                color: accentColor,
                textShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {t.win}
            </div>
            <button
              onClick={handleNext}
              style={{
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '12px 28px',
                fontSize: 17,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                marginTop: 4,
              }}
            >
              {t.next} →
            </button>
          </div>
        )}
      </div>

      {/* ---- Pick color hint ---- */}
      {!gameWon && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(0,0,0,0.4)',
            marginBottom: 8,
            letterSpacing: 0.4,
            animation: !selectedColor ? 'cbn-pop 0.5s ease' : 'none',
          }}
        >
          {selectedColor
            ? `● ${paletteById[selectedColor]?.name[lang] ?? ''}`
            : `↓ ${t.pickColor}`}
        </div>
      )}

      {/* ---- Palette ---- */}
      {!gameWon && (
        <div
          style={{
            background: cardBg,
            borderRadius: 18,
            boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
            padding: mobile ? '10px 12px' : '12px 18px',
            display: 'flex',
            gap: mobile ? 8 : 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 460,
            width: '100%',
          }}
        >
          {PALETTE.map(p => {
            const isSelected = selectedColor === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleColorSelect(p.id)}
                title={p.name[lang] ?? p.name.EN}
                style={{
                  width: mobile ? 42 : 48,
                  height: mobile ? 42 : 48,
                  borderRadius: '50%',
                  background: p.color,
                  border: isSelected
                    ? `4px solid ${darken(p.color, 0.3)}`
                    : '3px solid transparent',
                  outline: isSelected ? `3px solid ${p.color}` : 'none',
                  outlineOffset: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: isSelected
                    ? `0 0 0 5px ${p.color}55, 0 4px 12px rgba(0,0,0,0.18)`
                    : '0 2px 8px rgba(0,0,0,0.14)',
                  transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {p.id}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Color name label ---- */}
      {!gameWon && selectedColor && (
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            fontWeight: 700,
            color: paletteById[selectedColor]?.color,
            textShadow: '0 1px 4px rgba(0,0,0,0.12)',
            letterSpacing: 0.5,
          }}
        >
          {paletteById[selectedColor]?.name[lang] ?? ''}
        </div>
      )}

      {/* ---- Legend ---- */}
      {!gameWon && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 380,
          }}
        >
          {PALETTE.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: '#555',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: p.color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {p.id} = {p.name[lang] ?? p.name.EN}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
