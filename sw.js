// Service worker : cache hors-ligne du « moteur » de l'app.
// Les données (localStorage) ne sont pas concernées.
// Incrémenter CACHE_VERSION à chaque publication d'une nouvelle version
// pour que les téléphones remplacent proprement l'ancienne copie.
const CACHE_VERSION = 'mf-cache-v4';
const ASSETS = [
  './',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

// Installation : précharge l'app et ses ressources dans le cache.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : supprime les caches des versions précédentes.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Polices Google : cache d'abord (elles ne changent jamais), réseau sinon.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // La page elle-même : réseau d'abord (toujours la dernière version en
  // ligne), copie en cache en secours quand on est hors-ligne.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put('./', copy));
        return res;
      }).catch(() => caches.match('./'))
    );
    return;
  }

  // Le reste (icônes, manifest) : cache d'abord, réseau en complément.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
