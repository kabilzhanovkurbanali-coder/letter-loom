import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { glyphFor, glyphRow, pointAlong } from '../lib/glyphs';
import { createTracer } from '../lib/tracer';
import { displayUnit } from '../lib/letters';
import { LetterArt, colorFor, useGradientId } from './LivingLetter';
import './LetterTrace.css';

const TICKS_PER_STROKE = 4; // little notes while a stroke fills up
const STAR = 'M0 -8 L2.4 -2.6 L8.1 -2.4 L3.6 1.2 L5.2 6.8 L0 3.5 L-5.2 6.8 L-3.6 1.2 L-8.1 -2.4 L-2.4 -2.6 Z';

// Where the number of each later stroke goes: at its start, or a little along it when that spot
// is taken (B starts two strokes at the same corner).
const badgeSpots = (glyph, state, taken) => {
  const spots = {};
  const used = taken.filter(Boolean);
  glyph.strokes.forEach((stroke, index) => {
    if (index <= state.stroke) return;
    let spot = stroke.points[0];
    if (!stroke.isDot && used.some((point) => Math.hypot(point.x - spot.x, point.y - spot.y) < 14)) {
      spot = pointAlong(stroke, Math.min(0.5, 20 / (stroke.length || 1)));
    }
    spots[index] = spot;
    used.push(spot);
  });
  return spots;
};

// one arrow for a short stroke, up to four along a long one
const arrowSpots = (length) => {
  const count = Math.max(1, Math.min(4, Math.round(length / 60)));
  return Array.from({ length: count }, (_, index) => (index + 0.5) / count);
};

// The letter as a little road: a dotted middle line, a green start dot with the stroke number,
// arrows for the direction, a star at the end and a golden spark that shows the way. The road
// fills with the letter's colour behind the finger, only while the finger stays on it. When the
// last stroke is done the letter comes alive: it gets its eyes and jumps.
export function LetterTrace({ unit, colors, disabled = false, resetKey = 0, onStroke, onDone, onHint, onTick, onTapDone }) {
  const glyph = useMemo(() => glyphFor(unit), [unit]);
  const row = useMemo(() => glyphRow(unit), [unit]);
  const palette = colors || colorFor(unit);
  const gradientId = useGradientId(palette);
  const svgRef = useRef(null);
  const paintRef = useRef(null);
  const sparkRef = useRef(null);
  const holderRef = useRef(null);
  const ticksRef = useRef({ count: 0, total: 0 });
  const nudgeTimerRef = useRef(null);
  const [, setVersion] = useState(0);
  const [nudge, setNudge] = useState(null);
  const [hops, setHops] = useState(0);
  const rerender = useCallback(() => setVersion((value) => value + 1), []);

  // a new letter, or "once more", starts a fresh tracer
  const tracerKey = `${unit}|${resetKey}`;
  if (!holderRef.current || holderRef.current.key !== tracerKey) {
    holderRef.current = { key: tracerKey, tracer: glyph ? createTracer(glyph) : null };
    ticksRef.current = { count: 0, total: 0 };
  }
  const tracer = holderRef.current.tracer;
  const state = tracer?.state;
  const current = glyph && !state.done ? glyph.strokes[state.stroke] : null;
  const showSpark = Boolean(current && !current.isDot && state.index === 0 && !state.active && !disabled);

  useEffect(() => () => window.clearTimeout(nudgeTimerRef.current), []);

  // the golden spark runs along the stroke until the child starts it
  useEffect(() => {
    const spark = sparkRef.current;
    if (!showSpark || !spark || !window.requestAnimationFrame) return undefined;
    const run = Math.max(1000, current.length * 12);
    const pause = 700;
    const started = performance.now();
    let frame = 0;
    const step = (now) => {
      const t = ((now - started) % (run + pause)) / run;
      const point = pointAlong(current, Math.min(1, t));
      spark.setAttribute('transform', `translate(${point.x} ${point.y})`);
      spark.style.opacity = t <= 1 ? '1' : '0';
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [showSpark, current]);

  const toGlyph = (event) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM?.();
    if (matrix && svg.createSVGPoint) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(matrix.inverse());
      return { x: local.x, y: local.y };
    }
    const box = svg.getBoundingClientRect();
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
    return { x: vx + ((event.clientX - box.left) / (box.width || 1)) * vw, y: vy + ((event.clientY - box.top) / (box.height || 1)) * vh };
  };

  const paintNow = () => {
    const stroke = glyph.strokes[state.stroke];
    if (paintRef.current && stroke) paintRef.current.style.strokeDasharray = `${stroke.points[state.index].d} ${stroke.length + 40}`;
  };

  const handle = (events) => {
    let changed = false;
    events.forEach((event) => {
      if (event.type === 'progress') {
        paintNow();
        const stroke = glyph.strokes[event.stroke];
        const reached = Math.floor((stroke.points[event.index].d / (stroke.length || 1)) * TICKS_PER_STROKE);
        if (reached > ticksRef.current.count && reached < TICKS_PER_STROKE) {
          ticksRef.current.count = reached;
          onTick?.(ticksRef.current.total + reached);
        }
      } else if (event.type === 'stroke') {
        changed = true;
        ticksRef.current = { count: 0, total: ticksRef.current.total + TICKS_PER_STROKE };
        onStroke?.(event.stroke, glyph.strokes.length);
      } else if (event.type === 'done') {
        changed = true;
        onDone?.();
      } else if (event.type === 'start-here' || event.type === 'off') {
        changed = true;
        setNudge(event.type);
        window.clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = window.setTimeout(() => setNudge(null), 900);
        onHint?.(event.type === 'off' ? 'path' : 'start');
      } else {
        changed = true;
      }
    });
    if (changed) rerender();
  };

  const onPointerDown = (event) => {
    if (disabled || !tracer) return;
    event.preventDefault();
    if (state.done) {
      // the living letter jumps again and says itself
      setHops((value) => value + 1);
      onTapDone?.();
      return;
    }
    svgRef.current?.setPointerCapture?.(event.pointerId);
    const matrix = svgRef.current?.getScreenCTM?.();
    if (matrix) tracer.setScale(Math.hypot(matrix.a, matrix.b));
    handle(tracer.down(toGlyph(event)));
  };

  const onPointerMove = (event) => {
    if (!tracer || !state.down) return;
    handle(tracer.move(toGlyph(event)));
  };

  const onPointerUp = () => {
    if (!tracer || !state.down) return;
    tracer.up();
    rerender();
  };

  if (!glyph) {
    // a sign without stroke data still shows up, and a tap counts
    return (
      <button type="button" className="lt lt-plain" onClick={() => onDone?.()} style={{ color: palette[1] }}>
        {displayUnit(unit)}
      </button>
    );
  }

  const done = state.done;
  const top = Math.min(-12, row.minY - 16);
  const bottom = Math.max(130, row.maxY + 18);
  const viewBox = `-18 ${top} ${glyph.w + 36} ${bottom - top}`;
  const start = current && !state.active ? current.points[current.isDot ? 0 : state.index] : null;
  const end = current && !current.isDot ? current.points[current.points.length - 1] : null;
  const badges = done ? {} : badgeSpots(glyph, state, [current?.points[state.index], end]);

  return (
    <svg
      ref={svgRef}
      className={`lt ${done ? 'is-done' : ''} ${state.active ? 'is-active' : ''} ${nudge === 'off' ? 'is-off' : ''}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label={displayUnit(unit)}
      data-stroke={state.stroke}
      data-done={done ? 'yes' : 'no'}
    >
      <defs>
        <linearGradient id={`${gradientId}t`} gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="26" y2="114">
          <stop offset="0" stopColor={palette[0]} />
          <stop offset="0.55" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[1]} />
        </linearGradient>
      </defs>

      {/* the lines of a copybook: top, middle and the line letters stand on */}
      <g className="lt-lines">
        <path d="M-400 10H600" />
        <path className="is-middle" d="M-400 60H600" />
        <path className="is-base" d="M-400 110H600" />
      </g>

      <g className="lt-track">
        {glyph.strokes.map((stroke, index) => (stroke.isDot ? (
          <g key={`road-${index}`}>
            <circle className="lt-rim" cx={stroke.points[0].x} cy={stroke.points[0].y} r="14" />
            <circle className="lt-road" cx={stroke.points[0].x} cy={stroke.points[0].y} r="11" />
          </g>
        ) : (
          <g key={`road-${index}`}>
            <path className="lt-rim" d={stroke.d} />
            <path className="lt-road" d={stroke.d} />
          </g>
        )))}
        {glyph.strokes.map((stroke, index) => (index >= state.stroke && !stroke.isDot ? (
          <path key={`dots-${index}`} className={`lt-dots ${index === state.stroke ? 'is-now' : ''}`} d={stroke.d} />
        ) : null))}

        {glyph.strokes.map((stroke, index) => {
          const paint = `url(#${gradientId}t)`;
          if (index < state.stroke) {
            return stroke.isDot
              ? <circle key={`paint-${index}`} className="lt-paint" cx={stroke.points[0].x} cy={stroke.points[0].y} r="9" fill={paint} />
              : <path key={`paint-${index}`} className="lt-paint" d={stroke.d} stroke={paint} />;
          }
          if (index === state.stroke && !stroke.isDot) {
            return (
              <path
                key={`paint-${index}`}
                ref={paintRef}
                className="lt-paint"
                d={stroke.d}
                stroke={paint}
                style={{ strokeDasharray: `${stroke.points[state.index].d} ${stroke.length + 40}` }}
              />
            );
          }
          return null;
        })}

        {Object.entries(badges).map(([index, spot]) => (
          <g key={`next-${index}`} className="lt-next" transform={`translate(${spot.x} ${spot.y})`}>
            <circle r="7.5" />
            <text y="3.6">{Number(index) + 1}</text>
          </g>
        ))}

        {current && !current.isDot ? arrowSpots(current.length).map((spot) => {
          const point = pointAlong(current, spot);
          return (
            <path
              key={`arrow-${state.stroke}-${spot}`}
              className="lt-arrow"
              d="M-4.6 -5.6 L3.8 0 L-4.6 5.6"
              stroke={palette[2]}
              transform={`translate(${point.x} ${point.y}) rotate(${point.angle})`}
            />
          );
        }) : null}

        {end ? <path className="lt-finish" d={STAR} transform={`translate(${end.x} ${end.y})`} /> : null}

        {showSpark ? (
          <g ref={sparkRef} className="lt-spark" transform={`translate(${current.points[0].x} ${current.points[0].y})`}>
            <circle className="lt-spark-glow" r="10" />
            <circle className="lt-spark-core" r="5.5" />
          </g>
        ) : null}

        {start ? (
          <g className="lt-start" transform={`translate(${start.x} ${start.y})`}>
            <g className={nudge === 'start-here' || nudge === 'off' ? 'lt-start-body is-nudge' : 'lt-start-body'}>
              <circle className="lt-start-ring" r="12" />
              <circle className="lt-start-dot" r="9.5" />
              <text y="4">{state.stroke + 1}</text>
            </g>
          </g>
        ) : null}
      </g>

      {done ? (
        <g className="lt-alive">
          <g className={`lt-hop ${hops ? 'is-tap' : ''}`} key={hops}>
            <LetterArt row={row} id={gradientId} colors={palette} />
          </g>
        </g>
      ) : null}
    </svg>
  );
}
