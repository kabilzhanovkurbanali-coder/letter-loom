// Checks a child's finger against a letter's strokes. The finger has to start at the stroke's
// start dot and move along the stroke in its direction; progress only grows while the finger stays
// on the path. Leaving the path just pauses the stroke: the child carries on from there, even
// without lifting the finger, so there is never a "wrong" — only "keep going".
//
// All distances are in glyph units (a capital letter is 100 units tall).

export const TRACE_DEFAULTS = {
  tolerance: 15, // how far from the path the finger may wander
  startTolerance: 19, // how close to the start dot (or the paused point) a stroke must begin
  lookAhead: 45, // how many sample points ahead a fast finger may jump
  lookBack: 12,
  finishSlack: 2 // sample points short of the end that still count as finished
};

// On a small screen a glyph unit is less than a pixel, so the path gets wider for fingers.
const MIN_TOLERANCE_PX = 24;
const MIN_START_PX = 32;

export function createTracer(glyph, settings = {}) {
  const opts = { ...TRACE_DEFAULTS, ...settings };
  const base = { tolerance: opts.tolerance, startTolerance: opts.startTolerance };
  const state = {
    stroke: 0, // the stroke being traced now
    index: 0, // how far along it (sample point)
    active: false, // finger down and following the path
    down: false, // finger on the screen at all
    done: false
  };

  const current = () => glyph.strokes[state.stroke];
  const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

  // where the next touch has to begin: the stroke's start, or where it paused
  const anchor = () => {
    if (state.done) return null;
    const stroke = current();
    return stroke.points[stroke.isDot ? 0 : state.index];
  };

  const finishStroke = (events) => {
    events.push({ type: 'stroke', stroke: state.stroke });
    state.stroke += 1;
    state.index = 0;
    state.active = false;
    if (state.stroke >= glyph.strokes.length) {
      state.done = true;
      events.push({ type: 'done' });
    }
  };

  const advance = (point, events) => {
    const stroke = current();
    const points = stroke.points;
    const from = Math.max(0, state.index - opts.lookBack);
    const to = Math.min(points.length - 1, state.index + opts.lookAhead);
    let best = -1;
    let bestDistance = Infinity;
    for (let i = from; i <= to; i += 1) {
      const d = distance(point, points[i]);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    if (bestDistance > opts.tolerance * 1.6) {
      state.active = false;
      events.push({ type: 'off', stroke: state.stroke });
      return;
    }
    if (bestDistance <= opts.tolerance && best > state.index) {
      state.index = best;
      events.push({ type: 'progress', stroke: state.stroke, index: best });
    }
    if (state.index >= points.length - 1 - opts.finishSlack) finishStroke(events);
  };

  // starts (or resumes) the current stroke if the finger is at its anchor
  const tryBegin = (point, events) => {
    if (distance(point, anchor()) > opts.startTolerance) return false;
    if (current().isDot) {
      finishStroke(events);
      return true;
    }
    state.active = true;
    events.push({ type: 'begin', stroke: state.stroke });
    advance(point, events);
    return true;
  };

  return {
    state,
    anchor,

    // fraction of the current stroke already traced
    progress() {
      if (state.done) return 1;
      const stroke = current();
      return stroke.length ? stroke.points[state.index].d / stroke.length : 0;
    },

    // how many screen pixels one glyph unit takes now
    setScale(pixelsPerUnit) {
      if (!(pixelsPerUnit > 0)) return;
      opts.tolerance = Math.max(base.tolerance, MIN_TOLERANCE_PX / pixelsPerUnit);
      opts.startTolerance = Math.max(base.startTolerance, MIN_START_PX / pixelsPerUnit);
    },

    down(point) {
      const events = [];
      if (state.done) return events;
      state.down = true;
      if (!tryBegin(point, events)) events.push({ type: 'start-here', stroke: state.stroke });
      return events;
    },

    move(point) {
      const events = [];
      if (state.done || !state.down) return events;
      if (state.active) advance(point, events);
      // the finger slid back to where the stroke paused (or on to the next start): carry on
      else tryBegin(point, events);
      return events;
    },

    up() {
      state.down = false;
      state.active = false;
      return [];
    },

    reset() {
      state.stroke = 0;
      state.index = 0;
      state.active = false;
      state.down = false;
      state.done = false;
    }
  };
}
