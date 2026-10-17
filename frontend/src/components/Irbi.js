import React, { useEffect, useRef } from 'react';
import './Irbi.css';

// Irbi: a snow leopard cub, the game's guide. Pure SVG + CSS so it stays light on old tablets.
// mood: 'idle' | 'happy' | 'talking' | 'thinking' | 'cheer'
const SPOTS = [
  [58, 64], [72, 52], [128, 52], [142, 64], [100, 46], [86, 40], [114, 40],
  [60, 150], [140, 150], [72, 178], [128, 178], [148, 172], [52, 170]
];

// Snow leopard rosette: a broken dark ring with a warm centre.
function Rosette({ x, y, r, small = false }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 0.55} fill="#e9dcc3" opacity="0.8" />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke="#4b5363"
        strokeWidth={small ? 2.2 : 2.6}
        strokeLinecap="round"
        strokeDasharray={`${r * 1.7} ${r * 0.9}`}
        transform={`rotate(${(x * 7 + y * 3) % 360} ${x} ${y})`}
        opacity="0.7"
      />
    </g>
  );
}

export function Irbi({ mood = 'idle', size = 180, followPointer = false, className = '', title }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!followPointer || typeof window === 'undefined') return undefined;
    let frame = 0;
    const onMove = (event) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const node = rootRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
        const dy = (event.clientY - (rect.top + rect.height * 0.4)) / window.innerHeight;
        node.style.setProperty('--look-x', `${Math.max(-1, Math.min(1, dx * 2.4)) * 4}px`);
        node.style.setProperty('--look-y', `${Math.max(-1, Math.min(1, dy * 2.4)) * 3}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [followPointer]);

  const isJoyful = mood === 'happy' || mood === 'cheer';

  return (
    <div
      ref={rootRef}
      className={`irbi irbi-mood-${mood} ${className}`.trim()}
      style={{ width: size, height: size * 1.1 }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%">
        <defs>
          <radialGradient id="irbi-fur" cx="45%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#eef0f4" />
            <stop offset="100%" stopColor="#d9dde6" />
          </radialGradient>
          <radialGradient id="irbi-belly" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f1ec" />
          </radialGradient>
          <radialGradient id="irbi-iris" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#b9f0e4" />
            <stop offset="60%" stopColor="#5fc4b4" />
            <stop offset="100%" stopColor="#2f8f86" />
          </radialGradient>
          <linearGradient id="irbi-scarf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a59" />
            <stop offset="100%" stopColor="#e2483b" />
          </linearGradient>
        </defs>

        <ellipse className="irbi-shadow" cx="100" cy="212" rx="58" ry="7" fill="rgba(30,40,70,0.18)" />

        <g className="irbi-bounce">
          <g className="irbi-tail">
            <path
              d="M138 196 C 176 194, 188 160, 176 132 C 170 118, 156 116, 152 126 C 162 130, 168 146, 162 162 C 156 178, 140 182, 132 182 Z"
              fill="url(#irbi-fur)"
              stroke="#c9ced9"
              strokeWidth="1.5"
            />
            <path d="M170 140 q 6 4 4 10" stroke="#4b5363" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M164 160 q 8 2 6 10" stroke="#4b5363" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M154 124 q 6 -2 10 4" stroke="#4b5363" strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>

          <g className="irbi-body">
            <ellipse cx="100" cy="166" rx="50" ry="42" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.5" />
            <ellipse cx="100" cy="176" rx="29" ry="28" fill="url(#irbi-belly)" />
            {SPOTS.slice(7).map(([x, y]) => (
              <Rosette key={`b${x}-${y}`} x={x} y={y} r={4.6} />
            ))}
            <ellipse cx="66" cy="200" rx="19" ry="11" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.5" />
            <ellipse cx="134" cy="200" rx="19" ry="11" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.5" />
            <g className="irbi-paw irbi-paw-left">
              <ellipse cx="84" cy="200" rx="14" ry="10.5" fill="#ffffff" stroke="#c9ced9" strokeWidth="1.5" />
              <path d="M80 204 v-4 M88 204 v-4" stroke="#c9ced9" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <g className="irbi-paw irbi-paw-right">
              <ellipse cx="116" cy="200" rx="14" ry="10.5" fill="#ffffff" stroke="#c9ced9" strokeWidth="1.5" />
              <path d="M112 204 v-4 M120 204 v-4" stroke="#c9ced9" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>

          <g className="irbi-scarf">
            <path d="M58 132 Q100 150 142 132 L144 144 Q100 164 56 144 Z" fill="url(#irbi-scarf)" />
            <path d="M126 142 l10 26 l-14 -4 z" fill="#e2483b" />
            {[70, 86, 100, 114, 130].map((x) => (
              <circle key={x} cx={x} cy={x === 100 ? 149 : 145} r="2.2" fill="#ffd166" />
            ))}
          </g>

          <g className="irbi-head">
            <g className="irbi-ear irbi-ear-left">
              <circle cx="52" cy="50" r="19" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.5" />
              <circle cx="53" cy="52" r="10" fill="#f7b6c2" />
            </g>
            <g className="irbi-ear irbi-ear-right">
              <circle cx="148" cy="50" r="19" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.5" />
              <circle cx="147" cy="52" r="10" fill="#f7b6c2" />
            </g>

            <path
              d="M100 30 C 150 30, 166 66, 164 96 C 162 128, 136 146, 100 146 C 64 146, 38 128, 36 96 C 34 66, 50 30, 100 30 Z"
              fill="url(#irbi-fur)"
              stroke="#c9ced9"
              strokeWidth="1.5"
            />
            <path d="M40 104 l-8 6 l10 2 l-6 7 l12 -2" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M160 104 l8 6 l-10 2 l6 7 l-12 -2" fill="url(#irbi-fur)" stroke="#c9ced9" strokeWidth="1.2" strokeLinejoin="round" />

            {SPOTS.slice(0, 7).map(([x, y]) => (
              <Rosette key={`h${x}-${y}`} x={x} y={y} r={3.6} small />
            ))}

            <ellipse className="irbi-blush" cx="60" cy="116" rx="10" ry="6" fill="#ff9fb1" opacity="0.45" />
            <ellipse className="irbi-blush" cx="140" cy="116" rx="10" ry="6" fill="#ff9fb1" opacity="0.45" />

            <g className="irbi-eyes">
              {isJoyful ? (
                <g className="irbi-eyes-joy" stroke="#2b3040" strokeWidth="5" fill="none" strokeLinecap="round">
                  <path d="M64 96 Q76 82 88 96" />
                  <path d="M112 96 Q124 82 136 96" />
                </g>
              ) : (
                <g className="irbi-eyes-open">
                  <g className="irbi-eye">
                    <ellipse cx="76" cy="94" rx="13" ry="15" fill="#ffffff" />
                    <g className="irbi-pupil">
                      <ellipse cx="76" cy="95" rx="10.5" ry="12.5" fill="url(#irbi-iris)" />
                      <ellipse cx="76" cy="96" rx="6" ry="8" fill="#1f2430" />
                      <circle cx="72" cy="90" r="3.6" fill="#ffffff" />
                      <circle cx="80" cy="100" r="1.6" fill="#ffffff" />
                    </g>
                  </g>
                  <g className="irbi-eye">
                    <ellipse cx="124" cy="94" rx="13" ry="15" fill="#ffffff" />
                    <g className="irbi-pupil">
                      <ellipse cx="124" cy="95" rx="10.5" ry="12.5" fill="url(#irbi-iris)" />
                      <ellipse cx="124" cy="96" rx="6" ry="8" fill="#1f2430" />
                      <circle cx="120" cy="90" r="3.6" fill="#ffffff" />
                      <circle cx="128" cy="100" r="1.6" fill="#ffffff" />
                    </g>
                  </g>
                </g>
              )}
            </g>

            <path className="irbi-brow" d="M64 74 Q76 68 86 74 M114 74 Q124 68 136 74" stroke="#7a8293" strokeWidth="2.6" fill="none" strokeLinecap="round" />

            <ellipse cx="100" cy="120" rx="25" ry="17" fill="#ffffff" />
            <circle cx="88" cy="120" r="1.4" fill="#9aa1af" />
            <circle cx="84" cy="125" r="1.4" fill="#9aa1af" />
            <circle cx="112" cy="120" r="1.4" fill="#9aa1af" />
            <circle cx="116" cy="125" r="1.4" fill="#9aa1af" />
            <path d="M93 110 Q100 106 107 110 Q104 117 100 118 Q96 117 93 110 Z" fill="#f2849b" />

            <g className="irbi-mouth-closed">
              <path d="M100 118 v4 M100 122 Q94 128 89 123 M100 122 Q106 128 111 123" stroke="#3a3f4b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </g>
            <g className="irbi-mouth-open">
              <path d="M90 122 Q100 120 110 122 Q108 136 100 137 Q92 136 90 122 Z" fill="#8e3b4a" />
              <path d="M94 131 Q100 127 106 131 Q104 136 100 136 Q96 136 94 131 Z" fill="#ff8fa3" />
            </g>
          </g>
        </g>

        <g className="irbi-sparkles" fill="#ffd166">
          <path d="M28 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
          <path d="M176 30 l2.4 5.6 l5.6 2.4 l-5.6 2.4 l-2.4 5.6 l-2.4 -5.6 l-5.6 -2.4 l5.6 -2.4 z" />
          <path d="M184 92 l2 4.6 l4.6 2 l-4.6 2 l-2 4.6 l-2 -4.6 l-4.6 -2 l4.6 -2 z" />
        </g>
      </svg>
    </div>
  );
}
