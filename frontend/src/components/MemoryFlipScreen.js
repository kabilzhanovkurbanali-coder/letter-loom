import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

// ─── Localisation ────────────────────────────────────────────────────────────
const UI = {
  EN: {
    title: 'Find the Pair',
    moves: 'Moves',
    time: 'Time',
    win: 'Well done!',
    winSub: 'All pairs found!',
    again: 'Play Again',
    back: 'Back',
  },
  RU: {
    title: 'Найди пару',
    moves: 'Ходов',
    time: 'Время',
    win: 'Молодец!',
    winSub: 'Все пары найдены!',
    again: 'Ещё раз',
    back: 'Назад',
  },
  KG: {
    title: 'Жупту тап',
    moves: 'Жүрүш',
    time: 'Убакыт',
    win: 'Азамат!',
    winSub: 'Баары табылды!',
    again: 'Дагы',
    back: 'Артка',
  },
  UZ: {
    title: 'Juftini top',
    moves: 'Yuriş',
    time: 'Vaqt',
    win: 'Barakalla!',
    winSub: 'Hammasi topildi!',
    again: 'Yana',
    back: 'Orqaga',
  },
};

const NUMBER_NAMES = {
  EN: ['one', 'two', 'three', 'four', 'five', 'six'],
  RU: ['один', 'два', 'три', 'четыре', 'пять', 'шесть'],
  KG: ['бир', 'эки', 'үч', 'төрт', 'беш', 'алты'],
  UZ: ["bir", "ikki", "uch", "to'rt", "besh", "olti"],
};

// ─── Pair definitions ─────────────────────────────────────────────────────────
// pairId 0-based (value = pairId + 1)
const PAIR_EMOJIS = ['🍎', '🌟', '🦋', '🐸', '🍭', '🚀'];

function buildPairs() {
  return Array.from({ length: 6 }, (_, i) => {
    const value = i + 1; // 1–6
    const emoji = PAIR_EMOJIS[i];
    return [
      { pairId: i, type: 'number', display: String(value), value },
      { pairId: i, type: 'emoji',  display: emoji.repeat(value), value },
    ];
  }).flat();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards() {
  return shuffle(buildPairs()).map((card, id) => ({ ...card, id }));
}

// ─── Palette for card backs ───────────────────────────────────────────────────
const BACK_GRADIENTS = [
  ['#ff6b6b', '#feca57'],
  ['#ff9f43', '#ffd166'],
  ['#48dbfb', '#74b9ff'],
  ['#1dd1a1', '#00b894'],
  ['#a29bfe', '#6c5ce7'],
  ['#fd79a8', '#e84393'],
  ['#00d2d3', '#01abc7'],
  ['#e17055', '#fdcb6e'],
  ['#55efc4', '#00cec9'],
  ['#f9ca24', '#f0932b'],
  ['#6c5ce7', '#a29bfe'],
  ['#00b894', '#55efc4'],
];

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MemoryFlipScreen({ lang, currentTheme, speakText, onClose }) {
  const t = UI[lang] || UI.RU;
  const numberNames = NUMBER_NAMES[lang] || NUMBER_NAMES.RU;

  const [cards, setCards] = useState(() => buildCards());
  const [flipped, setFlipped] = useState([]);   // indices of face-up (unmatched) cards
  const [matched, setMatched] = useState([]);   // pairIds that are matched
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [locked, setLocked] = useState(false);  // block clicks during mismatch delay

  const timerRef = useRef(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameWon) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameWon]);

  // ── Match check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (flipped.length !== 2) return;

    const [a, b] = flipped;
    const cardA = cards[a];
    const cardB = cards[b];

    if (cardA.pairId === cardB.pairId) {
      // Match!
      const newMatched = [...matched, cardA.pairId];
      setMatched(newMatched);
      setFlipped([]);
      setMoves((m) => m + 1);

      // TTS
      if (typeof speakText === 'function') {
        const word = numberNames[cardA.value - 1] || String(cardA.value);
        speakText(word, { pitch: 0.85, rate: 0.9 });
      }

      // Win?
      if (newMatched.length === 6) {
        setGameWon(true);
        setTimeout(() => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }, 150);
      }
    } else {
      // No match — flip back after 900 ms
      setLocked(true);
      const timeout = setTimeout(() => {
        setFlipped([]);
        setMoves((m) => m + 1);
        setLocked(false);
      }, 900);
      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  // ── Card click ─────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((idx) => {
    if (locked) return;
    if (flipped.includes(idx)) return;
    if (matched.includes(cards[idx].pairId)) return;
    if (flipped.length === 2) return;

    setFlipped((prev) => [...prev, idx]);
  }, [locked, flipped, matched, cards]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const restart = () => {
    setCards(buildCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameWon(false);
    setLocked(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isFaceUp = (idx) => flipped.includes(idx) || matched.includes(cards[idx].pairId);
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 600;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={outerStyle}>
      {/* Flip animation injected once */}
      <style>{FLIP_CSS}</style>

      {/* Back button */}
      <button type="button" onClick={onClose} style={backBtnStyle}>
        ← {t.back}
      </button>

      {/* Card panel */}
      <div
        style={{
          ...panelStyle,
          background: currentTheme?.cardBg || 'linear-gradient(160deg,#2d2d6b,#1a1a4a)',
        }}
      >
        {/* Title */}
        <div style={pillStyle}>{t.title}</div>

        {/* Stats row */}
        <div style={statsRowStyle}>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>{t.moves}</span>
            <span style={statValueStyle}>{moves}</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>{t.time}</span>
            <span style={statValueStyle}>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            ...gridStyle,
            gridTemplateColumns: isCompact ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
          }}
        >
          {cards.map((card, idx) => {
            const faceUp = isFaceUp(idx);
            const matchedCard = matched.includes(card.pairId);
            const grad = BACK_GRADIENTS[idx % BACK_GRADIENTS.length];
            const isEmoji = card.type === 'emoji';

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                style={{
                  ...cardWrapStyle,
                  cursor: faceUp || locked ? 'default' : 'pointer',
                }}
                aria-label={`Card ${idx + 1}`}
              >
                <div
                  className={faceUp ? 'mem-card flipped' : 'mem-card'}
                  style={{ '--grad-a': grad[0], '--grad-b': grad[1] }}
                >
                  {/* Back face */}
                  <div className="mem-face mem-back">
                    <span style={{ fontSize: isCompact ? '1.7rem' : '2rem' }}>?</span>
                  </div>
                  {/* Front face */}
                  <div
                    className="mem-face mem-front"
                    style={{
                      background: matchedCard
                        ? `linear-gradient(145deg, ${grad[0]}, ${grad[1]})`
                        : 'linear-gradient(145deg, #fff9f0, #fff0dc)',
                    }}
                  >
                    {isEmoji ? (
                      <span
                        style={{
                          fontSize: card.value <= 3
                            ? (isCompact ? '1.2rem' : '1.5rem')
                            : (isCompact ? '0.95rem' : '1.1rem'),
                          lineHeight: 1.3,
                          wordBreak: 'break-all',
                          textAlign: 'center',
                          padding: '4px',
                        }}
                      >
                        {card.display}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: isCompact ? '2rem' : '2.6rem',
                          fontWeight: 900,
                          color: matchedCard ? '#fff' : grad[0],
                          textShadow: matchedCard ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                        }}
                      >
                        {card.display}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Win overlay */}
      {gameWon && (
        <div style={overlayStyle}>
          <div style={winBoxStyle}>
            <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎉</div>
            <div style={winTitleStyle}>{t.win}</div>
            <div style={winSubStyle}>{t.winSub}</div>
            <div style={winStatsStyle}>
              {t.moves}: <strong>{moves}</strong> &nbsp;|&nbsp; {t.time}: <strong>{formatTime(timeElapsed)}</strong>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={restart} style={winBtnPrimaryStyle}>
                🔄 {t.again}
              </button>
              <button type="button" onClick={onClose} style={winBtnSecondaryStyle}>
                {t.back}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flip CSS (injected via <style>) ─────────────────────────────────────────
const FLIP_CSS = `
  .mem-card {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px;
  }
  .mem-card.flipped {
    transform: rotateY(180deg);
  }
  .mem-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .mem-back {
    background: linear-gradient(145deg, var(--grad-a), var(--grad-b));
    color: white;
    font-size: 2rem;
    font-weight: 900;
    box-shadow: inset 0 2px 8px rgba(255,255,255,0.3), 0 8px 18px rgba(0,0,0,0.18);
  }
  .mem-front {
    transform: rotateY(180deg);
    box-shadow: 0 8px 18px rgba(0,0,0,0.14);
  }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const outerStyle = {
  width: '100%',
  maxWidth: '860px',
  margin: '10px auto 0',
  textAlign: 'center',
  padding: '18px 14px 40px',
  boxSizing: 'border-box',
  position: 'relative',
};

const panelStyle = {
  borderRadius: '36px',
  padding: '24px 20px 28px',
  border: '2px solid rgba(255,255,255,0.22)',
  boxShadow: '0 24px 52px rgba(0,0,0,0.22)',
  color: 'white',
};

const backBtnStyle = {
  background: 'rgba(255,255,255,0.22)',
  color: 'white',
  border: 'none',
  padding: '11px 20px',
  borderRadius: '16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  marginBottom: '14px',
};

const pillStyle = {
  display: 'inline-flex',
  padding: '9px 20px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.18)',
  fontWeight: 'bold',
  fontSize: '1.05rem',
  marginBottom: '16px',
};

const statsRowStyle = {
  display: 'flex',
  gap: '14px',
  justifyContent: 'center',
  marginBottom: '20px',
};

const statBoxStyle = {
  background: 'rgba(255,255,255,0.15)',
  borderRadius: '14px',
  padding: '8px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '80px',
};

const statLabelStyle = {
  fontSize: '0.75rem',
  opacity: 0.8,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const statValueStyle = {
  fontSize: '1.4rem',
  fontWeight: 900,
  lineHeight: 1.2,
};

const gridStyle = {
  display: 'grid',
  gap: '10px',
  perspective: '900px',
};

const cardWrapStyle = {
  aspectRatio: '3/4',
  perspective: '900px',
  userSelect: 'none',
};

// ─── Win overlay ──────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '20px',
};

const winBoxStyle = {
  background: 'linear-gradient(160deg, #1a1a5e, #2d2d8b)',
  border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '32px',
  padding: '36px 32px 32px',
  textAlign: 'center',
  color: 'white',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 28px 60px rgba(0,0,0,0.45)',
};

const winTitleStyle = {
  fontSize: '2.4rem',
  fontWeight: 900,
  marginBottom: '6px',
};

const winSubStyle = {
  fontSize: '1.1rem',
  opacity: 0.88,
  marginBottom: '18px',
};

const winStatsStyle = {
  fontSize: '1rem',
  opacity: 0.82,
  marginBottom: '24px',
  background: 'rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '10px 16px',
  display: 'inline-block',
};

const winBtnPrimaryStyle = {
  background: 'linear-gradient(135deg, #ffd166, #ff9f43)',
  color: '#3d1d00',
  border: 'none',
  padding: '13px 28px',
  borderRadius: '18px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1.05rem',
};

const winBtnSecondaryStyle = {
  background: 'rgba(255,255,255,0.18)',
  color: 'white',
  border: 'none',
  padding: '13px 28px',
  borderRadius: '18px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1.05rem',
};
