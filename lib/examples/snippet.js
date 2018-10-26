/**
 * copyright 2015 google inc. all rights reserved.
 *
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *      http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as-is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */

'use strict'

const path = require('path');
const {generateSnippets} = require('../');

/* Sample demonstrating how to parse a sample file into multiple
 * snippets. */
const snippets = generateSnippets(__dirname + '/src/responsive.html');
for (const snippetKey in snippets) {
  const snippet = snippets[snippetKey];
  console.log(`Snippet code: \n\n${snippet.code}`);
  console.log(`Snippet preview: \n\n${snippet.preview}`);
}
