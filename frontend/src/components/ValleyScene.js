import React, { useEffect, useRef } from 'react';
import './ValleyScene.css';

// Layered mountain valley behind the menu. Each layer moves a little with the pointer
// (parallax) using only CSS transforms, so it stays smooth on weak tablets.
export function ValleyScene({ letters = [] }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined;
    let frame = 0;
    const onMove = (event) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const node = rootRef.current;
        if (!node) return;
        node.style.setProperty('--px', ((event.clientX / window.innerWidth) - 0.5).toFixed(3));
        node.style.setProperty('--py', ((event.clientY / window.innerHeight) - 0.5).toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="valley" ref={rootRef} aria-hidden="true">
      <div className="valley-sky" />

      <div className="valley-layer valley-sun-layer" style={{ '--depth': 0.15 }}>
        <div className="valley-sun">
          <svg className="valley-sun-rays" viewBox="0 0 200 200">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d="M100 6 L108 40 L92 40 Z" fill="#ffe08a" opacity="0.55" transform={`rotate(${i * 30} 100 100)`} />
            ))}
          </svg>
          <div className="valley-sun-core" />
        </div>
      </div>

      <div className="valley-clouds">
        <Cloud className="valley-cloud valley-cloud-1" />
        <Cloud className="valley-cloud valley-cloud-2" />
        <Cloud className="valley-cloud valley-cloud-3" />
      </div>

      <div className="valley-letters">
        {letters.slice(0, 6).map((letter, index) => (
          <span key={`${letter}-${index}`} className={`valley-letter valley-letter-${index + 1}`}>{letter}</span>
        ))}
      </div>

      <svg className="valley-layer valley-far" style={{ '--depth': 0.3 }} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice">
        <path d="M0 330 L130 210 L210 260 L330 120 L440 240 L520 190 L640 80 L760 230 L860 170 L980 60 L1100 210 L1190 150 L1310 230 L1440 160 L1440 420 L0 420 Z" fill="#b8c7f0" />
        <path d="M330 120 L362 158 L344 156 L330 170 L316 154 L300 158 Z M640 80 L676 124 L656 120 L640 136 L624 118 L606 124 Z M980 60 L1018 108 L996 104 L980 120 L964 102 L944 108 Z" fill="#ffffff" />
      </svg>

      <svg className="valley-layer valley-mid" style={{ '--depth': 0.55 }} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice">
        <path d="M0 330 C 160 250, 280 230, 420 280 C 560 330, 640 220, 800 230 C 960 240, 1040 300, 1200 260 C 1320 230, 1400 250, 1440 260 L1440 420 L0 420 Z" fill="#8fd17e" />
        <g className="valley-yurt" transform="translate(1060 176) scale(1.25)">
          <ellipse cx="40" cy="62" rx="52" ry="8" fill="rgba(40,90,40,0.18)" />
          <path d="M0 60 L0 30 Q40 -6 80 30 L80 60 Z" fill="#fffaf0" stroke="#e6dcc8" strokeWidth="2" />
          <path d="M0 34 Q40 14 80 34 L80 42 Q40 22 0 42 Z" fill="#e2483b" />
          <path d="M8 40 h64" stroke="#ffd166" strokeWidth="2" strokeDasharray="4 5" />
          <path d="M32 60 V40 Q40 34 48 40 V60 Z" fill="#c2563c" />
          <circle cx="40" cy="6" r="5" fill="#e2483b" />
        </g>
        <g transform="translate(560 200) scale(1.3)">
          <rect x="16" y="30" width="8" height="30" rx="3" fill="#a0714f" />
          <circle cx="20" cy="22" r="22" fill="#5fbf5a" />
          <circle cx="8" cy="30" r="14" fill="#6fcf66" />
          <circle cx="32" cy="30" r="14" fill="#55b252" />
        </g>
      </svg>

      <svg className="valley-layer valley-near" style={{ '--depth': 0.9 }} viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice">
        <path d="M0 170 C 220 130, 420 140, 640 170 C 860 200, 1080 150, 1440 165 L1440 300 L0 300 Z" fill="#6cc463" />
        {[[90, 190, '#ff8fab'], [180, 230, '#ffd166'], [330, 200, '#ffffff'], [520, 240, '#ff8fab'], [700, 210, '#ffd166'], [900, 235, '#ffffff'], [1080, 200, '#ff8fab'], [1260, 230, '#ffd166'], [1380, 205, '#ffffff']].map(([x, y, c]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <path d="M0 0 v16" stroke="#3e9a43" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="-2" r="7" fill={c} />
            <circle cx="0" cy="-2" r="2.6" fill="#ffb703" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function Cloud({ className }) {
  return (
    <svg className={className} viewBox="0 0 220 90">
      <path d="M30 80 C 6 80, 4 52, 28 48 C 26 22, 62 14, 76 34 C 86 8, 132 6, 140 36 C 160 24, 196 34, 190 60 C 212 64, 208 82, 190 82 Z" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}
