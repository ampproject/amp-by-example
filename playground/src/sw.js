// Claim all clients
self.addEventListener('activate', event => {
  self.clients.claim();
});

// Make sure the SW the page we register() is the service we use.
self.addEventListener('install', () => self.skipWaiting());

const PREVIEW_REQUEST_URL = 'playground/preview/';

// Returned cached preview requests
self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (request.method === 'GET' &&
    request.url.endsWith(PREVIEW_REQUEST_URL)) {
    event.respondWith(caches.match(event.request));
  }
});
