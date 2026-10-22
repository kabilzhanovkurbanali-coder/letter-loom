#!/usr/bin/env node
// Finds every Kyrgyz and Uzbek text in the code, and puts corrected texts back in place.
//
//   node tools/translations/strings.js extract > texts.json
//   node tools/translations/strings.js apply corrections.json
//
// A text is any string under a KG / UZ key of an object that also has an RU key
// (game texts, the word catalog, letter names...), plus the KG_ENTRIES / UZ_ENTRIES syllable lists.
// Every text gets a stable id (file + path), so a corrected sheet can be applied even after the
// code around it moved. A correction is skipped when the original text in the code has changed.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const { parse } = require(path.join(ROOT, 'frontend', 'node_modules', '@babel', 'parser'));

const LANGS = ['KG', 'UZ'];
const SOURCES = [
  // demo.js only holds children's names, which are not translations
  ...walk(path.join(ROOT, 'frontend', 'src')).filter((file) => /\.js$/.test(file) && !/\.test\.js$|setupTests|reportWebVitals|lib\/demo\.js/.test(file)),
  path.join(ROOT, 'backend', 'data', 'wordCatalog.js')
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const parseFile = (file) => parse(fs.readFileSync(file, 'utf8'), {
  sourceType: /backend/.test(file) ? 'script' : 'module',
  plugins: ['jsx'],
  errorRecovery: true
});

const keyName = (property) => {
  if (!property || property.type !== 'ObjectProperty') return null;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'StringLiteral') return property.key.value;
  if (property.key.type === 'NumericLiteral') return String(property.key.value);
  return null;
};

const PICTURES = (() => {
  const source = fs.readFileSync(path.join(ROOT, 'frontend', 'src', 'data', 'pictures.js'), 'utf8');
  return new Set((source.match(/'[a-z_]+'/g) || []).map((item) => item.slice(1, -1)));
})();

// A string-like node: plain string, or a template whose ${...} parts become {...} placeholders.
const textOf = (node, code) => {
  if (node.type === 'StringLiteral') return { kind: 'string', text: node.value };
  if (node.type === 'TemplateLiteral') {
    let text = '';
    node.quasis.forEach((quasi, index) => {
      text += quasi.value.cooked;
      if (node.expressions[index]) text += `{${code.slice(node.expressions[index].start, node.expressions[index].end)}}`;
    });
    return { kind: 'template', text };
  }
  return null;
};

const CHILD_SKIP = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'range']);

// Walks any node and calls `visit(node, path)` for every node, with a readable path.
function traverse(node, segments, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, segments);
  if (node.type === 'ObjectExpression') {
    node.properties.forEach((property) => {
      const name = keyName(property);
      traverse(property.value || property.argument, [...segments, name || '?'], visit);
    });
    return;
  }
  if (node.type === 'ArrayExpression') {
    node.elements.forEach((element, index) => traverse(element, [...segments, index], visit));
    return;
  }
  if (node.type === 'VariableDeclarator') {
    traverse(node.init, [...segments, node.id.name || '?'], visit);
    return;
  }
  if (node.type === 'FunctionDeclaration') {
    traverse(node.body, [...segments, `${node.id ? node.id.name : 'fn'}()`], visit);
    return;
  }
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    traverse(node.body, [...segments, '()'], visit);
    return;
  }
  Object.keys(node).forEach((key) => {
    if (CHILD_SKIP.has(key)) return;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((item) => traverse(item, segments, visit));
    else if (child && typeof child.type === 'string') traverse(child, segments, visit);
  });
}

const formatPath = (segments) => segments.reduce((out, segment) => (
  typeof segment === 'number' ? `${out}[${segment}]` : (out ? `${out}.${segment}` : String(segment))
), '');

// Strings inside a subtree, each with its path relative to the subtree.
function leaves(node, code, relative = [], out = []) {
  if (!node) return out;
  const text = textOf(node, code);
  if (text) {
    out.push({ node, relative, ...text });
    return out;
  }
  if (node.type === 'ArrayExpression') {
    const first = node.elements[0];
    // [picture, word] pairs (rhymes): the picture is context, not a text
    const pictureFirst = first && first.type === 'StringLiteral' && PICTURES.has(first.value) && node.elements.length >= 2;
    node.elements.forEach((element, index) => {
      if (pictureFirst && index === 0) return;
      leaves(element, code, [...relative, index], out).forEach((leaf) => {
        if (pictureFirst && !leaf.picture) {
          leaf.picture = first.value;
          leaf.pairPicture = true;
        }
      });
    });
    return out;
  }
  if (node.type === 'ObjectExpression') {
    node.properties.forEach((property) => leaves(property.value, code, [...relative, keyName(property) || '?'], out));
    return out;
  }
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') return leaves(node.body, code, [...relative, '()'], out);
  if (node.type === 'ConditionalExpression') {
    leaves(node.consequent, code, [...relative, '?'], out);
    leaves(node.alternate, code, [...relative, ':'], out);
    return out;
  }
  if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    leaves(node.left, code, [...relative, 'L'], out);
    leaves(node.right, code, [...relative, 'R'], out);
  }
  return out;
}

const subtreeAt = (node, relative) => relative.reduce((current, segment) => {
  if (!current) return null;
  if (current.type === 'ArrayExpression' && typeof segment === 'number') return current.elements[segment] || null;
  if (current.type === 'ObjectExpression') {
    const property = current.properties.find((item) => keyName(item) === segment);
    return property ? property.value : null;
  }
  if ((current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') && segment === '()') return current.body;
  if (current.type === 'ConditionalExpression') return segment === '?' ? current.consequent : segment === ':' ? current.alternate : null;
  if (current.type === 'BinaryExpression' || current.type === 'LogicalExpression') return segment === 'L' ? current.left : segment === 'R' ? current.right : null;
  return null;
}, node);

// The Russian text that means the same thing: same path in the RU subtree, else the whole
// nearest RU part (for texts whose structure differs between languages).
function russianFor(ruNode, relative, code) {
  const exact = subtreeAt(ruNode, relative);
  const exactText = exact && textOf(exact, code);
  if (exactText) return exactText.text;
  for (let cut = relative.length - 1; cut >= 0; cut -= 1) {
    const near = subtreeAt(ruNode, relative.slice(0, cut));
    if (near) {
      const texts = leaves(near, code).map((leaf) => leaf.text);
      if (texts.length && texts.length <= 6) return texts.join(' / ');
      return '';
    }
  }
  return '';
}

// Where a text appears, in words a teacher understands.
const SCREENS = {
  'MainMenu.js': 'Главное меню', 'WordGame.js': 'Собери слово / Слоги', 'wordCatalog.js': 'Слова к картинкам',
  'approvedSyllables.js': 'Слова по слогам', 'letters.js': 'Названия букв', 'SpeakGame.js': 'Речь: повтори звук, по слогам, свечки',
  'ListenGame.js': 'Слушаем: хлопки, рифмы, угадай слово, первый звук', 'ArticGame.js': 'Зарядка язычка', 'MathGame.js': 'Счёт',
  'LogicGame.js': 'Логика', 'MemoryGame.js': 'Память', 'ColoringGame.js': 'Раскраска', 'AlphabetBook.js': 'Азбука',
  'AlbumScreen.js': 'Альбом', 'GiftModal.js': 'Подарок от Ирби', 'rewards.js': 'Альбом: друзья и награды',
  'SettingsScreen.js': 'Настройки', 'App.js': 'Сообщения', 'TeacherPanel.js': 'Режим учителя'
};
const ORDER = Object.keys(SCREENS);
const screenOf = (item) => SCREENS[path.basename(item.file)] || path.basename(item.file);
const ADULT_KEYS = /\.(adults|adminTitle|login|password|enter|teacher|gateAsk|serverAdmin|switchKid|admin|reset|resetAsk|yes|cancel|done|logout|progressReset|serverError)\b/;
const audienceOf = (item) => (/TeacherPanel/.test(item.file) || ADULT_KEYS.test(item.id) ? 'взрослый' : 'ребёнок');
const screenRank = (item) => {
  const index = ORDER.indexOf(path.basename(item.file));
  return (item.audience === 'взрослый' ? 100 : 0) + (index < 0 ? 50 : index);
};

function extract() {
  const items = [];
  const catalogRu = {};
  SOURCES.forEach((file) => {
    const code = fs.readFileSync(file, 'utf8');
    const ast = parseFile(file);
    const rel = path.relative(ROOT, file);
    const entries = {};
    traverse(ast.program, [], (node, segments) => {
      if (node.type === 'ObjectExpression') {
        const props = Object.fromEntries(node.properties.map((property) => [keyName(property), property]));
        if (!props.RU || !LANGS.some((lang) => props[lang])) return;
        const image = props.image && props.image.value.type === 'StringLiteral' ? props.image.value.value : null;
        if (image && props.RU.value.type === 'StringLiteral') catalogRu[image] = props.RU.value.value;
        LANGS.forEach((lang) => {
          if (!props[lang]) return;
          leaves(props[lang].value, code).forEach((leaf) => {
            if (!leaf.text.trim() || !/\p{L}/u.test(leaf.text)) return;
            const id = `${rel}#${formatPath([...segments, lang, ...leaf.relative])}`;
            // the alphabets themselves (letter tiles, menu balloons) are letters, not texts to translate
            if (/ALPHABET_UNITS|SKY_LETTERS/.test(id)) return;
            items.push({
              id, lang, file: rel, kind: leaf.kind, text: leaf.text,
              // a word paired with a picture means that picture, whatever the RU list holds at that place
              ru: leaf.pairPicture ? '' : russianFor(props.RU.value, leaf.relative, code),
              picture: image || leaf.picture || null,
              line: leaf.node.loc.start.line
            });
          });
        });
      }
      // syllable lists: const KG_ENTRIES = [['АЛ-МА', 'apple', ['АЛ', 'МА']], ...]
      if (node.type === 'VariableDeclarator' && /^(KG|UZ|RU)_ENTRIES$/.test(node.id.name || '') && node.init?.type === 'ArrayExpression') {
        const lang = node.id.name.slice(0, 2);
        entries[lang] = node.init.elements;
      }
    });
    Object.entries(entries).forEach(([lang, list]) => {
      if (!LANGS.includes(lang)) return;
      const russian = Object.fromEntries((entries.RU || []).map((entry) => [entry.elements[1]?.value, entry.elements[0]?.value]));
      list.forEach((entry, index) => {
        const [word, picture] = entry.elements;
        if (word?.type !== 'StringLiteral') return;
        items.push({
          id: `${rel}#${lang}_ENTRIES[${index}]`, lang, file: rel, kind: 'syllables', text: word.value,
          ru: russian[picture?.value] || '', picture: picture?.value || null, line: word.loc.start.line
        });
      });
    });
  });
  // words without a Russian sibling (rhymes, syllables) get the catalog word for their picture
  items.forEach((item) => {
    if (!item.ru && item.picture && catalogRu[item.picture]) item.ru = catalogRu[item.picture].toLowerCase();
  });
  items.forEach((item) => {
    item.screen = screenOf(item);
    item.audience = audienceOf(item);
  });
  const seen = new Map();
  items.forEach((item) => {
    const count = seen.get(item.id) || 0;
    seen.set(item.id, count + 1);
    if (count) item.id = `${item.id}#${count + 1}`;
  });
  return items.sort((a, b) => a.lang.localeCompare(b.lang) || screenRank(a) - screenRank(b) || a.line - b.line);
}

// ---------- apply ----------
const APOSTROPHES = /[‘’ʻʼ'`´]/g;
const placeholders = (text) => (text.match(/\{[^}]*\}/g) || []).sort().join('|');

// Keep the conventions of the original: its apostrophe and its letter case.
function normalize(original, corrected) {
  let text = corrected.trim().replace(/\s+/g, ' ');
  const apostrophe = (original.match(APOSTROPHES) || [])[0] || (/^[A-Z‘'’ʻ -]+$/.test(original) ? "'" : '‘');
  text = text.replace(APOSTROPHES, apostrophe);
  if (original === original.toUpperCase() && original !== original.toLowerCase()) text = text.toUpperCase();
  return text;
}

const jsString = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const jsTemplate = (text) => '`' + text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\{([^}]*)\}/g, '${$1}') + '`';

function apply(correctionsFile) {
  const corrections = JSON.parse(fs.readFileSync(correctionsFile, 'utf8'));
  const report = { applied: [], skipped: [] };
  const byFile = {};
  const current = Object.fromEntries(extract().map((item) => [item.id, item]));
  corrections.forEach((correction) => {
    const item = current[correction.id];
    if (!item) return report.skipped.push(`${correction.id}: not found any more`);
    if (item.text !== correction.original) return report.skipped.push(`${correction.id}: the code now says «${item.text}», not «${correction.original}»`);
    const text = normalize(item.text, correction.text);
    if (!text || text === item.text) return undefined;
    if (placeholders(text) !== placeholders(item.text)) return report.skipped.push(`${correction.id}: keep the {…} parts as they are («${correction.text}»)`);
    (byFile[item.file] = byFile[item.file] || []).push({ item, text });
    return undefined;
  });

  Object.entries(byFile).forEach(([rel, list]) => {
    const file = path.join(ROOT, rel);
    let code = fs.readFileSync(file, 'utf8');
    const ast = parseFile(file);
    const edits = [];
    // find each text's node again by walking the same way extract() does
    const nodesById = {};
    traverse(ast.program, [], (node, segments) => {
      if (node.type === 'ObjectExpression') {
        const props = Object.fromEntries(node.properties.map((property) => [keyName(property), property]));
        if (!props.RU) return;
        LANGS.forEach((lang) => {
          if (!props[lang]) return;
          leaves(props[lang].value, code).forEach((leaf) => {
            const id = `${rel}#${formatPath([...segments, lang, ...leaf.relative])}`;
            (nodesById[id] = nodesById[id] || []).push(leaf.node);
          });
        });
      }
      if (node.type === 'VariableDeclarator' && /^(KG|UZ)_ENTRIES$/.test(node.id.name || '') && node.init?.type === 'ArrayExpression') {
        node.init.elements.forEach((entry, index) => {
          nodesById[`${rel}#${node.id.name}[${index}]`] = [entry];
        });
      }
    });
    list.forEach(({ item, text }) => {
      const [, base, copy] = /^(.*?)(?:#(\d+))?$/.exec(item.id.slice(rel.length + 1));
      const node = (nodesById[`${rel}#${base}`] || [])[copy ? Number(copy) - 1 : 0];
      if (!node) return report.skipped.push(`${item.id}: could not find it in the code`);
      if (item.kind === 'syllables') {
        // the word and its syllables change together: 'AL-MA' → ['AL', 'MA']
        const [word, , units] = node.elements;
        edits.push({ start: word.start, end: word.end, value: jsString(text) });
        if (units?.type === 'ArrayExpression') edits.push({ start: units.start, end: units.end, value: `[${text.split('-').map(jsString).join(', ')}]` });
      } else {
        edits.push({ start: node.start, end: node.end, value: node.type === 'TemplateLiteral' ? jsTemplate(text) : jsString(text) });
      }
      report.applied.push(`${item.id}: «${item.text}» → «${text}»`);
      return undefined;
    });
    edits.sort((a, b) => b.start - a.start).forEach((edit) => {
      code = code.slice(0, edit.start) + edit.value + code.slice(edit.end);
    });
    fs.writeFileSync(file, code);
  });
  return report;
}

const [command, argument] = process.argv.slice(2);
if (command === 'extract') {
  process.stdout.write(JSON.stringify(extract(), null, 1));
} else if (command === 'apply' && argument) {
  const report = apply(argument);
  console.log(`applied ${report.applied.length}, skipped ${report.skipped.length}`);
  report.applied.forEach((line) => console.log(`  + ${line}`));
  report.skipped.forEach((line) => console.log(`  ! ${line}`));
} else {
  console.error('usage: strings.js extract > texts.json | strings.js apply corrections.json');
  process.exit(1);
}
