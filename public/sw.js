const CACHE_NAME = 'komuna-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/landing_illustration.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ignore failures on cache addAll to make sure it installs even if some resources aren't immediately available
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Pre-caching warning:', err);
      });
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
  // Only handle GET requests and exclude Next.js dev server HMR (hot module reloading) or API endpoints
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/') ||
    url.protocol.startsWith('chrome-extension:')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore network errors in background update
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache static JS, CSS, and images automatically
          const isStaticAsset =
            url.pathname.includes('/_next/static/') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.jpeg') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2');

          if (networkResponse.status === 200 && isStaticAsset) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if offline and requesting an HTML page
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
    })
  );
});
