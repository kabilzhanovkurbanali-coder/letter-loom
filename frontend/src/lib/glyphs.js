// How each capital letter is written: its strokes in order, each with a direction.
// Coordinates: capital letters stand on y = 110 and reach y = 10; marks above go up to y = -15,
// tails down to y = 126. Every stroke is lines, cubic curves or ellipse arcs (turned into curves),
// so the same data draws the dotted guide, the arrows, and checks the child's finger.

const rad = (degrees) => (degrees * Math.PI) / 180;

class Stroke {
  constructor() {
    this.segs = [];
    this.cur = null;
  }

  M(x, y) {
    this.cur = [x, y];
    return this;
  }

  L(x, y) {
    this.segs.push({ t: 'L', a: this.cur, b: [x, y] });
    this.cur = [x, y];
    return this;
  }

  C(x1, y1, x2, y2, x, y) {
    this.segs.push({ t: 'C', a: this.cur, c1: [x1, y1], c2: [x2, y2], b: [x, y] });
    this.cur = [x, y];
    return this;
  }

  // Ellipse arc from angle a0 to a1 in degrees (0° = right, 90° = down); decreasing angles go
  // counter-clockwise on screen, the way children write O and C.
  A(cx, cy, rx, ry, a0, a1) {
    const point = (a) => [cx + rx * Math.cos(rad(a)), cy + ry * Math.sin(rad(a))];
    const start = point(a0);
    if (!this.cur) this.M(...start);
    else if (Math.hypot(this.cur[0] - start[0], this.cur[1] - start[1]) > 0.5) this.L(...start);
    const pieces = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
    const step = (a1 - a0) / pieces;
    const k = (4 / 3) * Math.tan(rad(step) / 4);
    for (let i = 0; i < pieces; i += 1) {
      const t1 = a0 + i * step;
      const t2 = t1 + step;
      const p0 = point(t1);
      const p3 = point(t2);
      const d1 = [-rx * Math.sin(rad(t1)), ry * Math.cos(rad(t1))];
      const d2 = [-rx * Math.sin(rad(t2)), ry * Math.cos(rad(t2))];
      this.segs.push({
        t: 'C', a: p0, c1: [p0[0] + k * d1[0], p0[1] + k * d1[1]], c2: [p3[0] - k * d2[0], p3[1] - k * d2[1]], b: p3
      });
    }
    this.cur = point(a1);
    return this;
  }

  // a dot (Ё) is a stroke of one point: the child just touches it
  D(x, y) {
    this.segs.push({ t: 'D', a: [x, y] });
    this.cur = [x, y];
    return this;
  }
}

const S = () => new Stroke();

// ---------- the letters ----------
const LATIN = {
  A: { w: 90, s: [S().M(45, 10).L(12, 110), S().M(45, 10).L(78, 110), S().M(26, 74).L(64, 74)] },
  B: { w: 78, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(42, 10).C(66, 10, 66, 58, 42, 58).L(16, 58), S().M(16, 58).L(46, 58).C(74, 58, 74, 110, 46, 110).L(16, 110)] },
  C: { w: 80, s: [S().A(46, 60, 34, 50, -35, -325)] },
  D: { w: 82, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(34, 10).C(78, 10, 78, 110, 34, 110).L(16, 110)] },
  E: { w: 70, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(62, 10), S().M(16, 60).L(54, 60), S().M(16, 110).L(62, 110)] },
  F: { w: 66, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(60, 10), S().M(16, 60).L(52, 60)] },
  G: { w: 86, s: [S().A(46, 60, 35, 50, -35, -360).L(54, 60)] },
  H: { w: 80, s: [S().M(16, 10).L(16, 110), S().M(64, 10).L(64, 110), S().M(16, 60).L(64, 60)] },
  I: { w: 34, s: [S().M(17, 10).L(17, 110)] },
  J: { w: 60, s: [S().M(44, 10).L(44, 84).C(44, 114, 8, 114, 8, 88)] },
  K: { w: 76, s: [S().M(16, 10).L(16, 110), S().M(66, 10).L(16, 64), S().M(30, 50).L(68, 110)] },
  L: { w: 64, s: [S().M(16, 10).L(16, 110).L(60, 110)] },
  M: { w: 100, s: [S().M(14, 10).L(14, 110), S().M(14, 10).L(50, 78).L(86, 10).L(86, 110)] },
  N: { w: 82, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(66, 110).L(66, 10)] },
  O: { w: 86, s: [S().A(43, 60, 34, 50, -90, -450)] },
  P: { w: 76, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(42, 10).C(70, 10, 70, 62, 42, 62).L(16, 62)] },
  Q: { w: 88, s: [S().A(44, 60, 34, 50, -90, -450), S().M(52, 82).L(80, 114)] },
  R: { w: 78, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(42, 10).C(70, 10, 70, 60, 42, 60).L(16, 60), S().M(38, 60).L(68, 110)] },
  S: { w: 72, s: [S().A(37, 35, 24, 25, -15, -270).A(37, 85, 26, 25, -90, 150)] },
  T: { w: 76, s: [S().M(8, 10).L(68, 10), S().M(38, 10).L(38, 110)] },
  U: { w: 80, s: [S().M(15, 10).L(15, 72).C(15, 116, 65, 116, 65, 72).L(65, 10)] },
  V: { w: 82, s: [S().M(8, 10).L(41, 110).L(74, 10)] },
  W: { w: 112, s: [S().M(6, 10).L(31, 110).L(56, 38).L(81, 110).L(106, 10)] },
  X: { w: 78, s: [S().M(10, 10).L(68, 110), S().M(68, 10).L(10, 110)] },
  Y: { w: 78, s: [S().M(10, 10).L(39, 58), S().M(68, 10).L(39, 58).L(39, 110)] },
  Z: { w: 72, s: [S().M(10, 10).L(62, 10).L(10, 110).L(62, 110)] }
};

const CYRILLIC = {
  А: LATIN.A, В: LATIN.B, Е: LATIN.E, К: LATIN.K, М: LATIN.M, Н: LATIN.H, О: LATIN.O, Р: LATIN.P, С: LATIN.C, Т: LATIN.T, Х: LATIN.X,
  Б: { w: 76, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(62, 10), S().M(16, 56).L(42, 56).C(72, 56, 72, 110, 42, 110).L(16, 110)] },
  Г: { w: 62, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(58, 10)] },
  Д: { w: 92, s: [S().M(32, 10).C(32, 52, 26, 80, 14, 96), S().M(32, 10).L(74, 10).L(74, 96), S().M(6, 116).L(6, 96).L(86, 96).L(86, 116)] },
  Ё: { w: 70, s: [...LATIN.E.s, S().D(27, -13), S().D(49, -13)] },
  Ж: { w: 112, s: [S().M(56, 10).L(56, 110), S().M(12, 10).L(56, 60).L(12, 110), S().M(100, 10).L(56, 60).L(100, 110)] },
  З: { w: 72, s: [S().A(34, 35, 24, 25, -155, 90).A(34, 85, 27, 25, -90, 155)] },
  И: { w: 82, s: [S().M(16, 10).L(16, 110), S().M(16, 110).L(66, 10), S().M(66, 10).L(66, 110)] },
  Й: { w: 82, s: [S().M(16, 10).L(16, 110), S().M(16, 110).L(66, 10), S().M(66, 10).L(66, 110), S().M(27, -15).C(31, -3, 51, -3, 55, -15)] },
  Л: { w: 82, s: [S().M(30, 10).C(30, 56, 24, 90, 8, 110), S().M(30, 10).L(72, 10).L(72, 110)] },
  П: { w: 80, s: [S().M(16, 10).L(16, 110), S().M(16, 10).L(64, 10).L(64, 110)] },
  У: { w: 80, s: [S().M(10, 10).L(40, 66), S().M(70, 10).L(36, 90).C(30, 104, 22, 110, 10, 108)] },
  Ф: { w: 98, s: [S().M(49, 10).L(49, 110), S().A(49, 58, 40, 30, -90, -450)] },
  Ц: { w: 92, s: [S().M(16, 10).L(16, 96).L(80, 96).L(80, 118), S().M(66, 10).L(66, 96)] },
  Ч: { w: 76, s: [S().M(16, 10).L(16, 44).C(16, 66, 42, 68, 62, 56), S().M(62, 10).L(62, 110)] },
  Ш: { w: 106, s: [S().M(14, 10).L(14, 110).L(92, 110).L(92, 10), S().M(53, 10).L(53, 110)] },
  Щ: { w: 116, s: [S().M(14, 10).L(14, 96).L(104, 96).L(104, 118), S().M(53, 10).L(53, 96), S().M(92, 10).L(92, 96)] },
  Ъ: { w: 84, s: [S().M(6, 10).L(24, 10).L(24, 110), S().M(24, 56).L(48, 56).C(78, 56, 78, 110, 48, 110).L(24, 110)] },
  Ы: { w: 98, s: [S().M(16, 10).L(16, 110), S().M(16, 56).L(38, 56).C(66, 56, 66, 110, 38, 110).L(16, 110), S().M(84, 10).L(84, 110)] },
  Ь: { w: 72, s: [S().M(16, 10).L(16, 110), S().M(16, 56).L(40, 56).C(70, 56, 70, 110, 40, 110).L(16, 110)] },
  Э: { w: 78, s: [S().A(36, 60, 34, 50, -145, 145), S().M(30, 60).L(70, 60)] },
  Ю: { w: 116, s: [S().M(14, 10).L(14, 110), S().M(14, 60).L(40, 60), S().A(78, 60, 32, 50, -90, -450)] },
  Я: { w: 78, s: [S().M(62, 10).L(36, 10).C(8, 10, 8, 62, 36, 62).L(62, 62), S().M(62, 10).L(62, 110), S().M(42, 62).L(12, 110)] },
  Ң: { w: 86, s: [S().M(16, 10).L(16, 110), S().M(64, 10).L(64, 110).L(78, 110).L(78, 124), S().M(16, 60).L(64, 60)] },
  Ө: { w: 86, s: [S().A(43, 60, 34, 50, -90, -450), S().M(10, 60).L(76, 60)] },
  Ү: LATIN.Y
};

const shift = (stroke, dx) => {
  const moved = new Stroke();
  moved.segs = stroke.segs.map((seg) => {
    const out = { ...seg };
    ['a', 'b', 'c1', 'c2'].forEach((key) => {
      if (seg[key]) out[key] = [seg[key][0] + dx, seg[key][1]];
    });
    return out;
  });
  return moved;
};

// two letters written one after the other (Uzbek SH, CH, NG)
const pair = (first, second, gap = 4) => ({ w: first.w + gap + second.w, s: [...first.s, ...second.s.map((stroke) => shift(stroke, first.w + gap))] });
// the turned comma of Uzbek O‘ and G‘
const withMark = (letter) => ({ w: letter.w + 14, s: [...letter.s, S().M(letter.w + 9, -4).L(letter.w + 2, 16)] });

const DIGRAPHS = {
  "O'": withMark(LATIN.O),
  "G'": withMark(LATIN.G),
  SH: pair(LATIN.S, LATIN.H),
  CH: pair(LATIN.C, LATIN.H),
  NG: pair(LATIN.N, LATIN.G)
};

// ---------- geometry ----------
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const cubicAt = (seg, t) => {
  const u = 1 - t;
  return [
    u * u * u * seg.a[0] + 3 * u * u * t * seg.c1[0] + 3 * u * t * t * seg.c2[0] + t * t * t * seg.b[0],
    u * u * u * seg.a[1] + 3 * u * u * t * seg.c1[1] + 3 * u * t * t * seg.c2[1] + t * t * t * seg.b[1]
  ];
};

const fmt = (n) => Math.round(n * 10) / 10;

const pathOf = (segs) => segs.map((seg, index) => {
  const move = index === 0 || seg.t === 'D' ? `M${fmt(seg.a[0])} ${fmt(seg.a[1])}` : '';
  if (seg.t === 'L') return `${move}L${fmt(seg.b[0])} ${fmt(seg.b[1])}`;
  if (seg.t === 'C') return `${move}C${fmt(seg.c1[0])} ${fmt(seg.c1[1])} ${fmt(seg.c2[0])} ${fmt(seg.c2[1])} ${fmt(seg.b[0])} ${fmt(seg.b[1])}`;
  return `${move}l0.01 0`;
}).join('');

// Points every ~2 units along the stroke, each with the distance travelled so far.
const sampleStroke = (segs, spacing = 2) => {
  const raw = [];
  segs.forEach((seg) => {
    if (seg.t === 'D') {
      raw.push(seg.a);
      return;
    }
    const steps = seg.t === 'L' ? 1 : 40;
    for (let i = raw.length ? 1 : 0; i <= steps; i += 1) {
      raw.push(seg.t === 'L' ? lerp(seg.a, seg.b, i / steps) : cubicAt(seg, i / steps));
    }
    if (seg.t === 'L' && raw.length >= 2) {
      // fill straight lines in, so every part of a stroke is sampled evenly
      const end = raw.pop();
      const start = raw[raw.length - 1];
      const count = Math.max(1, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / spacing));
      for (let i = 1; i <= count; i += 1) raw.push(lerp(start, end, i / count));
    }
  });
  const points = [{ x: raw[0][0], y: raw[0][1], d: 0 }];
  raw.slice(1).forEach(([x, y]) => {
    const last = points[points.length - 1];
    const step = Math.hypot(x - last.x, y - last.y);
    if (step < spacing * 0.5) return;
    if (step > spacing * 1.5) {
      const count = Math.ceil(step / spacing);
      for (let i = 1; i <= count; i += 1) {
        const p = lerp([last.x, last.y], [x, y], i / count);
        points.push({ x: p[0], y: p[1], d: last.d + (step * i) / count });
      }
      return;
    }
    points.push({ x, y, d: last.d + step });
  });
  return points;
};

const cache = {};

// The letter with everything needed to draw and check it, or null if it is not known.
export const glyphFor = (unit) => {
  const key = String(unit || '').toUpperCase().replace(/[‘’ʻ`]/g, "'");
  if (cache[key]) return cache[key];
  const letter = LATIN[key] || CYRILLIC[key] || DIGRAPHS[key];
  if (!letter) return null;
  const strokes = letter.s.map((stroke) => {
    const points = sampleStroke(stroke.segs);
    const isDot = stroke.segs.length === 1 && stroke.segs[0].t === 'D';
    return { d: pathOf(stroke.segs), points, length: points[points.length - 1].d, isDot };
  });
  cache[key] = { key, w: letter.w, strokes };
  return cache[key];
};

// Where along a stroke (0..1) a point lies, and which way the stroke goes there.
export const pointAlong = (stroke, fraction) => {
  const target = stroke.length * Math.max(0, Math.min(1, fraction));
  const points = stroke.points;
  let i = 1;
  while (i < points.length - 1 && points[i].d < target) i += 1;
  const a = points[i - 1];
  const b = points[i] || a;
  return { x: b.x, y: b.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
};

export const KNOWN_LETTERS = [...Object.keys(LATIN), ...Object.keys(CYRILLIC), ...Object.keys(DIGRAPHS)];

// ---------- letters side by side (a syllable tile, a word) ----------
const splitUnit = (unit) => String(unit || '').toUpperCase().replace(/[‘’ʻ`]/g, "'").match(/.'?/gu) || [];

// A dot or a little tick above the letter, not a part of its body.
const isMark = (stroke) => stroke.points.every((point) => point.y < 4) || (stroke.length < 34 && stroke.points.every((point) => point.y < 20));

// Where a living letter's eyes go: on the top of the letter, near its middle,
// preferring the first stroke (usually the main stem).
const eyesFor = (parts, width) => {
  const points = [];
  parts.forEach((part, partIndex) => {
    if (!part.glyph) {
      points.push({ x: part.x + part.w / 2, y: 10, first: partIndex === 0 });
      return;
    }
    part.glyph.strokes.forEach((stroke, strokeIndex) => {
      if (isMark(stroke)) return;
      stroke.points.forEach((point) => points.push({ x: part.x + point.x, y: point.y, first: partIndex === 0 && strokeIndex === 0 }));
    });
  });
  if (!points.length) return { x: width / 2, y: 10 };
  const nearestMiddle = (candidates) => candidates.reduce((best, point) => {
    const score = Math.abs(point.x - width / 2) - (point.first ? 12 : 0);
    return !best || score < best.score ? { ...point, score } : best;
  }, null);
  const top = Math.min(...points.map((point) => point.y));
  const eyes = nearestMiddle(points.filter((point) => point.y <= top + 6));
  // the dots of Ё (or a breve right above) would hide under the eyes: the face moves to the middle
  const marks = parts.flatMap((part) => (part.glyph ? part.glyph.strokes.filter(isMark).map((stroke) => ({ x: part.x + stroke.points[0].x, y: stroke.points[0].y })) : []));
  if (marks.some((mark) => Math.abs(mark.x - eyes.x) < 26 && mark.y < eyes.y + 4)) {
    const middle = nearestMiddle(points.filter((point) => point.y >= 48 && point.y <= 66));
    if (middle) return { x: middle.x, y: middle.y };
  }
  return { x: eyes.x, y: top };
};

const rowCache = {};

// One unit drawn as letters in a row: the unit itself if it is a known letter (Uzbek SH too),
// otherwise each of its letters. Unknown signs keep a place and are drawn as text.
export const glyphRow = (unit, gap = 12) => {
  const key = String(unit || '');
  if (rowCache[key]) return rowCache[key];
  const pieces = glyphFor(key) ? [key] : splitUnit(key);
  let x = 0;
  const parts = pieces.map((piece) => {
    const glyph = glyphFor(piece);
    const strokes = glyph ? glyph.strokes : [];
    const part = {
      key: piece,
      glyph,
      x,
      w: glyph ? glyph.w : 64,
      d: strokes.filter((stroke) => !isMark(stroke)).map((stroke) => stroke.d).join(''),
      marks: strokes.filter(isMark).map((stroke) => stroke.d).join('')
    };
    x += part.w + gap;
    return part;
  });
  const w = Math.max(1, x - gap);
  const ys = parts.flatMap((part) => (part.glyph ? part.glyph.strokes.flatMap((stroke) => stroke.points.map((point) => point.y)) : [10, 110]));
  rowCache[key] = { key, parts, w, eyes: eyesFor(parts, w), minY: Math.min(10, ...ys), maxY: Math.max(110, ...ys) };
  return rowCache[key];
};

// The height a set of living letters needs, so letters with dots or tails share one baseline.
export const rowExtent = (units) => {
  const rows = (units || []).map((unit) => glyphRow(unit));
  const minY = Math.min(10, ...rows.map((row) => row.minY));
  const maxY = Math.max(110, ...rows.map((row) => row.maxY));
  return { top: Math.min(minY - 16, -4), bottom: maxY + 24 };
};
