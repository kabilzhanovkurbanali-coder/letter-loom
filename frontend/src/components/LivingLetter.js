import React, { useId, useMemo } from 'react';
import { glyphRow, rowExtent } from '../lib/glyphs';
import { displayUnit } from '../lib/letters';
import './LivingLetter.css';

// Every letter has its own colour, the same in every game: [light, main, dark].
export const LETTER_COLORS = [
  ['#ff9a8b', '#ff5e7e', '#d93d60'],
  ['#7cc8ff', '#3a8bff', '#2563d6'],
  ['#ffe07a', '#ffaa2b', '#d9850c'],
  ['#74e6bb', '#1fb583', '#138c63'],
  ['#b9a2ff', '#7c5cf0', '#5b3fcf'],
  ['#ffa8dc', '#f45fb0', '#cc3f8c'],
  ['#6ae3e3', '#18a8ba', '#0f8394'],
  ['#ffbf7a', '#ff7a33', '#d95a17']
];

// mod 11 spreads neighbouring code points apart
export const colorFor = (unit) => {
  const seed = String(unit || '').split('').reduce((sum, ch) => sum * 3 + ch.charCodeAt(0), 0);
  return LETTER_COLORS[(seed % 11) % LETTER_COLORS.length];
};

const SIDE = 18; // room left and right for the outline
const DEPTH = 6; // how far the darker underside shows below the letter

// A gradient id that is unique per letter, with the colours in it, so equal ids always mean
// an equal gradient.
export const useGradientId = (colors) => `lv${useId().replace(/[^a-zA-Z0-9_-]/g, '')}${colors[0].slice(1)}${colors[1].slice(1)}`;

// The drawing itself, in glyph units: also used by the tracing card once a letter is traced.
export function LetterArt({ row, id, colors, shadow = false, eyes = true }) {
  const [c1, c2, c3] = colors;
  return (
    <g className="lv-art">
      {shadow ? null : (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="26" y2="114">
            <stop offset="0" stopColor={c1} />
            <stop offset="0.55" stopColor={c2} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
      )}

      {shadow ? null : <ellipse className="lv-ground" cx={row.w / 2} cy="127" rx={row.w / 2 + 8} ry="5" />}

      {row.parts.map((part) => (
        <g key={`${part.key}-${part.x}`} transform={`translate(${part.x} 0)`}>
          {part.glyph ? (
            // dots and ticks above the letter are drawn a little thinner, so they stay apart from it
            [[part.d, ''], [part.marks, ' is-mark']].map(([d, mark]) => (d ? (
              shadow ? (
                <g key={mark || 'body'}>
                  <path className={`lv-hole-rim${mark}`} d={d} />
                  <path className={`lv-hole${mark}`} d={d} />
                  <path className={`lv-hole-lit${mark}`} d={d} transform="translate(0 2.6)" />
                </g>
              ) : (
                <g key={mark || 'body'}>
                  <path className={`lv-rim${mark}`} d={d} transform={`translate(0 ${DEPTH})`} />
                  <path className={`lv-rim${mark}`} d={d} />
                  <path className={`lv-side${mark}`} d={d} transform={`translate(0 ${DEPTH})`} stroke={c3} />
                  <path className={`lv-body${mark}`} d={d} stroke={`url(#${id})`} />
                  <path className={`lv-shine${mark}`} d={d} transform="translate(-3.4 -4.4)" />
                </g>
              )
            ) : null))
          ) : (
            <>
              {shadow ? null : <text className="lv-text lv-text-side" x={part.w / 2} y="110" transform={`translate(0 ${DEPTH})`} fill={c3}>{displayUnit(part.key)}</text>}
              <text className={shadow ? 'lv-text lv-text-hole' : 'lv-text'} x={part.w / 2} y="110" fill={shadow ? undefined : `url(#${id})`}>{displayUnit(part.key)}</text>
            </>
          )}
        </g>
      ))}

      {eyes && !shadow ? (
        <g className="lv-face" transform={`translate(${row.eyes.x} ${row.eyes.y + 1})`}>
          {[-11, 11].map((x) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <g className="lv-eye">
                <ellipse className="lv-eye-white" rx="10" ry="11.2" />
                <g className="lv-look">
                  <circle className="lv-pupil" cx="1" cy="2" r="5.6" />
                  <circle className="lv-glint" cx="3" cy="-0.6" r="1.9" />
                </g>
              </g>
            </g>
          ))}
          <path className="lv-smile-eyes" d="M-19.5 3 Q-11 -8 -2.5 3 M2.5 3 Q11 -8 19.5 3" />
        </g>
      ) : null}
    </g>
  );
}

// A chunky letter that is a little character: thick rounded strokes, a darker underside,
// a white outline, a shine, and eyes on top. `shadow` draws only its silhouette, as the
// hollow a letter fits into. Strokes come from the same data as the tracing guide.
export function LivingLetter({
  unit, colors, shadow = false, eyes = true, happy = false, still = false, extent, className = '', style, ...rest
}) {
  const row = useMemo(() => glyphRow(unit), [unit]);
  const box = extent || rowExtent([unit]);
  const palette = colors || colorFor(unit);
  const id = useGradientId(palette);
  const viewBox = [-SIDE, box.top, row.w + SIDE * 2, box.bottom - box.top];
  const classes = ['lv', shadow ? 'is-shadow' : '', happy ? 'is-happy' : '', still || shadow ? 'is-still' : '', className].filter(Boolean).join(' ');

  return (
    <span className={classes} style={style} data-unit={unit} {...rest}>
      <svg
        className="lv-svg"
        viewBox={viewBox.join(' ')}
        style={{ aspectRatio: `${viewBox[2]} / ${viewBox[3]}` }}
        aria-hidden="true"
        focusable="false"
      >
        <LetterArt row={row} id={id} colors={palette} shadow={shadow} eyes={eyes} />
      </svg>
    </span>
  );
}
