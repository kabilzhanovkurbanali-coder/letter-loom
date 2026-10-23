import { glyphFor } from './glyphs';
import { createTracer } from './tracer';

const types = (events) => events.map((event) => event.type);

const traceStroke = (tracer, stroke, points = stroke.points) => {
  const events = [...tracer.down(points[0])];
  points.forEach((point) => events.push(...tracer.move(point)));
  events.push(...tracer.up());
  return events;
};

test('a stroke starts only at its green dot', () => {
  const tracer = createTracer(glyphFor('I'));
  expect(types(tracer.down({ x: 17, y: 100 }))).toEqual(['start-here']);
  expect(tracer.state.active).toBe(false);
  expect(tracer.progress()).toBe(0);
});

test('following the stroke in its direction finishes the letter', () => {
  const glyph = glyphFor('I');
  const tracer = createTracer(glyph);
  const events = traceStroke(tracer, glyph.strokes[0]);
  expect(types(events)).toEqual(expect.arrayContaining(['begin', 'progress', 'stroke', 'done']));
  expect(tracer.state.done).toBe(true);
});

test('going against the arrows does not count', () => {
  const glyph = glyphFor('I');
  const tracer = createTracer(glyph);
  const backwards = [...glyph.strokes[0].points].reverse();
  traceStroke(tracer, glyph.strokes[0], backwards);
  expect(tracer.state.done).toBe(false);
  // only the bit right next to the start dot, where the finger arrived last, may count
  expect(tracer.progress()).toBeLessThan(0.25);
});

test('leaving the path pauses the stroke; the finger carries on from there without lifting', () => {
  const glyph = glyphFor('L');
  const stroke = glyph.strokes[0];
  const tracer = createTracer(glyph);
  tracer.down(stroke.points[0]);
  const half = Math.floor(stroke.points.length / 2);
  stroke.points.slice(0, half).forEach((point) => tracer.move(point));
  const reached = tracer.state.index;
  expect(reached).toBeGreaterThan(half - 5);

  expect(types(tracer.move({ x: 90, y: 20 }))).toEqual(['off']);
  expect(tracer.state.index).toBe(reached);
  // far from the path nothing happens, back at the paused point the stroke goes on
  expect(tracer.move({ x: 80, y: 30 })).toEqual([]);
  expect(types(tracer.move(stroke.points[reached]))).toContain('begin');
  stroke.points.slice(reached).forEach((point) => tracer.move(point));
  expect(tracer.state.done).toBe(true);
});

test('lifting the finger keeps what was traced', () => {
  const glyph = glyphFor('I');
  const stroke = glyph.strokes[0];
  const tracer = createTracer(glyph);
  traceStroke(tracer, stroke, stroke.points.slice(0, 30));
  const reached = tracer.state.index;
  expect(reached).toBeGreaterThan(20);
  expect(tracer.anchor()).toBe(stroke.points[reached]);
  expect(types(tracer.down(stroke.points[0]))).toEqual(['start-here']);
  tracer.up();
  traceStroke(tracer, stroke, stroke.points.slice(reached));
  expect(tracer.state.done).toBe(true);
});

test('the dots of Ё are done with a touch', () => {
  const glyph = glyphFor('Ё');
  const tracer = createTracer(glyph);
  const strokes = [];
  glyph.strokes.forEach((stroke) => strokes.push(...types(traceStroke(tracer, stroke))));
  expect(strokes.filter((type) => type === 'stroke')).toHaveLength(glyph.strokes.length);
  expect(tracer.state.done).toBe(true);
});

test('on a small screen the start dot and the path are wider for fingers', () => {
  const glyph = glyphFor('I');
  const near = { x: 17 + 30, y: 10 };
  expect(types(createTracer(glyph).down(near))).toEqual(['start-here']);
  const small = createTracer(glyph);
  small.setScale(0.8);
  expect(types(small.down(near))).toContain('begin');
});
