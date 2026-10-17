const fsp = require('fs/promises');
const path = require('path');
const { createHash } = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const LANGUAGE_CODES = new Set(['EN', 'RU', 'KG', 'UZ']);
const PROVIDERS = new Set(['openai', 'eleven', 'edge']);
const MIME_BY_FORMAT = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  opus: 'audio/ogg'
};
const execFileAsync = promisify(execFile);
const ELEVEN_LANGUAGE_CODES = { EN: 'en', RU: 'ru', KG: 'ky', UZ: 'uz' };
// Older multilingual models reject language_code; v2.5+ and v3/v4 accept it (v3/v4 also cover Kyrgyz and Uzbek).
const ELEVEN_MODELS_WITH_LANGUAGE_CODE = /^eleven_(v3|v4|flash_v2_5|turbo_v2_5)/;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, 1);
};

class SpeechService {
  constructor(options = {}) {
    this.openAiApiKey = String(options.openAiApiKey || '').trim();
    this.openAiApiBaseUrl = String(options.openAiApiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.openAiTtsModel = options.openAiTtsModel || 'gpt-4o-mini-tts';
    this.openAiTtsVoice = options.openAiTtsVoice || 'alloy';
    this.openAiTtsFormat = options.openAiTtsFormat || 'mp3';
    this.elevenLabsApiKey = String(options.elevenLabsApiKey || '').trim();
    this.elevenLabsApiBaseUrl = String(options.elevenLabsApiBaseUrl || 'https://api.elevenlabs.io').replace(/\/$/, '');
    this.elevenLabsModelId = options.elevenLabsModelId || 'eleven_v3';
    this.elevenLabsOutputFormat = options.elevenLabsOutputFormat || 'mp3_44100_128';
    this.elevenVoiceStability = clamp01(options.elevenVoiceStability, 0.58);
    this.elevenVoiceSimilarityBoost = clamp01(options.elevenVoiceSimilarityBoost, 0.72);
    this.elevenVoiceStyle = clamp01(options.elevenVoiceStyle, 0.28);
    this.elevenVoiceSpeakerBoost = String(options.elevenVoiceSpeakerBoost || 'true') !== 'false';
    this.elevenLabsVoiceByLang = {
      EN: String(options.elevenLabsVoiceEn || '').trim(),
      RU: String(options.elevenLabsVoiceRu || '').trim(),
      KG: String(options.elevenLabsVoiceKg || '').trim(),
      UZ: String(options.elevenLabsVoiceUz || '').trim()
    };
    this.edgePythonBin = options.edgePythonBin || 'python3';
    this.edgeScriptPath = options.edgeScriptPath || '';
    this.edgeRequestTimeoutMs = Number(options.edgeRequestTimeoutMs || 30000);
    this.edgeVoiceByLang = {
      EN: String(options.edgeVoiceEn || 'en-US-EmmaNeural').trim(),
      RU: String(options.edgeVoiceRu || 'ru-RU-SvetlanaNeural').trim(),
      KG: String(options.edgeVoiceKg || 'kk-KZ-AigulNeural').trim(),
      UZ: String(options.edgeVoiceUz || 'uz-UZ-MadinaNeural').trim()
    };
    this.langProviderMap = this.parseLangProviderMap(options.langProviderMap);
    this.cacheDir = options.cacheDir;
    this.cacheMaxEntries = Number(options.cacheMaxEntries || 800);
    this.memoryCache = new Map();
    this.inflightCache = new Map();
    // Очередь для ElevenLabs: не более 1 запроса одновременно (free plan = 2, берём 1 с запасом)
    this._elevenQueue = Promise.resolve();
  }

  parseLangProviderMap(rawMap) {
    const defaults = {
      EN: 'eleven',
      RU: 'eleven',
      KG: 'eleven',
      UZ: 'eleven'
    };
    const result = { ...defaults };
    const source = String(rawMap || '').trim();
    if (!source) return result;

    source.split(',').forEach((part) => {
      const [langRaw, providerRaw] = part.split(':').map((item) => String(item || '').trim());
      const lang = String(langRaw || '').toUpperCase();
      const provider = String(providerRaw || '').toLowerCase();
      if (!LANGUAGE_CODES.has(lang)) return;
      if (!PROVIDERS.has(provider)) return;
      result[lang] = provider;
    });
    return result;
  }

  getRuntimeInfo() {
    const providerOrder = this.getProviderOrder('RU').map((item) => item.name).join(' -> ');
    return {
      providerOrder,
      langProviderMap: this.langProviderMap,
      openAiConfigured: Boolean(this.openAiApiKey),
      openAiModel: this.openAiTtsModel,
      openAiVoice: this.openAiTtsVoice,
      openAiFormat: this.openAiTtsFormat,
      elevenConfigured: Boolean(this.elevenLabsApiKey),
      elevenModel: this.elevenLabsModelId,
      edgeConfigured: Boolean(this.edgeScriptPath),
      elevenVoiceSettings: {
        stability: this.elevenVoiceStability,
        similarity_boost: this.elevenVoiceSimilarityBoost,
        style: this.elevenVoiceStyle,
        use_speaker_boost: this.elevenVoiceSpeakerBoost
      }
    };
  }

  shutdown() {
    // no-op
  }

  normalizeLang(lang) {
    const normalized = String(lang || '').trim().toUpperCase();
    if (normalized === 'KY') return 'KG';
    return normalized;
  }

  normalizeRate(rate) {
    const parsed = Number(rate);
    if (!Number.isFinite(parsed)) return 1;
    return clamp(parsed, 0.75, 1.2);
  }

  hasProviderForLang(provider, lang) {
    if (provider === 'openai') {
      return Boolean(this.openAiApiKey);
    }
    if (provider === 'eleven') {
      return Boolean(this.elevenLabsApiKey && this.elevenLabsVoiceByLang[lang]);
    }
    if (provider === 'edge') {
      return Boolean(this.edgeScriptPath && this.edgeVoiceByLang[lang]);
    }
    return false;
  }

  getProviderOrder(lang) {
    const normalizedLang = this.normalizeLang(lang);
    const primary = this.langProviderMap[normalizedLang] || 'openai';
    const providers = [];
    const pushIfAvailable = (providerName) => {
      if (!PROVIDERS.has(providerName)) return;
      if (!this.hasProviderForLang(providerName, normalizedLang)) return;
      if (providers.some((item) => item.name === providerName)) return;
      providers.push({ name: providerName });
    };

    pushIfAvailable(primary);
    pushIfAvailable(primary === 'eleven' ? 'openai' : 'eleven');
    pushIfAvailable('edge');
    return providers;
  }

  getCacheKey({ provider, text, lang, speed }) {
    const normalizedLang = this.normalizeLang(lang);
    return createHash('sha256')
      .update(JSON.stringify({
        provider,
        text,
        lang: normalizedLang,
        speed,
        model: provider === 'eleven'
          ? this.elevenLabsModelId
          : provider === 'edge'
            ? 'edge-tts'
            : this.openAiTtsModel,
        voice: provider === 'eleven'
          ? this.elevenLabsVoiceByLang[normalizedLang]
          : provider === 'edge'
            ? this.edgeVoiceByLang[normalizedLang]
            : this.openAiTtsVoice,
        format: provider === 'eleven'
          ? this.elevenLabsOutputFormat
          : provider === 'edge'
            ? 'mp3'
            : this.openAiTtsFormat
      }))
      .digest('hex');
  }

  async readDiskCache(cacheKey) {
    try {
      const metaPath = path.join(this.cacheDir, `${cacheKey}.json`);
      const metaRaw = await fsp.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaRaw);
      const audioPath = path.join(this.cacheDir, meta.audioFile);
      const audioBuffer = await fsp.readFile(audioPath);
      if (!audioBuffer.length) return null;
      return {
        audioBuffer,
        contentType: meta.contentType || 'audio/mpeg',
        provider: meta.provider || 'cache'
      };
    } catch {
      return null;
    }
  }

  async trimDiskCacheIfNeeded() {
    try {
      const entries = await fsp.readdir(this.cacheDir);
      const jsonFiles = entries.filter((name) => name.endsWith('.json'));
      if (jsonFiles.length <= this.cacheMaxEntries) return;

      const metas = await Promise.all(
        jsonFiles.map(async (name) => {
          const fullPath = path.join(this.cacheDir, name);
          const stats = await fsp.stat(fullPath);
          return { name, fullPath, mtimeMs: stats.mtimeMs };
        })
      );
      metas.sort((a, b) => a.mtimeMs - b.mtimeMs);

      const toRemove = metas.slice(0, Math.max(0, metas.length - this.cacheMaxEntries));
      await Promise.all(toRemove.map(async (metaItem) => {
        try {
          const metaRaw = await fsp.readFile(metaItem.fullPath, 'utf8');
          const meta = JSON.parse(metaRaw);
          await fsp.unlink(path.join(this.cacheDir, meta.audioFile)).catch(() => {});
        } catch {
          // ignore
        }
        await fsp.unlink(metaItem.fullPath).catch(() => {});
      }));
    } catch {
      // ignore cache pruning issues
    }
  }

  async writeDiskCache(cacheKey, payload) {
    try {
      await fsp.mkdir(this.cacheDir, { recursive: true });
      const extension = payload.contentType.includes('wav')
        ? 'wav'
        : payload.contentType.includes('flac')
          ? 'flac'
          : payload.contentType.includes('ogg')
            ? 'ogg'
            : 'mp3';
      const audioFile = `${cacheKey}.${extension}`;
      const audioPath = path.join(this.cacheDir, audioFile);
      const metaPath = path.join(this.cacheDir, `${cacheKey}.json`);

      await fsp.writeFile(audioPath, payload.audioBuffer);
      await fsp.writeFile(metaPath, JSON.stringify({
        audioFile,
        contentType: payload.contentType,
        provider: payload.provider,
        createdAt: Date.now()
      }));
      await this.trimDiskCacheIfNeeded();
    } catch {
      // ignore cache write issues
    }
  }

  resolveOpenAiInstructions(lang) {
    const byLang = {
      RU: 'Speak naturally in Russian. Clear diction, friendly educational tone, moderate speed, smooth phrase boundaries.',
      KG: 'Speak naturally in Kyrgyz. Clear diction, friendly educational tone, moderate speed, smooth phrase boundaries.',
      UZ: 'Speak naturally in Uzbek. Clear diction, friendly educational tone, moderate speed, smooth phrase boundaries.',
      EN: 'Speak naturally in English. Clear diction, friendly educational tone, moderate speed, smooth phrase boundaries.'
    };
    return byLang[lang] || byLang.RU;
  }

  async synthesizeWithOpenAi({ text, lang, speed }) {
    const response = await fetch(`${this.openAiApiBaseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.openAiTtsModel,
        voice: this.openAiTtsVoice,
        response_format: this.openAiTtsFormat,
        speed,
        instructions: this.resolveOpenAiInstructions(lang),
        input: text
      })
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      const error = new Error(`OpenAI TTS error ${response.status}: ${message || response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    if (!audioBuffer.length) {
      const error = new Error('OpenAI TTS returned empty audio');
      error.statusCode = 502;
      throw error;
    }

    return {
      audioBuffer,
      contentType: response.headers.get('content-type') || MIME_BY_FORMAT[this.openAiTtsFormat] || 'audio/mpeg',
      provider: 'openai'
    };
  }

  async synthesizeWithElevenLabs({ text, lang }) {
    // Ждём очереди — не больше 1 запроса одновременно чтобы не получить 429
    let resolve;
    const slot = new Promise((res) => { resolve = res; });
    const prev = this._elevenQueue;
    this._elevenQueue = slot;
    await prev;

    try {
      return await this._doElevenLabsRequest({ text, lang });
    } finally {
      resolve();
    }
  }

  async _doElevenLabsRequest({ text, lang }) {
    const normalizedLang = this.normalizeLang(lang);
    const voiceId = this.elevenLabsVoiceByLang[normalizedLang];
    if (!voiceId) {
      const error = new Error(`ElevenLabs voice is not configured for ${normalizedLang}`);
      error.statusCode = 503;
      throw error;
    }

    const response = await fetch(`${this.elevenLabsApiBaseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.elevenLabsApiKey,
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: this.elevenLabsModelId,
        ...(ELEVEN_MODELS_WITH_LANGUAGE_CODE.test(this.elevenLabsModelId)
          ? { language_code: ELEVEN_LANGUAGE_CODES[normalizedLang] }
          : {}),
        output_format: this.elevenLabsOutputFormat,
        voice_settings: {
          stability: this.elevenVoiceStability,
          similarity_boost: this.elevenVoiceSimilarityBoost,
          style: this.elevenVoiceStyle,
          use_speaker_boost: this.elevenVoiceSpeakerBoost
        }
      })
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      const error = new Error(`ElevenLabs TTS error ${response.status}: ${message || response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    if (!audioBuffer.length) {
      const error = new Error('ElevenLabs TTS returned empty audio');
      error.statusCode = 502;
      throw error;
    }

    return {
      audioBuffer,
      contentType: response.headers.get('content-type') || 'audio/mpeg',
      provider: 'eleven'
    };
  }

  async synthesizeWithEdge({ text, lang }) {
    const normalizedLang = this.normalizeLang(lang);
    const voice = this.edgeVoiceByLang[normalizedLang];
    if (!voice) {
      const error = new Error(`Edge voice is not configured for ${normalizedLang}`);
      error.statusCode = 503;
      throw error;
    }
    if (!this.edgeScriptPath) {
      const error = new Error('Edge TTS script path is not configured');
      error.statusCode = 503;
      throw error;
    }

    const { stdout } = await execFileAsync(
      this.edgePythonBin,
      [this.edgeScriptPath, '--text', text, '--voice', voice],
      { timeout: this.edgeRequestTimeoutMs, maxBuffer: 24 * 1024 * 1024 }
    );
    const payload = JSON.parse(String(stdout || '{}'));
    if (!payload.ok) {
      const error = new Error(`Edge TTS error: ${payload.error || 'unknown'}`);
      error.statusCode = 503;
      throw error;
    }

    const audioBuffer = Buffer.from(payload.audio_base64 || '', 'base64');
    if (!audioBuffer.length) {
      const error = new Error('Edge TTS returned empty audio');
      error.statusCode = 502;
      throw error;
    }

    return {
      audioBuffer,
      contentType: payload.content_type || 'audio/mpeg',
      provider: 'edge'
    };
  }

  async synthesizeByProvider(providerName, { text, lang, speed }) {
    if (providerName === 'openai') {
      return this.synthesizeWithOpenAi({ text, lang, speed });
    }
    if (providerName === 'eleven') {
      return this.synthesizeWithElevenLabs({ text, lang });
    }
    if (providerName === 'edge') {
      return this.synthesizeWithEdge({ text, lang });
    }
    const error = new Error(`Unknown speech provider: ${providerName}`);
    error.statusCode = 500;
    throw error;
  }

  async synthesizeWithCache(providerName, payload) {
    const cacheKey = this.getCacheKey({ provider: providerName, ...payload });
    const memoryHit = this.memoryCache.get(cacheKey);
    if (memoryHit?.audioBuffer?.length) {
      return { ...memoryHit, fromCache: true };
    }

    if (this.cacheDir) {
      const diskHit = await this.readDiskCache(cacheKey);
      if (diskHit?.audioBuffer?.length) {
        this.memoryCache.set(cacheKey, diskHit);
        return { ...diskHit, fromCache: true };
      }
    }

    const inflight = this.inflightCache.get(cacheKey);
    if (inflight) {
      const shared = await inflight;
      return { ...shared, fromCache: false };
    }

    const generationPromise = this.synthesizeByProvider(providerName, payload);
    this.inflightCache.set(cacheKey, generationPromise);

    let generated;
    try {
      generated = await generationPromise;
    } finally {
      this.inflightCache.delete(cacheKey);
    }

    this.memoryCache.set(cacheKey, generated);
    if (this.cacheDir) {
      await this.writeDiskCache(cacheKey, generated);
    }
    return { ...generated, fromCache: false };
  }

  async synthesize({ text, lang, rate }) {
    const normalizedText = String(text || '').trim();
    const normalizedLang = this.normalizeLang(lang);
    const speed = this.normalizeRate(rate);

    if (!normalizedText) {
      const error = new Error('Текст обязателен');
      error.statusCode = 400;
      throw error;
    }
    if (!LANGUAGE_CODES.has(normalizedLang)) {
      const error = new Error('Этот язык не поддерживается озвучкой');
      error.statusCode = 400;
      throw error;
    }

    const providerOrder = this.getProviderOrder(normalizedLang);
    if (!providerOrder.length) {
      const error = new Error('No speech provider is configured for this language. Set ElevenLabs/OpenAI keys and voices.');
      error.statusCode = 503;
      throw error;
    }

    const providerErrors = [];
    for (const providerItem of providerOrder) {
      try {
        return await this.synthesizeWithCache(providerItem.name, {
          text: normalizedText,
          lang: normalizedLang,
          speed
        });
      } catch (error) {
        const msg = error.message || String(error);
        providerErrors.push(`${providerItem.name}: ${msg}`);
        console.warn(`[TTS] ${providerItem.name} failed, trying next provider. Error: ${msg}`);
      }
    }

    const error = new Error(`Speech synthesis failed (${providerErrors.join(' | ')})`);
    error.statusCode = 503;
    throw error;
  }
}

module.exports = {
  SpeechService
};
