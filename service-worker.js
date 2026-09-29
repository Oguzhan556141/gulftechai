const CACHE_NAME = 'gulftech-ai-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './js/main.js',
  './js/api.js',
  './js/handlers.js',
  './js/ui.js',
  './js/utils.js',
  './js/i18n.js',
  './data.json',
  './teamKnowledge.json',
  './ruleKnowledge.json',
  './firstKnowledge.json',
  './assets/ai-mascot.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Ignore external APIs like Google Gemini, TBA, or proxy
    if (event.request.url.includes('generativelanguage.googleapis.com') || event.request.url.includes('/api/')) return;

    // Network-first for HTML, JS and JSON so users immediately see changes
    event.respondWith(
        fetch(event.request).then((fetchResponse) => {
            if (fetchResponse && fetchResponse.status === 200) {
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
