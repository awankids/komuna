const CACHE_NAME = 'komuna-cache-v2';
const ASSETS_TO_CACHE = [
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/landing_illustration.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache only truly static public images and icons
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
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
          // Invalidate legacy komuna-cache-v1 and any other outdated caches
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
  const url = new URL(event.request.url);

  // 1. Never intercept non-GET requests, Next.js dev server, API endpoints, or extension requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/') ||
    url.protocol.startsWith('chrome-extension:')
  ) {
    return;
  }

  // 2. CRITICAL: Never intercept or cache HTML document navigations.
  // Next.js App Router and Middleware manage authenticated route transitions.
  // Intercepting HTML or caching '/' causes stale redirects to /login.
  if (
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    return;
  }

  // 3. Handle static assets with Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.includes('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2');

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background to update static asset cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fail silently for static assets when offline
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});
