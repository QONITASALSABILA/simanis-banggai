const CACHE_NAME = 'simanis-cache-v36';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Cek apakah request menuju CDN (Library eksternal)
  const isCDN = event.request.url.includes('unpkg.com') || event.request.url.includes('cdn.tailwindcss.com') || event.request.url.includes('cdn.jsdelivr.net');

  if (isCDN) {
    // Strategi Cache First untuk Library: Cek cache dulu, kalau ada langsung pakai (Lebih Cepat & Stabil)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else {
    // Strategi Network First untuk App: Coba internet dulu, kalau offline baru cache
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) return response;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
  }
});
