// The voice pack: every phrase the games can say in one language, with the same speech options the
// games use, so downloading them in advance fills exactly the cache entries played later offline.
// Phrases with a child's name cannot be known in advance; offline they fall back to the device voice.

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

// What Irbi says through a game's say(): capitalized, default speech options.
export const sayPhrase = (text) => ({ text: capitalize(String(text || '')), options: {} });

// A word, syllable or letter spoken with special options (kind / rate).
export const wordPhrase = (text, options = {}) => ({ text: String(text || ''), options });

// Every plain string in a game's text table (skipping button labels and {templates}).
export const textPhrases = (texts, skip = []) => {
  const out = [];
  Object.entries(texts || {}).forEach(([key, value]) => {
    if (skip.includes(key)) return;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => {
      if (typeof item === 'string' && item && !item.includes('{')) out.push(sayPhrase(item));
    });
  });
  return out;
};

export const LABEL_KEYS = ['next', 'more', 'moreTasks', 'menu', 'listen', 'home', 'mic', 'ready', 'reward', 'rewardDesc', 'listening', 'blowing'];

export const uniquePhrases = (phrases) => {
  const seen = new Set();
  return phrases.filter((phrase) => {
    if (!phrase?.text) return false;
    const key = `${phrase.text}|${phrase.options.kind || ''}|${phrase.options.rate || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Runs `fetchOne` over all phrases a few at a time and reports progress.
export const downloadPhrases = async (phrases, fetchOne, onProgress, concurrency = 3) => {
  let done = 0;
  let failed = 0;
  let next = 0;
  const worker = async () => {
    while (next < phrases.length) {
      const phrase = phrases[next];
      next += 1;
      try {
        await fetchOne(phrase);
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress?.({ done, failed, total: phrases.length });
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, phrases.length) }, worker));
  return { done, failed, total: phrases.length };
};
