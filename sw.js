/* Agora — service worker (généré par build.js, ne pas éditer à la main) */
const CACHE = 'agora-b0f2886efb';
const FILES = [
 "./",
 "index.html",
 "app.js",
 "style.css",
 "theme-boot.js",
 "manifest.webmanifest",
 "fonts/dancing-script-latin-700-normal.woff2",
 "fonts/dm-sans-latin-400-normal.woff2",
 "fonts/dm-sans-latin-500-normal.woff2",
 "fonts/dm-sans-latin-700-normal.woff2",
 "fonts/fraunces-latin-500-normal.woff2",
 "fonts/fraunces-latin-600-normal.woff2",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png",
 "icons/apple-touch-icon.png",
 "icons/mark.svg"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' }))))));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('agora-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/acces.json')) return; /* toujours en direct */
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html', { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
