require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomBytes } = require('crypto');
const pool = require('./db');
const { translations } = require('./data/wordCatalog');
const { SpeechService } = require('./services/speechService');

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const IS_ADMIN_AUTH_ENABLED = Boolean(ADMIN_PASSWORD);
// a full voice pack for four languages is a few thousand short phrases
const TTS_CACHE_MAX_ENTRIES = Number(process.env.TTS_CACHE_MAX_ENTRIES || 20000);
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

app.get('/api/users', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const result = await pool.query('SELECT id, username, score FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    logAndReplyServerError(res, 'users-list', err);
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
