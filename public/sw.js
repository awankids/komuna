const CACHE_NAME = 'komuna-cache-v5';
const ASSETS_TO_CACHE = [
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/landing_illustration.jpg',
  '/manifest.webmanifest'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache essential static assets
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up legacy caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      }),
      // Enable navigation preload if supported to cut cold-start TTFB
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve()
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never intercept local dev server, Turbopack HMR, non-GET, API, or extensions
  if (
    event.request.method !== 'GET' ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.pathname.includes('[turbopack]') ||
    url.pathname.includes('%5Bturbopack%5D') ||
    url.pathname.includes('hmr') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('/_next/development/') ||
    url.pathname.startsWith('/api/') ||
    url.protocol.startsWith('chrome-extension:')
  ) {
    return;
  }

  // 2. Handle HTML document navigations using Navigation Preload (Online First, 0ms SW latency)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Fast-track: use preloaded response if available (parallel network trip during SW boot)
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }
          return await fetch(event.request);
        } catch (error) {
          // Offline fallback
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Komuna - Mode Offline</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#334155;text-align:center;padding:24px}h1{font-size:20px;font-weight:700;margin-bottom:8px;color:#0f172a}p{font-size:14px;color:#64748b;max-width:320px;line-height:1.5;margin-bottom:20px}button{padding:10px 24px;background:#f95713;color:#fff;border:none;border-radius:9999px;font-weight:600;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(249,87,19,0.25)}</style></head><body><h1>Tidak Ada Koneksi Internet</h1><p>Komuna membutuhkan koneksi internet untuk memuat data terbaru. Silakan periksa jaringan HP Anda.</p><button onclick="window.location.reload()">Coba Lagi</button></body></html>',
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      })()
    );
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

// Handle notification click on phone/browser: focus or open the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/jimpitan';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
