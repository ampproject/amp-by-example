/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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
 */

'use strict'

const path = require('path');
const {parseSample} = require('../');

/**
 * Sample demonstrating how to parse and pre-compile sample file. The result is
 * a document containing head, css and code sections as well as the pre-compiled
 * source document (e.g. with absolute paths being replaced).
 */
const sampleFilePath = path.join(__dirname, '../../src/20_Components/amp-video-iframe.html');
// these options are currently used
const config = {
  host: 'https://example.com',
  api: {
    host: 'https://api.example.com'
  }
}

parseSample(sampleFilePath, config).then((sample) => {
  console.log(sample.document.title);
  console.log(sample.source);
});
