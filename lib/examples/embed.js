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
const {generatePreview} = require('../');

/**
 * Sample demonstrating how to generate a full embed as used on
 * ampproject.org.
 */
const config = {
  src: path.join(__dirname, 'src'), // root folder containing the samples
  destRoot: path.join(__dirname, 'dist'), // target folder for generated embeds
  destDir: '/embeds', // optional sub dir
  host: 'https://example.com' // this is from where the embeds are going to be served
}
generatePreview(config);
