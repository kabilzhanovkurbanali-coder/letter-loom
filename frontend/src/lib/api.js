const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const resolveApiBaseUrl = () => {
  const configured = (process.env.REACT_APP_API_BASE_URL || '').trim();

  if (typeof window === 'undefined') {
    return configured || 'http://localhost:5001';
  }

  const browserHost = window.location.hostname;
  // The production build is served by the backend itself, so the API lives on the same origin
  // (whatever address or https port the tablet used). Only the dev server on :3000 talks to :5001.
  const isDevServer = window.location.port === '3000';
  const fallback = isDevServer ? `${window.location.protocol}//${browserHost}:5001` : window.location.origin;
  if (!configured) return fallback;
  if (configured.startsWith('/')) return configured;

  try {
    const parsed = new URL(configured);
    if (LOCAL_HOSTS.has(parsed.hostname) && !isDevServer) return fallback;
    if (LOCAL_HOSTS.has(parsed.hostname) && !LOCAL_HOSTS.has(browserHost)) {
      const port = parsed.port || '5001';
      return `${parsed.protocol}//${browserHost}:${port}`;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return configured.replace(/\/$/, '');
  }
};

export const API_BASE_URL = resolveApiBaseUrl();
export const HAS_ABSOLUTE_API_BASE = /^https?:\/\//i.test(API_BASE_URL);

export const normalizeImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  if (/^(data:|blob:)/i.test(rawUrl)) return rawUrl;
  if (/^(https?:)?\/\//i.test(rawUrl)) return rawUrl;

  if (rawUrl.startsWith('/')) {
    return HAS_ABSOLUTE_API_BASE ? `${API_BASE_URL}${rawUrl}` : rawUrl;
  }

  return HAS_ABSOLUTE_API_BASE ? `${API_BASE_URL}/${rawUrl}` : `/${rawUrl}`;
};

// 3D icon or picture served by the backend from /images/<name>.webp
export const pictureUrl = (name) => normalizeImageUrl(`/images/${name}.webp`);
