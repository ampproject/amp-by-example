importScripts('workbox-sw.prod.js');

const urlsToPrecache = [
  'https://cdn.ampproject.org/v0.js',
  'https://cdn.ampproject.org/v0/validator.js'
];

const workboxSW = new WorkboxSW({
  clientsClaim: true,
});

workboxSW.precache(urlsToPrecache);
workboxSW.precache([]);

const networkFirst = workboxSW.strategies.networkFirst();
const staleWhileRevalidate = workboxSW.strategies.staleWhileRevalidate();

workboxSW.router.registerRoute(/\/document\/.*/, networkFirst);
workboxSW.router.registerRoute(/\/amp\/.*/, networkFirst);
workboxSW.router.registerRoute(/.*/, staleWhileRevalidate);
workboxSW.router.registerRoute(/https\:\/\/cdn\.ampproject\.org.*/, staleWhileRevalidate);
