importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

// Provide an URL to enable a custom offline page
const OFFLINE_PAGE = '/offline.html';

// Pre-cache the AMP Runtime
self.addEventListener('install', event => {
  const urls = [
    'https://cdn.ampproject.org/v0.js',
    // Add AMP extensions used on your pages
    // Add fonts, icons, logos used on your pages
  ];
  if (OFFLINE_PAGE) {
    urls.push(OFFLINE_PAGE);
  }
  event.waitUntil(
      caches.open(workbox.core.cacheNames.runtime).then(cache => cache.addAll(urls))
  );
});

// Enable navigation preload. This is only necessary if navigation routes are not cached,
// see: https://developers.google.com/web/tools/workbox/modules/workbox-navigation-preload
workbox.navigationPreload.enable();

// Fallback to an offline page for navgiation requests if there is no
// network connection
let navigationStrategy;
if (OFFLINE_PAGE) {
  const networkFirstWithOfflinePage = async args => {
    const response = await workbox.strategies.networkFirst().handle(args);
    if (response) {
      return response;
    }
    return caches.match(OFFLINE_PAGE);
  };
  navigationStrategy = networkFirstWithOfflinePage;
} else {
  navigationStrategy = workbox.strategies.networkFirst();
}
const navigationRoute = new workbox.routing.NavigationRoute(navigationStrategy, {
  // Optionally, provide a white/blacklist of RegExps to determine
  // which paths will match this route.
  // whitelist: [],
  // blacklist: [],
});
workbox.routing.registerRoute(navigationRoute);

// By default Use a network first strategy to ensure the latest content is used
workbox.routing.setDefaultHandler(workbox.strategies.networkFirst());

// Serve the AMP Runtime from cache and check for an updated version in the background
workbox.routing.registerRoute(
    /https:\/\/cdn\.ampproject\.org\/.*/,
    workbox.strategies.staleWhileRevalidate()
);

/* uncomment to enable
// Cache Images
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|webp)(\?.*)?$/,
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      })
    ]
  }),
);
*/

/* uncomment to enable
// Google Font Caching
// see https://developers.google.com/web/tools/workbox/guides/common-recipes#google_fonts
// Cache the Google Fonts stylesheets with a stale while revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
);

// Cache the Google Fonts webfont files with a cache first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  workbox.strategies.cacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  }),
);
*/
