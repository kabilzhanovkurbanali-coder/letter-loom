import React from 'react';
import './IrbiFace.css';

// A close-up of Irbi's face for mouth exercises. `pose` picks what the lips and tongue do;
// everything is plain SVG so the face stays sharp and light on old tablets.
const ROSETTES = [[66, 48], [82, 38], [100, 33], [118, 38], [134, 48], [54, 66], [146, 66]];

const TONGUE = { fill: '#ff8fa3', stroke: '#e5677f', strokeWidth: 2, strokeLinejoin: 'round' };
const MOUTH = '#6e2734';

const openMouth = (top, bottom, half) => `M${100 - half} ${top} Q100 ${top - 5} ${100 + half} ${top} Q${100 + half + 2} ${bottom - 4} 100 ${bottom} Q${100 - half - 2} ${bottom - 4} ${100 - half} ${top} Z`;

function Mouth({ pose }) {
  switch (pose) {
    case 'smile':
      return (
        <g>
          <path d="M74 121 Q100 130 126 121 Q122 146 100 148 Q78 146 74 121 Z" fill={MOUTH} />
          <path d="M79 123 Q100 131 121 123 L119 131 Q100 137 81 131 Z" fill="#ffffff" />
          <path d="M87 141 Q100 145 113 141 L111 137 Q100 140 89 137 Z" fill="#ffffff" />
          <path d="M74 121 Q100 130 126 121" stroke="#3a3f4b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'tube':
      return (
        <g className="if-tube">
          <ellipse cx="100" cy="128" rx="12.5" ry="11.5" fill="#f28aa0" stroke="#d4607a" strokeWidth="2" />
          <ellipse cx="100" cy="128.5" rx="5" ry="4.5" fill={MOUTH} />
          <ellipse cx="95.5" cy="122.5" rx="3.4" ry="1.6" fill="#ffffff" opacity="0.7" />
        </g>
      );
    case 'open':
    case 'clickDown':
      return (
        <g>
          <path d={openMouth(120, 156, 20)} fill={MOUTH} />
          <path d="M86 142 Q100 134 114 142 Q111 154 100 155 Q89 154 86 142 Z" {...TONGUE} />
          <path d="M89 120 h8 v4 q-4 2.5 -8 0 Z M103 120 h8 v4 q-4 2.5 -8 0 Z" fill="#ffffff" />
        </g>
      );
    case 'clickUp':
      return (
        <g>
          <path d={openMouth(120, 156, 20)} fill={MOUTH} />
          <path d="M84 152 Q100 118 116 152 Q100 158 84 152 Z" {...TONGUE} />
          <path d="M89 120 h8 v4 q-4 2.5 -8 0 Z M103 120 h8 v4 q-4 2.5 -8 0 Z" fill="#ffffff" />
        </g>
      );
    case 'spatula':
      return (
        <g>
          <path d={openMouth(120, 140, 18)} fill={MOUTH} />
          <path d="M78 132 Q100 126 122 132 Q124 150 100 154 Q76 150 78 132 Z" {...TONGUE} />
          <path d="M100 133 v15" stroke="#e5677f" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'needle':
      return (
        <g>
          <path d={openMouth(120, 136, 14)} fill={MOUTH} />
          <path d="M94 130 Q100 126 106 130 L102 160 Q100 164 98 160 Z" {...TONGUE} />
        </g>
      );
    case 'tongueLeft':
    case 'tongueRight': {
      const side = pose === 'tongueLeft' ? -1 : 1;
      return (
        <g>
          <path d={openMouth(120, 138, 16)} fill={MOUTH} />
          <path
            d={`M100 131 Q${100 + side * 12} 125 ${100 + side * 31} 127 Q${100 + side * 37} 131 ${100 + side * 31} 136 Q${100 + side * 12} 140 100 137 Z`}
            {...TONGUE}
          />
        </g>
      );
    }
    case 'tongueUp':
      return (
        <g>
          <path d={openMouth(122, 140, 16)} fill={MOUTH} />
          <path d="M90 130 Q100 125 110 130 L108 113 Q100 104 92 113 Z" {...TONGUE} />
        </g>
      );
    case 'tongueDown':
      return (
        <g>
          <path d={openMouth(120, 138, 16)} fill={MOUTH} />
          <path d="M90 130 Q100 125 110 130 L108 161 Q100 170 92 161 Z" {...TONGUE} />
        </g>
      );
    case 'jam':
      return (
        <g>
          <path d={openMouth(122, 140, 17)} fill={MOUTH} />
          <g className="if-jam">
            <ellipse cx="86" cy="119" rx="4" ry="2.6" fill="#c2185b" />
            <ellipse cx="114" cy="119" rx="4" ry="2.6" fill="#c2185b" />
            <ellipse cx="100" cy="117.5" rx="3" ry="2" fill="#c2185b" />
          </g>
          <g className="if-lick">
            <path d="M92 132 Q100 128 108 132 L106 120 Q100 113 94 120 Z" {...TONGUE} />
          </g>
        </g>
      );
    case 'cheeks':
      return <path d="M89 126 Q100 131 111 126" stroke="#3a3f4b" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
    case 'candyLeft':
    case 'candyRight': {
      const side = pose === 'candyLeft' ? -1 : 1;
      const x = 100 + side * 31;
      return (
        <g>
          <g className="if-bump">
            <ellipse cx={x} cy="131" rx="15" ry="14" fill="#ffffff" />
            <path d={`M${x - 11} 141 Q${x} 148 ${x + 11} 141`} stroke="#dfe3ec" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
          <path d={`M100 113 v7 M100 120 Q${92 - side * 3} 126 ${85 - side * 3} 121 M100 120 Q${108 - side * 3} 126 ${115 - side * 3} 121`} stroke="#3a3f4b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    default:
      return <path d="M100 113 v7 M100 120 Q92 128 84 121 M100 120 Q108 128 116 121" stroke="#3a3f4b" strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
}

export function IrbiFace({ pose = 'rest', happy = false, size = 260, className = '' }) {
  const puffed = pose === 'cheeks';
  return (
    <div className={`if if-pose-${pose} ${happy ? 'is-happy' : ''} ${className}`.trim()} style={{ width: size, height: size * 0.95 }} aria-hidden="true">
      <svg viewBox="0 0 200 190" width="100%" height="100%">
        <defs>
          <radialGradient id="if-fur" cx="45%" cy="35%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#eef0f4" />
            <stop offset="100%" stopColor="#d9dde6" />
          </radialGradient>
          <radialGradient id="if-iris" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#b9f0e4" />
            <stop offset="60%" stopColor="#5fc4b4" />
            <stop offset="100%" stopColor="#2f8f86" />
          </radialGradient>
        </defs>

        <g className="if-head">
          <circle cx="40" cy="34" r="21" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.5" />
          <circle cx="42" cy="36" r="11.5" fill="#f7b6c2" />
          <circle cx="160" cy="34" r="21" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.5" />
          <circle cx="158" cy="36" r="11.5" fill="#f7b6c2" />

          {puffed ? (
            <g className="if-puffs">
              <ellipse cx="30" cy="118" rx="27" ry="25" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.5" />
              <ellipse cx="170" cy="118" rx="27" ry="25" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.5" />
            </g>
          ) : null}

          <path
            d="M100 20 C 158 20, 178 60, 176 100 C 174 146, 142 170, 100 170 C 58 170, 26 146, 24 100 C 22 60, 42 20, 100 20 Z"
            fill="url(#if-fur)"
            stroke="#c9ced9"
            strokeWidth="1.5"
          />
          <path d="M28 108 l-9 7 l11 2 l-7 8 l13 -2" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M172 108 l9 7 l-11 2 l7 8 l-13 -2" fill="url(#if-fur)" stroke="#c9ced9" strokeWidth="1.2" strokeLinejoin="round" />

          {ROSETTES.map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="2.2" fill="#e9dcc3" opacity="0.8" />
              <circle cx={x} cy={y} r="4.2" fill="none" stroke="#4b5363" strokeWidth="2.3" strokeDasharray="7 4" strokeLinecap="round" opacity="0.7" transform={`rotate(${(x * 7 + y * 3) % 360} ${x} ${y})`} />
            </g>
          ))}

          <ellipse className="if-blush" cx={puffed ? 50 : 56} cy="118" rx={puffed ? 15 : 12} ry={puffed ? 9 : 7} fill="#ff9fb1" opacity={puffed ? 0.6 : 0.45} />
          <ellipse className="if-blush" cx={puffed ? 150 : 144} cy="118" rx={puffed ? 15 : 12} ry={puffed ? 9 : 7} fill="#ff9fb1" opacity={puffed ? 0.6 : 0.45} />

          {happy ? (
            <g stroke="#2b3040" strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M60 86 Q72 72 84 86" />
              <path d="M116 86 Q128 72 140 86" />
            </g>
          ) : (
            <g>
              {[72, 128].map((x) => (
                <g key={x} className="if-eye">
                  <ellipse cx={x} cy="84" rx="13" ry="15" fill="#ffffff" />
                  <ellipse cx={x} cy="85" rx="10.5" ry="12.5" fill="url(#if-iris)" />
                  <ellipse cx={x} cy="86" rx="6" ry="8" fill="#1f2430" />
                  <circle cx={x - 4} cy="80" r="3.6" fill="#ffffff" />
                  <circle cx={x + 4} cy="90" r="1.6" fill="#ffffff" />
                </g>
              ))}
            </g>
          )}
          <path d="M60 63 Q72 57 84 63 M116 63 Q128 57 140 63" stroke="#7a8293" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />

          <ellipse cx="100" cy="126" rx="36" ry="26" fill="#ffffff" />
          {[[84, 122], [80, 128], [116, 122], [120, 128]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#9aa1af" />
          ))}

          <g className="if-mouth" key={pose}>
            <Mouth pose={pose} />
          </g>

          <path d="M90 104 Q100 99 110 104 Q106 112 100 113 Q94 112 90 104 Z" fill="#f2849b" />
          <ellipse cx="96" cy="103.5" rx="3" ry="1.5" fill="#ffffff" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

export const FACE_POSES = ['rest', 'smile', 'tube', 'open', 'cheeks', 'spatula', 'needle', 'tongueLeft', 'tongueRight', 'tongueUp', 'tongueDown', 'jam', 'candyLeft', 'candyRight', 'clickUp', 'clickDown'];
