// Remplacés par tools/build.mjs : version du cache et liste de précache.
const CACHE = 'toogood-' + '__VERSION__';
const FICHIERS = '__FICHIERS__';

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FICHIERS)));
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n.startsWith('toogood-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;
  evenement.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const trouve = await cache.match(requete, { ignoreSearch: true });
    if (trouve) return trouve;
    if (requete.mode === 'navigate') {
      const accueil = await cache.match('index.html') || await cache.match('./');
      if (accueil) return accueil;
    }
    return fetch(requete);
  })());
});

self.addEventListener('message', (evenement) => {
  if (evenement.data === 'SKIP_WAITING') self.skipWaiting();
});
