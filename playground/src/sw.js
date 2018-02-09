// Copyright 2018 The AMPHTML Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
