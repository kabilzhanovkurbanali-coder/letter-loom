import { LETTER_NAME_MAPS } from './letters';

// What the voice service is asked to say: a lone letter tile becomes its name ("ка"), and words
// are lower-cased, so each word is spoken (and recorded) once whatever its case on screen.
export const remoteSpeechText = (text, { kind = 'text', lang } = {}) => {
  const words = String(text || '').trim().replaceAll('-', ' ').replace(/\s+/g, ' ').trim();
  if (!words) return '';

  const isSingleChar = !words.includes(' ') && words.length === 1;
  const isLatinOnly = /^[A-Z]+(?: [A-Z]+)*$/i.test(words);
  const isCyrillicOnly = /^[Ѐ-ӿ]+(?: [Ѐ-ӿ]+)*$/i.test(words);

  if (kind === 'token') {
    const name = LETTER_NAME_MAPS[lang]?.[words.toUpperCase()];
    if (name) return name.toLowerCase();
    if (isSingleChar) return words.toLowerCase();
  }
  if (lang === 'UZ') return words.toLowerCase();
  if ((lang === 'KG' || lang === 'RU') && isCyrillicOnly) return words.toLowerCase();
  if (lang === 'EN' && isLatinOnly) return words.toLowerCase();
  return words;
};

// A short stable file name for the recording of a text (cyrb53), the same in the game and in the
// script that copies the recordings to the website.
export const voiceKey = (text) => {
  const str = String(text || '');
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};
