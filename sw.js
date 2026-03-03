// Vibe Buddy Service Worker v1.0
const CACHE_NAME = 'vibe-buddy-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail for external resources
      });
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API requests (YouTube API, PipedAPI)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('/youtube/')) return;
  if (url.hostname.includes('pipedapi')) return;
  if (url.hostname.includes('googlevideo.com')) return;

  // Cache-first for static assets
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network first for everything else
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Background sync for likes/watch-later (no-op if not supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-library') {
    // Library is localStorage-based, nothing to sync
  }
});

// Push notifications (reserved for future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'Vibe Buddy', {
    body: data.body || 'New content available',
    icon: './manifest.json',
    badge: './manifest.json',
    tag: 'vibe-buddy-notification'
  });
});