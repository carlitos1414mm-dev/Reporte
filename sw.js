/* Service worker: deja la app disponible sin internet. */
const CACHE = 'turnos-v4-2';
const FILES = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Primero lo guardado (rápido y sin internet); si hay red, se actualiza en segundo plano. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return net.then((res) => res || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
