import { glyphFor, glyphRow, pointAlong, rowExtent } from './glyphs';
import { ALPHABET_UNITS, FULL_ALPHABETS } from './letters';

test('every letter of every alphabet has strokes to trace', () => {
  const missing = [];
  [...Object.values(FULL_ALPHABETS), ...Object.values(ALPHABET_UNITS)].flat().forEach((letter) => {
    const glyph = glyphFor(letter);
    if (!glyph) {
      missing.push(letter);
      return;
    }
    glyph.strokes.forEach((stroke) => {
      expect(stroke.points.length).toBeGreaterThan(0);
      if (!stroke.isDot) expect(stroke.length).toBeGreaterThan(10);
    });
  });
  expect(missing).toEqual([]);
});

test('Uzbek O‘ and G‘ are found whichever apostrophe is typed', () => {
  expect(glyphFor('O‘')).toBe(glyphFor("O'"));
  expect(glyphFor('gʻ')).toBe(glyphFor("G'"));
  expect(glyphFor('sh')).toBe(glyphFor('SH'));
});

test('strokes run the way letters are written', () => {
  // A: from the top down to the left foot
  const a = glyphFor('A').strokes[0];
  expect(a.points[0]).toMatchObject({ x: 45, y: 10 });
  expect(a.points[a.points.length - 1].y).toBeCloseTo(110);
  // O: from the top, counter-clockwise, so a quarter of the way it is on the left
  const o = glyphFor('O').strokes[0];
  expect(pointAlong(o, 0.25).x).toBeLessThan(20);
  // Ё ends with its two dots
  expect(glyphFor('Ё').strokes.slice(-2).every((stroke) => stroke.isDot)).toBe(true);
});

test('a syllable is drawn as letters side by side; unknown signs keep a place', () => {
  const row = glyphRow('МА');
  expect(row.parts.map((part) => part.key)).toEqual(['М', 'А']);
  expect(row.parts[1].x).toBeGreaterThan(row.parts[0].w);
  expect(glyphRow('SH').parts).toHaveLength(1);
  expect(glyphRow("'").parts[0].glyph).toBeNull();
});

test('letters with dots or tails get room, and the eyes avoid the dots', () => {
  expect(rowExtent(['Ё']).top).toBeLessThan(rowExtent(['А']).top);
  expect(rowExtent(['Д']).bottom).toBeGreaterThan(rowExtent(['А']).bottom);
  expect(glyphRow('Т').eyes.y).toBe(10);
  expect(glyphRow('Ё').eyes.y).toBeGreaterThan(40);
});
