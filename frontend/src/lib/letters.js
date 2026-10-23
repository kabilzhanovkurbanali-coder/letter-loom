// Spoken names of letters, so a lone tile is read as its name ("ка"), not as a stray sound.
export const LETTER_NAME_MAPS = {
  EN: {
    A: 'ay',
    B: 'bee',
    C: 'see',
    D: 'dee',
    E: 'ee',
    F: 'ef',
    G: 'gee',
    H: 'aitch',
    I: 'eye',
    J: 'jay',
    K: 'kay',
    L: 'el',
    M: 'em',
    N: 'en',
    O: 'oh',
    P: 'pee',
    Q: 'cue',
    R: 'ar',
    S: 'ess',
    T: 'tee',
    U: 'you',
    V: 'vee',
    W: 'double u',
    X: 'ex',
    Y: 'why',
    Z: 'zee'
  },
  RU: {
    А: 'а',
    Б: 'бэ',
    В: 'вэ',
    Г: 'гэ',
    Д: 'дэ',
    Е: 'е',
    Ё: 'ё',
    Ж: 'жэ',
    З: 'зэ',
    И: 'и',
    Й: 'й',
    К: 'ка',
    Л: 'эл',
    М: 'эм',
    Н: 'эн',
    О: 'о',
    П: 'пэ',
    Р: 'эр',
    С: 'эс',
    Т: 'тэ',
    У: 'у',
    Ф: 'эф',
    Х: 'ха',
    Ц: 'це',
    Ч: 'чэ',
    Ш: 'ша',
    Щ: 'ща',
    Ъ: 'твёрдый знак',
    Ы: 'ы',
    Ь: 'мягкий знак',
    Э: 'э',
    Ю: 'ю',
    Я: 'я'
  },
  KG: {
    А: 'а',
    Б: 'бэ',
    В: 'вэ',
    Г: 'гэ',
    Д: 'дэ',
    Е: 'е',
    Ё: 'йо',
    Ж: 'жэ',
    З: 'зэ',
    И: 'и',
    Й: 'й',
    К: 'ка',
    Л: 'эл',
    М: 'эм',
    Н: 'эн',
    Ң: 'ң',
    О: 'о',
    Ө: 'ө',
    П: 'пэ',
    Р: 'эр',
    С: 'эс',
    Т: 'тэ',
    У: 'у',
    Ү: 'ү',
    Ф: 'эф',
    Х: 'ха',
    Ц: 'це',
    Ч: 'чэ',
    Ш: 'ша',
    Ы: 'ы',
    Э: 'э',
    Ю: 'йу',
    Я: 'йа',
    Щ: 'ща',
    Ъ: 'ажыратуу белгиси',
    Ь: 'ичкертүү белгиси'
  },
  UZ: {
    A: 'a',
    B: 'be',
    C: 'se',
    D: 'de',
    E: 'e',
    F: 'ef',
    G: 'ge',
    H: 'ha',
    I: 'i',
    J: 'je',
    K: 'ka',
    L: 'el',
    M: 'em',
    N: 'en',
    O: 'o',
    P: 'pe',
    Q: 'qe',
    R: 'er',
    S: 'es',
    T: 'te',
    U: 'u',
    V: 've',
    X: 'xe',
    Y: 'ye',
    Z: 'ze',
    "O'": "o'",
    "G'": "g'e",
    SH: 'she',
    CH: 'che',
    NG: 'nge'
  }
};

export const getLetterName = (lang, unit) => {
  const key = String(unit || '').toUpperCase();
  return LETTER_NAME_MAPS[lang]?.[key] || key.toLowerCase();
};

// Pool of letters used for gentle distractor tiles.
export const ALPHABET_UNITS = {
  EN: 'ABCDEFGHIJKLMNOPRSTUVWYZ'.split(''),
  RU: 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЫЭЮЯ'.split(''),
  KG: 'АБВГДЕЖЗИЙКЛМНҢОӨПРСТУҮЧШЫЭЮЯ'.split(''),
  UZ: ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', "O'", "G'", 'SH', 'CH']
};

// Every letter of each alphabet, in order, for the alphabet book.
export const FULL_ALPHABETS = {
  EN: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  RU: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split(''),
  KG: 'АБВГДЕЁЖЗИЙКЛМНҢОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split(''),
  UZ: ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', "O'", "G'", 'SH', 'CH', 'NG']
};

// What a letter sounds like, for learning to read: "ммм", not "эм".
// Sounds that can be held are stretched (ммм, ссс); short ones get a light vowel (бы),
// the way phonics apps say them. Signs without a sound keep their names.
export const LETTER_SOUND_MAPS = {
  EN: {
    A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fff', G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'lll', M: 'mmm',
    N: 'nnn', O: 'aw', P: 'puh', Q: 'kwuh', R: 'rrr', S: 'sss', T: 'tuh', U: 'uh', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz'
  },
  RU: {
    А: 'а', Б: 'бы', В: 'ввв', Г: 'гы', Д: 'ды', Е: 'е', Ё: 'ё', Ж: 'жжж', З: 'ззз', И: 'и', Й: 'йи', К: 'кы', Л: 'ллл', М: 'ммм',
    Н: 'ннн', О: 'о', П: 'пы', Р: 'ррр', С: 'ссс', Т: 'ты', У: 'у', Ф: 'ффф', Х: 'ххх', Ц: 'цы', Ч: 'чи', Ш: 'шшш', Щ: 'щщщ',
    Ъ: 'твёрдый знак', Ы: 'ы', Ь: 'мягкий знак', Э: 'э', Ю: 'ю', Я: 'я'
  },
  KG: {
    А: 'а', Б: 'бы', В: 'ввв', Г: 'гы', Д: 'ды', Е: 'е', Ё: 'ё', Ж: 'жы', З: 'ззз', И: 'и', Й: 'йы', К: 'кы', Л: 'ллл', М: 'ммм',
    Н: 'ннн', Ң: 'ңңң', О: 'о', Ө: 'ө', П: 'пы', Р: 'ррр', С: 'ссс', Т: 'ты', У: 'у', Ү: 'ү', Ф: 'ффф', Х: 'ххх', Ц: 'цы',
    Ч: 'чы', Ш: 'шшш', Щ: 'щщщ', Ъ: 'ажыратуу белгиси', Ы: 'ы', Ь: 'ичкертүү белгиси', Э: 'э', Ю: 'ю', Я: 'я'
  },
  UZ: {
    A: 'a', B: 'bi', D: 'di', E: 'e', F: 'fff', G: 'gi', H: 'hhh', I: 'i', J: 'ji', K: 'ki', L: 'lll', M: 'mmm', N: 'nnn', O: 'o',
    P: 'pi', Q: 'qi', R: 'rrr', S: 'sss', T: 'ti', U: 'u', V: 'vvv', X: 'xxx', Y: 'yi', Z: 'zzz', "O'": 'o‘', "G'": 'g‘i',
    SH: 'shshsh', CH: 'chi', NG: 'ng'
  }
};

export const getLetterSound = (lang, unit) => {
  const key = String(unit || '').toUpperCase().replace(/[‘’ʻ`]/g, "'");
  return LETTER_SOUND_MAPS[lang]?.[key] || getLetterName(lang, unit);
};

// How a letter is drawn on screen: Uzbek O' and G' get their proper turned comma.
export const displayUnit = (unit) => String(unit || '').replace(/'/g, '‘');

// A teacher setting: does Irbi say letters as sounds (for reading) or by their names?
const LETTER_MODE_KEY = 'll_letter_mode';
export const readLetterMode = () => {
  try {
    return localStorage.getItem(LETTER_MODE_KEY) === 'name' ? 'name' : 'sound';
  } catch {
    return 'sound';
  }
};
export const writeLetterMode = (mode) => {
  try {
    localStorage.setItem(LETTER_MODE_KEY, mode === 'name' ? 'name' : 'sound');
  } catch {
    // the setting lasts for this visit only
  }
};

export const SOUND_SPEECH = { kind: 'sound', rate: 0.8 };
export const NAME_SPEECH = { kind: 'token' };

// The text and speech options for one letter in the chosen mode.
export const letterSpeech = (lang, unit, mode) => (mode === 'name'
  ? { text: unit, options: NAME_SPEECH }
  : { text: getLetterSound(lang, unit), options: SOUND_SPEECH });
