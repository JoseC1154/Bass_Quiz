const CACHE_NAME = 'scale-driller-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/dom-manager.js',
  '/js/game.js',
  '/js/quiz-manager.js',
  '/js/audio-manager.js',
  '/js/audio-input.js',
  '/js/ui-components.js',
  '/js/app.js',
  '/js/state.js',
  '/libs/pitchy.min.js',  // External note detection library
  '/libs/aubio.js',       // Optional note detection library
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve cached assets first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});