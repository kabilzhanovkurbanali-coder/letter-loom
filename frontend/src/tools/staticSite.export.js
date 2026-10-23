/**
 * Files for the website copy of the game (GitHub Pages, no server): the word catalog, the pictures,
 * and the voice recordings the server has already made, renamed so the game finds them.
 *
 *   STATIC_OUT=<folder> npx react-scripts test --watchAll=false --testMatch '**' + '/src/tools/*.export.js'
 *
 * Not a test: it only runs when called this way. Phrases without a recording are read by the
 * device's own voice; their count is printed.
 */
import fs from 'fs';
import path from 'path';
import { approvedSyllables } from '../data/approvedSyllables';
import { allVoicePhrases } from '../lib/voicePackAll';
import { remoteSpeechText, voiceKey } from '../lib/speechText';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const BACKEND = path.join(ROOT, 'backend');
const LANGS = ['EN', 'RU', 'KG', 'UZ'];
// as in App: each language's voice is a touch faster or slower, and Settings add ±0.16
const RATE_OFFSET = { EN: 0.02, RU: 0, KG: -0.02, UZ: -0.01 };
const SPEED_DELTAS = [0, -0.16, 0.16];

const readEnv = (file) => {
  const env = {};
  if (!fs.existsSync(file)) return env;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line) => {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
  return env;
};

// the speeds the server may have recorded a phrase at: the game's rate, clamped like the server does
const speedsFor = (lang, rate) => {
  const base = Number.isFinite(rate) ? rate : 1 + RATE_OFFSET[lang];
  return Array.from(new Set(SPEED_DELTAS.map((delta) => {
    const sent = Number(String(Math.max(0.68, Math.min(1.28, base + delta))));
    return Math.min(1.2, Math.max(0.75, sent));
  })));
};

const run = process.env.STATIC_OUT ? test : test.skip;

run('export the website files', () => {
  const OUT = process.env.STATIC_OUT;
  const env = readEnv(path.join(BACKEND, '.env'));
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { SpeechService } = require(path.join(BACKEND, 'services', 'speechService.js'));
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { translations } = require(path.join(BACKEND, 'data', 'wordCatalog.js'));
  const cacheDir = path.join(BACKEND, '.cache', 'tts');
  // the same settings the server uses, so the recordings' names come out the same
  const speech = new SpeechService({
    openAiTtsModel: env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
    openAiTtsVoice: env.OPENAI_TTS_VOICE || 'alloy',
    openAiTtsFormat: env.OPENAI_TTS_FORMAT || 'mp3',
    elevenLabsModelId: env.ELEVENLABS_MODEL_ID || 'eleven_v3',
    elevenLabsOutputFormat: env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128',
    elevenLabsVoiceEn: env.ELEVENLABS_VOICE_EN || '',
    elevenLabsVoiceRu: env.ELEVENLABS_VOICE_RU || '',
    elevenLabsVoiceKg: env.ELEVENLABS_VOICE_KG || '',
    elevenLabsVoiceUz: env.ELEVENLABS_VOICE_UZ || '',
    edgeVoiceEn: env.EDGE_VOICE_EN || 'en-US-EmmaNeural',
    edgeVoiceRu: env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural',
    edgeVoiceKg: env.EDGE_VOICE_KG || 'kk-KZ-AigulNeural',
    edgeVoiceUz: env.EDGE_VOICE_UZ || 'uz-UZ-MadinaNeural',
    langProviderMap: env.TTS_LANG_PROVIDER_MAP || 'EN:eleven,RU:eleven,KG:eleven,UZ:openai'
  });

  fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'words.json'), JSON.stringify(translations));
  const pictures = fs.readdirSync(path.join(BACKEND, 'images')).filter((name) => name.endsWith('.webp'));
  pictures.forEach((name) => fs.copyFileSync(path.join(BACKEND, 'images', name), path.join(OUT, 'images', name)));

  const report = {};
  LANGS.forEach((lang) => {
    const dir = path.join(OUT, 'voice', lang);
    fs.mkdirSync(dir, { recursive: true });
    const phrases = allVoicePhrases(lang, { words: translations[lang] || [], syllables: approvedSyllables[lang] || [] });
    const found = new Set();
    const missing = [];
    phrases.forEach(({ text, options }) => {
      const spoken = remoteSpeechText(text, { kind: options.kind, lang });
      if (!spoken) return;
      const key = voiceKey(spoken);
      if (found.has(key)) return;
      let source = null;
      ['eleven', 'edge', 'openai'].some((provider) => speedsFor(lang, options.rate).some((speed) => {
        const meta = path.join(cacheDir, `${speech.getCacheKey({ provider, text: spoken, lang, speed })}.json`);
        if (!fs.existsSync(meta)) return false;
        const audio = path.join(cacheDir, JSON.parse(fs.readFileSync(meta, 'utf8')).audioFile || '');
        if (!fs.existsSync(audio)) return false;
        source = audio;
        return true;
      }));
      if (!source) {
        missing.push(spoken);
        return;
      }
      fs.copyFileSync(source, path.join(dir, `${key}.mp3`));
      found.add(key);
    });
    fs.writeFileSync(path.join(OUT, 'voice', `${lang}.json`), JSON.stringify(Array.from(found).sort()));
    fs.writeFileSync(path.join(OUT, '..', `missing-voice-${lang}.txt`), missing.join('\n'));
    report[lang] = { phrases: phrases.length, recorded: found.size, missing: missing.length };
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ pictures: pictures.length, ...report }, null, 1));
});
