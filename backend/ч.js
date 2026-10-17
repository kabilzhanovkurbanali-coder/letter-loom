require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');
const pool = require('./db');
const { translations } = require('./data/wordCatalog');
const { SpeechService } = require('./services/speechService');

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const HASH_PREFIX = 'scrypt';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const IS_ADMIN_AUTH_ENABLED = Boolean(ADMIN_PASSWORD);
// a full voice pack for four languages is a few thousand short phrases
const TTS_CACHE_MAX_ENTRIES = Number(process.env.TTS_CACHE_MAX_ENTRIES || 20000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';
const OPENAI_TTS_FORMAT = process.env.OPENAI_TTS_FORMAT || 'mp3';
const EDGE_TTS_PYTHON_BIN = process.env.EDGE_TTS_PYTHON_BIN || 'python3';
const EDGE_TTS_REQUEST_TIMEOUT_MS = Number(process.env.EDGE_TTS_REQUEST_TIMEOUT_MS || 30000);
const EDGE_VOICE_EN = process.env.EDGE_VOICE_EN || 'en-US-EmmaNeural';
const EDGE_VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const EDGE_VOICE_KG = process.env.EDGE_VOICE_KG || 'kk-KZ-AigulNeural';
const EDGE_VOICE_UZ = process.env.EDGE_VOICE_UZ || 'uz-UZ-MadinaNeural';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_BASE_URL = process.env.ELEVENLABS_API_BASE_URL || 'https://api.elevenlabs.io';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
const ELEVENLABS_OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
const ELEVEN_VOICE_STABILITY = process.env.ELEVEN_VOICE_STABILITY || '0.58';
const ELEVEN_VOICE_SIMILARITY_BOOST = process.env.ELEVEN_VOICE_SIMILARITY_BOOST || '0.72';
const ELEVEN_VOICE_STYLE = process.env.ELEVEN_VOICE_STYLE || '0.28';
const ELEVEN_VOICE_SPEAKER_BOOST = process.env.ELEVEN_VOICE_SPEAKER_BOOST || 'true';
const ELEVENLABS_VOICE_EN = process.env.ELEVENLABS_VOICE_EN || '';
const ELEVENLABS_VOICE_RU = process.env.ELEVENLABS_VOICE_RU || '';
const ELEVENLABS_VOICE_KG = process.env.ELEVENLABS_VOICE_KG || '';
const ELEVENLABS_VOICE_UZ = process.env.ELEVENLABS_VOICE_UZ || '';
const TTS_LANG_PROVIDER_MAP = process.env.TTS_LANG_PROVIDER_MAP || 'EN:eleven,RU:eleven,KG:eleven,UZ:openai';
const adminTokens = new Set();
const TTS_CACHE_DIR = path.join(__dirname, '.cache', 'tts');
const EDGE_TTS_SCRIPT_PATH = path.join(__dirname, 'tts_edge_once.py');
let httpServer = null;
let httpsServer = null;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 5443;
const CERT_DIR = path.join(__dirname, 'certs');
let isShuttingDown = false;

const speechService = new SpeechService({
  openAiApiKey: '',
  openAiTtsModel: OPENAI_TTS_MODEL,
  openAiTtsVoice: OPENAI_TTS_VOICE,
  openAiTtsFormat: OPENAI_TTS_FORMAT,
  elevenLabsApiKey: ELEVENLABS_API_KEY,
  elevenLabsApiBaseUrl: ELEVENLABS_API_BASE_URL,
  elevenLabsModelId: ELEVENLABS_MODEL_ID,
  elevenLabsOutputFormat: ELEVENLABS_OUTPUT_FORMAT,
  elevenVoiceStability: ELEVEN_VOICE_STABILITY,
  elevenVoiceSimilarityBoost: ELEVEN_VOICE_SIMILARITY_BOOST,
  elevenVoiceStyle: ELEVEN_VOICE_STYLE,
  elevenVoiceSpeakerBoost: ELEVEN_VOICE_SPEAKER_BOOST,
  elevenLabsVoiceEn: ELEVENLABS_VOICE_EN,
  elevenLabsVoiceRu: ELEVENLABS_VOICE_RU,
  elevenLabsVoiceKg: ELEVENLABS_VOICE_KG,
  elevenLabsVoiceUz: ELEVENLABS_VOICE_UZ,
  edgePythonBin: EDGE_TTS_PYTHON_BIN,
  edgeScriptPath: EDGE_TTS_SCRIPT_PATH,
  edgeRequestTimeoutMs: EDGE_TTS_REQUEST_TIMEOUT_MS,
  edgeVoiceEn: EDGE_VOICE_EN,
  edgeVoiceRu: EDGE_VOICE_RU,
  edgeVoiceKg: EDGE_VOICE_KG,
  edgeVoiceUz: EDGE_VOICE_UZ,
  langProviderMap: TTS_LANG_PROVIDER_MAP,
  cacheDir: TTS_CACHE_DIR,
  cacheMaxEntries: TTS_CACHE_MAX_ENTRIES
});

const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'build');

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '30d' }));

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${HASH_PREFIX}$${salt}$${hash}`;
};

const verifyPassword = (rawPassword, storedPassword) => {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith(`${HASH_PREFIX}$`)) {
    return rawPassword === storedPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 3) return false;

  const [, salt, hashHex] = parts;
  const storedHash = Buffer.from(hashHex, 'hex');
  const checkHash = scryptSync(rawPassword, salt, 64);

  if (storedHash.length !== checkHash.length) return false;
  return timingSafeEqual(storedHash, checkHash);
};

const initializeDatabase = async () => {
  // Create table for fresh installs and align password column with hashed format.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query('ALTER TABLE users ALTER COLUMN password TYPE TEXT');
};

const logAndReplyServerError = (res, context, err) => {
  console.error(`[${context}]`, err);
  res.status(500).json({ error: 'Ошибка сервера' });
};

const createAdminToken = () => {
  const token = randomBytes(24).toString('hex');
  adminTokens.add(token);
  return token;
};

const isValidAdminToken = (token) => Boolean(token && adminTokens.has(token));
const requireAdmin = (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    res.status(403).json({ error: 'Доступ запрещен' });
    return false;
  }
  return true;
};

const responseToError = async (response, providerName) => {
  const message = await response.text().catch(() => '');
  return new Error(`${providerName} error ${response.status}: ${message || response.statusText}`);
};

const AI_LANGUAGE_MAP = {
  EN: 'English',
  RU: 'Russian',
  KG: 'Kyrgyz',
  UZ: 'Uzbek'
};

const sanitizeAiContext = (rawContext) => {
  const context = rawContext && typeof rawContext === 'object' ? rawContext : {};
  const currentTask = context.currentTask && typeof context.currentTask === 'object' ? context.currentTask : {};

  return {
    language: ['EN', 'RU', 'KG', 'UZ'].includes(String(context.language || '').toUpperCase())
      ? String(context.language).toUpperCase()
      : 'RU',
    gameState: String(context.gameState || '').slice(0, 30),
    playMode: String(context.playMode || '').slice(0, 30),
    mathMode: String(context.mathMode || '').slice(0, 30),
    levelNumber: Number.isFinite(Number(context.levelNumber)) ? Number(context.levelNumber) : null,
    solvedCount: Number.isFinite(Number(context.solvedCount)) ? Number(context.solvedCount) : 0,
    foundCount: Number.isFinite(Number(context.foundCount)) ? Number(context.foundCount) : 0,
    totalUnits: Number.isFinite(Number(context.totalUnits)) ? Number(context.totalUnits) : 0,
    currentTask: {
      text: String(currentTask.text || '').slice(0, 80),
      maskedText: String(currentTask.maskedText || '').slice(0, 80),
      difficulty: String(currentTask.difficulty || '').slice(0, 40),
      type: String(currentTask.type || '').slice(0, 40)
    }
  };
};

const buildLocalCatReply = ({ type, context }) => {
  const byLang = {
    EN: {
      hintWord: 'Cat is here. Look at the first empty spot and say the sound softly. Then pick the matching piece.',
      hintMath: 'Cat is here. Count slowly, one by one. Then choose the answer without rushing.',
      wordHelp: 'Let us build it together. Start with the first sound, then find the next piece.',
      homework: 'Cat game at home:\n1. Count 5 toys.\n2. Find 3 letters you know.\n3. Clap the word slowly.\nFor parents: praise every small step.',
      freeform: 'Cat is with you. Let us do one small step first, then the next one.'
    },
    RU: {
      hintWord: 'Котик рядом. Посмотри на первое пустое окошко и тихо назови звук. Потом найди такой же кусочек.',
      hintMath: 'Котик рядом. Считай спокойно, по одному. Потом выбери ответ без спешки.',
      wordHelp: 'Давай соберём вместе. Сначала первый звук, потом следующий кусочек.',
      homework: 'Игра с котиком дома:\n1. Посчитай 5 игрушек.\n2. Найди 3 знакомые буквы.\n3. Хлопни слово медленно.\nДля родителя: хвалите за каждый маленький шаг.',
      freeform: 'Котик с тобой. Давай сначала сделаем один маленький шаг, а потом следующий.'
    },
    KG: {
      hintWord: 'Мышык жанында. Биринчи бош жерди кара да үндү жай айт. Анан ушуга окшош бөлүктү тап.',
      hintMath: 'Мышык жанында. Бирден жай сана. Анан шашпай жоопту танда.',
      wordHelp: 'Кел, чогуу курайлы. Адегенде биринчи үндү тап, анан кийинки бөлүктү ал.',
      homework: 'Үйдөгү мышык оюну:\n1. 5 оюнчукту сана.\n2. 3 тааныш тамганы тап.\n3. Сөздү жай кол чаап айт.\nАта-эне үчүн: ар бир кичинекей кадамды мактаңыз.',
      freeform: 'Мышык сени менен. Адегенде бир кичинекей кадам жасайлы, анан кийинкисин кылабыз.'
    },
    UZ: {
      hintWord: 'Mushuk yoningda. Avval birinchi bo`sh joyga qarab tovushni sekin ayt. Keyin mos bo`lakni top.',
      hintMath: 'Mushuk yoningda. Sekin, bittadan sana. Keyin javobni shoshmay tanla.',
      wordHelp: 'Keling, birga yig`amiz. Avval birinchi tovush, keyin keyingi bo`lak.',
      homework: 'Uyda mushuk o`yini:\n1. 5 ta o`yinchoqni sana.\n2. 3 ta tanish harfni top.\n3. So`zni sekin chapak bilan ayt.\nOta-ona uchun: har bir kichik qadamni maqtang.',
      freeform: 'Mushuk sen bilan. Avval bitta kichik qadam qilamiz, keyin keyingisini qilamiz.'
    }
  };

  const praiseByLang = {
    EN: ['Amazing job!', 'You are a star!', 'Wow, you did it!', 'So proud of you!', 'Brilliant work!'],
    RU: ['Молодец, умница!', 'Ты настоящая звёздочка!', 'Вот это да, ты справился!', 'Я так горжусь тобой!', 'Блестяще!'],
    KG: ['Азамат, сонун иш!', 'Сен чыныгы жылдызсың!', 'Укмуш, жасап чыктың!', 'Сага сыймыктанам!', 'Жарайт, баатыр!'],
    UZ: ['Barakalla, ajoyib!', 'Sen chinakam yulduzsan!', 'Voy, qoyil qoldim!', 'Senga g\'ururlanam!', 'Zo\'r ish qilding!']
  };

  const t = byLang[context.language] || byLang.RU;
  const isMath = context.gameState === 'MATH_PLAYING';
  if (type === 'praise') {
    const pool = praiseByLang[context.language] || praiseByLang.RU;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (type === 'homework') return t.homework;
  if (type === 'word_help') return isMath ? t.hintMath : t.wordHelp;
  if (type === 'hint') return isMath ? t.hintMath : t.hintWord;
  return t.freeform;
};

const buildTutorMessages = ({ type, context, message }) => {
  const responseLanguage = AI_LANGUAGE_MAP[context.language] || AI_LANGUAGE_MAP.RU;
  const typeGuide = {
    hint: 'Give one small hint for the current activity. Do not reveal the whole answer unless the child is clearly stuck.',
    word_help: 'Help the child assemble the word or syllables. Focus on the first sound, first piece, and next action.',
    homework: 'Create a tiny playful home activity with 3 short tasks.',
    praise: 'Generate ONE short (under 12 words) warm and joyful praise phrase for a child aged 4-8 who just successfully built the word shown in the context. Be specific and enthusiastic. No explanation needed, just the praise.',
    freeform: 'Answer like a warm preschool tutor with one clear next step.'
  }[type] || 'Answer like a warm preschool tutor with one clear next step.';

  const systemPrompt = [
    'You are a warm storybook cat guide inside Letter Loom.',
    `CRITICAL: You MUST answer ONLY in ${responseLanguage}. Never mix languages. Never add English words. Every single word must be in ${responseLanguage}.`,
    'Never say you are AI, a robot, a model, or an assistant.',
    'Sound like a friendly educational cartoon character for ages 4-8.',
    'Use very short sentences, simple words, and one clear next step.',
    'Start with a tiny encouraging phrase.',
    'Never shame the child.',
    'Prefer guidance over giving away the answer.',
    'Keep regular replies under 70 words.',
    'If homework is requested, return: a tiny title, 3 short tasks, and 1 short note for a parent.',
    'If the current task is about words or syllables, stay specific to the shown task.',
    'If the current task is about math, explain one action at a time: count, compare, or choose.',
    typeGuide,
    '',
    `Game context: ${JSON.stringify(context)}`
  ].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: String(message || '').trim() || 'Help me please.' }
  ];
};

const extractResponseText = (payload) => {
  // Standard chat/completions format (OpenAI, Groq, Together, Mistral, Gemini)
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (choice?.message?.content) return choice.message.content.trim();
  return '';
};

const requestAiTutorReply = async ({ type, context, message }) => {
  if (!OPENAI_API_KEY) {
    return buildLocalCatReply({ type, context, message });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OPENAI_API_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: buildTutorMessages({ type, context, message }),
        max_tokens: 120,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await responseToError(response, 'AI');
      error.statusCode = response.status;
      throw error;
    }

    const payload = await response.json();
    const reply = extractResponseText(payload);
    if (!reply) {
      throw new Error('AI returned an empty response');
    }

    return reply;
  } catch (error) {
    console.warn('[ai-tutor:fallback]', error.message || error);
    return buildLocalCatReply({ type, context, message });
  }
};

app.get('/api/words', (req, res) => {
  res.json(translations);
});

const handleSpeechRequest = async (req, res) => {
  try {
    const source = req.method === 'GET' ? req.query : req.body;
    const { text, lang, rate } = source || {};
    const { audioBuffer, contentType, provider } = await speechService.synthesize({
      text,
      lang,
      rate
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-TTS-Provider', provider || 'unknown');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    return res.send(audioBuffer);
  } catch (err) {
    const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    const message = err?.message || 'Ошибка синтеза речи';
    const isMissingProviderConfig = statusCode === 503 && /No speech provider is configured/i.test(message);
    if (isMissingProviderConfig) {
      console.warn(`[speech] ${message}`);
    } else {
      console.error('[speech]', err);
    }
    return res.status(statusCode).json({ error: message });
  }
};

app.get('/api/speech', handleSpeechRequest);
app.post('/api/speech', handleSpeechRequest);

app.post('/api/ai-tutor', async (req, res) => {
  try {
    const { type, message, context } = req.body || {};
    const normalizedType = ['hint', 'word_help', 'homework', 'praise', 'freeform'].includes(type) ? type : 'freeform';
    const normalizedMessage = String(message || '').trim().slice(0, 600);
    const safeContext = sanitizeAiContext(context);

    const reply = await requestAiTutorReply({
      type: normalizedType,
      context: safeContext,
      message: normalizedMessage
    });

    return res.json({ success: true, reply });
  } catch (err) {
    const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    console.error('[ai-tutor]', err);
    return res.status(statusCode).json({
      error: err.message || 'AI tutor is unavailable right now'
    });
  }
});

// Children sign in with just their first name: no password, nothing else stored.
const KID_NAME_PATTERN = /^[\p{L}\p{M}0-9' -]{1,24}$/u;
const normalizeKidName = (rawName) => String(rawName || '').trim().replace(/\s+/g, ' ');

app.post('/api/kid-login', async (req, res) => {
  try {
    const name = normalizeKidName(req.body?.name);
    if (!KID_NAME_PATTERN.test(name)) {
      return res.status(400).json({ error: 'invalid_name' });
    }

    const existing = await pool.query(
      'SELECT username, score FROM users WHERE LOWER(username) = LOWER($1) ORDER BY id LIMIT 1',
      [name]
    );
    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      return res.json({ success: true, username: user.username, score: user.score });
    }

    const created = await pool.query(
      'INSERT INTO users (username, password, score) VALUES ($1, $2, 0) RETURNING username, score',
      [name, '']
    );
    return res.json({ success: true, username: created.rows[0].username, score: created.rows[0].score, isNew: true });
  } catch (err) {
    logAndReplyServerError(res, 'kid-login', err);
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!IS_ADMIN_AUTH_ENABLED) {
    return res.status(503).json({ error: 'Админ-вход отключён: задайте ADMIN_PASSWORD в переменных окружения' });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный логин или пароль!' });
  }
  return res.json({ success: true, username, score: 0, isAdmin: true, adminToken: createAdminToken() });
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const userExists = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Такое имя уже занято!' });
    }

    const passwordHash = hashPassword(password);
    await pool.query('INSERT INTO users (username, password, score) VALUES ($1, $2, 0)', [username, passwordHash]);
    res.json({ success: true, message: 'Регистрация успешна!' });
  } catch (err) {
    logAndReplyServerError(res, 'register', err);
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME) {
      if (!IS_ADMIN_AUTH_ENABLED) {
        return res.status(503).json({ error: 'Админ-вход отключён: задайте ADMIN_PASSWORD в переменных окружения' });
      }
      if (password === ADMIN_PASSWORD) {
        const adminToken = createAdminToken();
        return res.json({ success: true, username, score: 0, isAdmin: true, adminToken });
      }
    }

    const userResult = await pool.query('SELECT username, password, score FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль!' });
    }

    const user = userResult.rows[0];
    const isValidPassword = verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль!' });
    }

    if (!user.password.startsWith(`${HASH_PREFIX}$`)) {
      const upgradedHash = hashPassword(password);
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [upgradedHash, username]);
    }

    res.json({ success: true, username: user.username, score: user.score, isAdmin: false });
  } catch (err) {
    logAndReplyServerError(res, 'login', err);
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }

    const userResult = await pool.query('SELECT password FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный старый пароль!' });
    }

    const currentHash = userResult.rows[0].password;
    const isValidPassword = verifyPassword(oldPassword, currentHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный старый пароль!' });
    }

    const newHash = hashPassword(newPassword);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [newHash, username]);
    res.json({ success: true });
  } catch (err) {
    logAndReplyServerError(res, 'change-password', err);
  }
});

app.post('/api/update-score', async (req, res) => {
  try {
    const { username, points } = req.body;
    const safePoints = Number(points);
    if (!Number.isFinite(safePoints) || safePoints < 0 || safePoints > 100) {
      return res.status(400).json({ error: 'Некорректные очки' });
    }

    const result = await pool.query(
      'UPDATE users SET score = score + $1 WHERE username = $2 RETURNING score',
      [safePoints, username]
    );
    if (result.rows.length > 0) {
      return res.json({ success: true, newScore: result.rows[0].score });
    }

    return res.status(404).json({ error: 'Пользователь не найден' });
  } catch (err) {
    logAndReplyServerError(res, 'update-score', err);
    return;
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, score FROM users ORDER BY score DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    logAndReplyServerError(res, 'leaderboard', err);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const result = await pool.query('SELECT id, username, score FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    logAndReplyServerError(res, 'users-list', err);
  }
});

app.post('/api/admin/users/:id/password', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const userId = Number(req.params.id);
    const { newPassword } = req.body;
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    if (!newPassword || newPassword.length < 3) {
      return res.status(400).json({ error: 'Слишком короткий пароль' });
    }

    const newHash = hashPassword(newPassword);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, username',
      [newHash, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    logAndReplyServerError(res, 'admin-change-password', err);
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    logAndReplyServerError(res, 'admin-delete-user', err);
  }
});

const fspSync = require('fs');

// Everything the tablet should keep for offline play: the 3D pictures (the app shell comes from the build).
app.get('/api/offline-manifest', (req, res) => {
  try {
    const images = fspSync.readdirSync(path.join(__dirname, 'images'))
      .filter((name) => name.endsWith('.webp'))
      .map((name) => `/images/${name}`);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ images });
  } catch (err) {
    return logAndReplyServerError(res, 'offline-manifest', err);
  }
});

if (fspSync.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
  app.get(/^(?!\/api\/|\/images\/).*$/, (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
}

// Tablets only allow the microphone and offline mode on https. When certs/key.pem and certs/cert.pem
// exist (see scripts/make-cert.sh), the same app is also served over https on HTTPS_PORT.
const startHttpsServer = () => {
  const keyPath = path.join(CERT_DIR, 'key.pem');
  const certPath = path.join(CERT_DIR, 'cert.pem');
  if (!fspSync.existsSync(keyPath) || !fspSync.existsSync(certPath)) return;
  try {
    const https = require('https');
    httpsServer = https.createServer({ key: fspSync.readFileSync(keyPath), cert: fspSync.readFileSync(certPath) }, app);
    httpsServer.listen(HTTPS_PORT, () => console.log(`[https] Сервер также доступен по https на порту ${HTTPS_PORT}`));
  } catch (err) {
    console.error('[https] Не удалось запустить https:', err.message);
  }
};

const startServer = async () => {
  try {
    await initializeDatabase();
    httpServer = app.listen(PORT, () => {
      const speechInfo = speechService.getRuntimeInfo();
      console.log(`Сервер запущен на ${BASE_URL}`);
      console.log('База данных Bobr kurwa успешно подключена');
      console.log(`[TTS] Provider order: ${speechInfo.providerOrder}`);
      console.log(`[TTS] Lang map: EN=${speechInfo.langProviderMap.EN}, RU=${speechInfo.langProviderMap.RU}, KG=${speechInfo.langProviderMap.KG}, UZ=${speechInfo.langProviderMap.UZ}`);
      console.log(`[TTS] OpenAI: ${speechInfo.openAiConfigured ? `configured (${speechInfo.openAiModel}, voice=${speechInfo.openAiVoice}, format=${speechInfo.openAiFormat})` : 'not configured'}`);
      console.log(`[TTS] ElevenLabs: ${speechInfo.elevenConfigured ? `configured (${speechInfo.elevenModel})` : 'not configured'}`);
      console.log(`[TTS] Edge: ${speechInfo.edgeConfigured ? 'configured' : 'not configured'}`);
      console.log(`[AI] Tutor: ${OPENAI_API_KEY ? `enabled (${OPENAI_MODEL})` : 'disabled, set OPENAI_API_KEY'}`);
      if (!IS_ADMIN_AUTH_ENABLED) {
        console.warn('[admin] ADMIN_PASSWORD не задан, админ-вход отключён');
      }
    });
    startHttpsServer();
  } catch (err) {
    console.error('Ошибка подключения к БД:', err.message);
    process.exit(1);
  }
};

const shutdownWorker = () => {
  speechService.shutdown();
};

const stopServer = (signalName) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.warn(`[process] ${signalName} received, stopping backend gracefully`);
  shutdownWorker();
  httpsServer?.close();

  if (!httpServer) {
    process.exit(0);
    return;
  }

  httpServer.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[process] graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 4000).unref();
};

process.on('exit', shutdownWorker);
process.on('SIGINT', () => {
  stopServer('SIGINT');
});
process.on('SIGTERM', () => {
  stopServer('SIGTERM');
});
process.on('SIGHUP', () => {
  console.warn('[process] SIGHUP received, backend will stay alive');
});
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandledRejection', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[process] uncaughtException', error);
});

startServer();
