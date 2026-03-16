const CACHE_NAME = 'gulftech-ai-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './js/main.js',
  './js/api.js',
  './js/handlers.js',
  './js/ui.js',
  './js/utils.js',
  './data.json',
  './knowledge.json',
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
    
    // Ignore external APIs like Google Gemini or TBA for basic caching
    if (event.request.url.includes('generativelanguage.googleapis.com')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Serve from cache if found, otherwise fetch from network
            return response || fetch(event.request).then((fetchResponse) => {
                // Don't cache if not a valid success response
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }
                
                // Clone response and cache it
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return fetchResponse;
            }).catch(() => {
                // If offline and not in cache, we could return a fallback HTML if it was a navigation request
                return new Response("Offline", { status: 503, statusText: "Offline" });
            });
        })
    );
});
