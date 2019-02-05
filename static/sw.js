/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

importScripts('/sw-toolbox/sw-toolbox.js');
importScripts('https://cdn.rawgit.com/jakearchibald/idb/97e4e878/lib/idb.js');

const config = {
  offlinePage: '/youre_offline/'
};

const IGNORED_URLS = [
  /.*\/shopping_cart$/,
  /.*\/favorite$/,
  /.*\/favorite-with-count$/,
  /.*\/slow-json-with-items$/,
  /.*\/oauth\//
];

config.filesToCache = [
  '/',
  '/components/amp-img/',
  '/components/amp-install-serviceworker/',
  config.offlinePage,
  '/img/offline.png',
  '/playground/',
  '/img/amp_by_example_logo.svg',
  '/playground/images/logo.svg',
  '/img/amp_logo_black.svg'
];

/**
 * VAPID Keys for Webpush
 */
const applicationServerPublicKey = "BA99vy78Qu4vuByBMUZ1W5J0H7ngllFJhF9GcjbS_GJM9iD7uXIm-dQj7nXvisXHI6372ga3mZR3kFdS9MYTdSA";
const convertedVapidKey = urlB64ToUint8Array(applicationServerPublicKey);

/**
 * Generates a placeholder SVG image of the given size.
 */
function offlineImage(name, width, height) {
  return
    `<?xml version="1.0"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none" fill-rule="evenodd"><path fill="#F8BBD0" d="M0 0h${width}v${height}H0z"/></g>
  <text text-anchor="middle" x="${Math.floor(width / 2)}" y="${Math.floor(height / 2)}">image offline (${name})</text>
<style><![CDATA[
text{
  font: 48px Roboto,Verdana, Helvetica, Arial, sans-serif;
}
]]></style>
</svg>`;
}
/**
 * Returns true if the Accept header contains the given content type string.
 */
function requestAccepts(request, contentType) {
  return request.headers.get('Accept').indexOf(contentType) != -1;
}

/**
 * ampbyexample.com fetch handler:
 *
 * - one-behind caching
 * - shows offline page
 * - generates placeholder image for unavailable images
 */
function ampByExampleHandler(request, values) {
  if (shouldNotCache(request)) {
    return toolbox.networkOnly(request, values);
  }
  // for samples show offline page if offline and samples are not cached
  if (requestAccepts(request, 'text/html')) {
    // never use cached version for AMP CORS requests (e.g. amp-live-list) or pages that shouldn't be cached
    if (request.url.indexOf("__amp_source_origin") != -1) {
      return toolbox.networkOnly(request, values);
    }
    // network first, we always want to get the latest
    return toolbox.networkFirst(request, values).catch(function() {
      return toolbox.cacheOnly(new Request(config.offlinePage), values)
        .then(function(response) {
          return response || new Response('You\'re offline. Sorry.', {
            status: 500,
            statusText: 'Offline Page Missing'
          });
        });
    });
  }
  // always try to load images from the cache first
  // fallback to placeholder SVG image if offline and image not available
  if (requestAccepts(request, 'image/')) {
    return toolbox.cacheFirst(request, values).catch(function() {
      const url = request.url;
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      // TODO use correct image dimensions
      return new Response(offlineImage(fileName, 1080, 610), {
        headers: {
          'Content-Type': 'image/svg+xml'
        }
      });
    });
  } else {
    // cache first for all other requests
    return toolbox.cacheFirst(request, values);
  }
}

function shouldNotCache(request) {
  const path = new URL(request.url).pathname;
  return IGNORED_URLS.some(url => {
    //console.log('ignore? ' + path + ' ' + url + ' -> ' + url.test(path));
    return url.test(path);
  });
}

function sendWebPushHandler(request, values) {
    
    return idb.open('web-push-db', 1).then(db => {
      let tx = db.transaction(['web-push-subcription'], 'readonly');
      let store = tx.objectStore('web-push-subcription');

      return store.get(1).then(subscriptionJSON => {
        let options = {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://ampbyexample.com'
              },
              body: subscriptionJSON.data
              };
        return fetch('https://demo-amp-web-push.glitch.me/send-push', options);
      });
    });
}

toolbox.options.debug = false;
toolbox.router.default = toolbox.networkFirst;
toolbox.router.get('/(.*)', ampByExampleHandler, {
  origin: self.location.origin
});
// network first amp runtime
toolbox.router.get('/(.*)', toolbox.networkFirst, {
  origin: 'https://cdn.ampproject.org'
});
// handle 'send push' request form form
toolbox.router.post('/send-push', sendWebPushHandler, {
  origin: self.location.origin
});

toolbox.precache(config.filesToCache);

// Cache the page registering the service worker. Without this, the
// "first" page the user visits is only cached on the second visit,
// since the first load is uncontrolled.
toolbox.precache(
  clients.matchAll({
    includeUncontrolled: true
  }).then(l => {
    return l.map(c => c.url);
  })
);

// Make sure the SW the page we register() is the service we use.
self.addEventListener('install', () => self.skipWaiting());

// Claim clients so that the very first page load is controlled by a service
// worker. (Important for responding correctly in offline state.)
self.addEventListener('activate', event => {
    event.waitUntil(
        //Initialize IndexedDB, to store VAPID keys for Webpush functionality.
        idb.open('web-push-db', 1, upgradeDB => {
            let store = upgradeDB.createObjectStore('web-push-subcription', {
                keyPath: 'id'
            });
        }).then(() => self.clients.claim())
    );
});

// Listens to push events, and displays a notification, using the payload text.
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: 'img/amp_logo_pink.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    event.waitUntil(
        self.registration.showNotification('Push Notification', options)
    );
});

/**
  This section contains code related to the amp-web-push functionality.
  The service worker accepts window messages (listened to via the service 
  worker's 'message' handler), performs some action, and
  replies with a result.
  The service worker listens to postMessage() messages sent from a lightweight
  invisible iframe on the canonical origin. The AMP page sends messages to this
  "helper" iframe, which then forwards the message to the service worker.
  Broadcast replies from the service worker are received by the helper iframe,
  which broadcasts the reply back to the AMP page.
*/
/** @enum {string} */
const WorkerMessengerCommand = {
    /*
      Used to request the current subscription state.
     */
    AMP_SUBSCRIPTION_STATE: 'amp-web-push-subscription-state',
    /*
      Used to request the service worker to subscribe the user to push.
      Notification permissions are already granted at this point.
     */
    AMP_SUBSCRIBE: 'amp-web-push-subscribe',
    /*
      Used to unsusbcribe the user from push.
     */
    AMP_UNSUBSCRIBE: 'amp-web-push-unsubscribe',
};

/*
  According to
  https://w3c.github.io/ServiceWorker/#run-service-worker-algorithm:
  "user agents are encouraged to show a warning that the event listeners
  must be added on the very first evaluation of the worker script."
  We have to register our event handler statically (not within an
  asynchronous method) so that the browser can optimize not waking up the
  service worker for events that aren't known for sure to be listened for.
  Also see: https://github.com/w3c/ServiceWorker/issues/1156
*/
self.addEventListener('message', event => {
    /*
      Messages sent from amp-web-push have the format:
      - command: A string describing the message topic (e.g.
        'amp-web-push-subscribe')
      - payload: An optional JavaScript object containing extra data relevant to
        the command.
     */
    const { command } = event.data;

    switch (command) {
        case WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE:
            onMessageReceivedSubscriptionState();
            break;
        case WorkerMessengerCommand.AMP_SUBSCRIBE:
            onMessageReceivedSubscribe();
            break;
        case WorkerMessengerCommand.AMP_UNSUBSCRIBE:
            onMessageReceivedUnsubscribe();
            break;
    }
});

/**
  Broadcasts a single boolean describing whether the user is subscribed.
 */
function onMessageReceivedSubscriptionState() {
    let retrievedPushSubscription = null;
    self.registration.pushManager.getSubscription()
        .then(pushSubscription => {
            retrievedPushSubscription = pushSubscription;
            if (!pushSubscription) {
                return null;
            } else {
                return self.registration.pushManager.permissionState(
                    pushSubscription.options
                );
            }
        }).then(permissionStateOrNull => {
            if (permissionStateOrNull == null) {
                broadcastReply(WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE, false);
            } else {
                const isSubscribed = !!retrievedPushSubscription &&
                    permissionStateOrNull === 'granted';
                broadcastReply(WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE,
                    isSubscribed);
            }
        });
}

/**
  Subscribes the visitor to push.
  The broadcast value is null (not used in the AMP page).
 */
function onMessageReceivedSubscribe() {
    /*
      If you're integrating amp-web-push with an existing service worker, use your
      existing subscription code. The subscribe() call below is only present to
      demonstrate its proper location. The 'fake-demo-key' value will not work.
      If you're setting up your own service worker, you'll need to:
        - Generate a VAPID key (see:
          https://developers.google.com/web/updates/2016/07/web-push-interop-wins)
        - Using urlBase64ToUint8Array() from
          https://github.com/web-push-libs/web-push, convert the VAPID key to a
          UInt8 array and supply it to applicationServerKey
     */
    self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
    }).then(pushSubscription => {
        persistSubscriptionLocally(pushSubscription);
        broadcastReply(WorkerMessengerCommand.AMP_SUBSCRIBE, null);
    });
}

/**
  Unsubscribes the subscriber from push.
  The broadcast value is null (not used in the AMP page).
 */
function onMessageReceivedUnsubscribe() {
    self.registration.pushManager.getSubscription()
        .then(subscription => subscription.unsubscribe())
        .then(() => {
            clearLocalDatabase();
            // OPTIONALLY IMPLEMENT: Forward the unsubscription to your server here
            broadcastReply(WorkerMessengerCommand.AMP_UNSUBSCRIBE, null);
        });
}

/**
 * Sends a postMessage() to all window frames the service worker controls.
 * @param {string} command
 * @param {!JsonObject} payload
 */
function broadcastReply(command, payload) {
    self.clients.matchAll()
        .then(clients => {
            for (const client of clients) {
                client. /*OK*/ postMessage({
                    command,
                    payload,
                });
            }
        });
}

/**
  Helper functions for IndexedDB management.
 */
/**
  Persists the subscription object in IndexedDB.
 */
function persistSubscriptionLocally(subscription) {
    let subscriptionJSON = JSON.stringify(subscription);
    idb.open('web-push-db', 1).then(db => {
        let tx = db.transaction(['web-push-subcription'], 'readwrite');
        tx.objectStore('web-push-subcription').put({
            id: 1,
            data: subscriptionJSON
        });
        return tx.complete;
    });
}

/**
  Clears the local database (called after a user unsubscribes).
 */
function clearLocalDatabase() {
    idb.open('web-push-db', 1).then(db => {
        let tx = db.transaction(['web-push-subcription'], 'readwrite');
        tx.objectStore('web-push-subcription').clear();
        return tx.complete;
    });
}

/**
Helper method to convert the VAPID key to a UInt8 array and supply it to applicationServerKey.
*/
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = self.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
