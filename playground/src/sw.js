// Claim all clients and delete old caches that are no longer needed.
self.addEventListener('activate', event => {
  self.clients.claim();
});

// Make sure the SW the page we register() is the service we use.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (!request.url.endsWith('/playground/preview/')) {
    return;
  }
  event.respondWith(caches.match(event.request));
});
