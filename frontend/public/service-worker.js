/* Letter Loom offline support.
 * - App shell and build files: cached on install, so the game opens without a network.
 * - 3D pictures: cached on install from the backend's list, then cache-first.
 * - Voice (/api/speech): cache-first. Every phrase heard once, or downloaded from teacher mode,
 *   plays offline afterwards. Audio elements ask for byte ranges, so ranges are cut from the cache.
 * Nothing about the children is cached here: only the app, pictures and generated voice.
 */
const SHELL_CACHE = 'll-shell-v1';
const MEDIA_CACHE = 'll-media-v1';
const VOICE_CACHE = 'll-voice-v1';
const KEEP = new Set([SHELL_CACHE, MEDIA_CACHE, VOICE_CACHE]);
const SHELL_FILES = ['/', '/index.html', '/manifest.json', '/favicon-64.png', '/logo192.png', '/logo512.png', '/maskable512.png', '/apple-touch-icon.png'];

const cacheBuildFiles = async () => {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_FILES);
  try {
    const manifest = await (await fetch('/asset-manifest.json', { cache: 'no-store' })).json();
    const files = Object.values(manifest.files || {}).filter((file) => typeof file === 'string' && !file.endsWith('.map'));
    await cache.addAll(files);
    // forget files from older builds
    const wanted = new Set([...SHELL_FILES, ...files].map((file) => new URL(file, self.location.origin).href));
    const cached = await cache.keys();
    await Promise.all(cached.filter((request) => !wanted.has(request.url)).map((request) => cache.delete(request)));
  } catch {
    // dev server or partial build: the shell alone still works
  }
};

const cachePictures = async () => {
  try {
    const { images = [] } = await (await fetch('/api/offline-manifest', { cache: 'no-store' })).json();
    const cache = await caches.open(MEDIA_CACHE);
    const missing = [];
    await Promise.all(images.map(async (url) => {
      if (!(await cache.match(url))) missing.push(url);
    }));
    // small batches so a weak tablet is not flooded
    for (let i = 0; i < missing.length; i += 12) {
      await Promise.all(missing.slice(i, i + 12).map((url) => cache.add(url).catch(() => null)));
    }
  } catch {
    // pictures are also cached one by one as they are shown
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(cacheBuildFiles().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => !KEEP.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
    cachePictures();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'cache-pictures') event.waitUntil(cachePictures());
});

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.status === 200) cache.put(request, response.clone());
  return response;
};

const sliceRange = async (request, response) => {
  const range = request.headers.get('range');
  const match = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) return response;
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
};

const voice = async (request) => {
  const cache = await caches.open(VOICE_CACHE);
  // one cache entry per phrase, whatever range the audio element asks for
  const key = new Request(request.url);
  let response = await cache.match(key);
  if (!response) {
    response = await fetch(key);
    if (!response.ok) return response;
    await cache.put(key, response.clone());
  }
  return sliceRange(request, response);
};

const page = async (request) => {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(SHELL_CACHE)).put('/index.html', response.clone());
    return response;
  } catch {
    return (await caches.match('/index.html')) || Response.error();
  }
};

const networkFirst = async (request) => {
  const cache = await caches.open(MEDIA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (url.pathname === '/api/speech') {
    event.respondWith(voice(request));
  } else if (url.pathname === '/api/words') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/images/')) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
  } else if (!url.pathname.startsWith('/api/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});
