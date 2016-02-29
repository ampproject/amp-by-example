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

"use strict";

const gutil = require('gulp-util');
const path = require('path');
const fs = require("fs");

/**
 * Encodes a string into file system compatible representation.
 */
module.exports.fromString = function(string) {
  if (!string) {
    return '';
  }
  let fileName = string.replace(/\s+/g, '_');
  fileName = encodeURIComponent(fileName);
  fileName = fileName.replace(/'/g,"%27");
  fileName += '.html';
  return fileName;
};

/**
 * Decodes a string from a file name.
 */
module.exports.toString = function(file) {
  if (!file) {
    return '';
  }
  let string;
  if (typeof file === 'string') {
    string = file;
  } else if (typeof file.path === 'string') {
    string = path.basename(file.path);
  } else {
    return '';
  }
  string = gutil.replaceExtension(path.basename(string), '');
  string = string.replace(/_/g, ' ');
  string = decodeURIComponent(string);
  string = string.replace(/%27/g,"'");
  return string;
};
/**
* Return the next file in alphabetical order
*/
module.exports.nextFile = function(file) {
  const files = fs.readdirSync(path.dirname(file))
      .sort().filter(function(file) {
        return path.extname(file) == '.html';
      });
  const pos = files.indexOf(path.basename(file));
  if (pos == -1) {
    return undefined;
  }
  return files[pos + 1];
};
