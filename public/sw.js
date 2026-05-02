/**
 * Vault Next — Service Worker
 * Cache-first untuk assets statis, network-first untuk navigasi
 * Auto update: saat ada versi baru, notif muncul lalu reload
 */

const CACHE_NAME = 'vault-next-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: cache assets awal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Gagal cache tidak fatal
      });
    })
  );
  // Aktifkan SW baru langsung tanpa tunggu tab lama ditutup
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Ambil kontrol semua tab yang sudah terbuka
  self.clients.claim();
});

// Fetch: network-first untuk navigasi, cache-first untuk assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET dan request ke API/external
  if (request.method !== 'GET') return;
  if (!url.origin.startsWith(self.location.origin)) return;

  // Next.js static assets: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigasi: network-first dengan fallback cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }
});

// Message: handle skipWaiting dari app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
