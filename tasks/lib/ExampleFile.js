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
const FileName = require('./FileName');
const path = require('path');
const fs = require('fs');
const PREFIX = /\d+_/;
const GITHUB_PREFIX = "https://github.com/ampproject/amp-by-example/blob/master/src";


/**
 * Encodes a string into file system compatible representation.
 */
function fromPath(filePath) {
  if (!filePath) {
    return null;
  }
  return new ExampleFile(filePath);
};

class ExampleFile {

  constructor(filePath) {
    this.filePath = filePath;
  }

  category() {
    const parentDir = path.basename(path.dirname(this.filePath));
    return FileName.toString(this.stripNumberPrefix(parentDir));
  }

  name() {
    return path.parse(this.filePath).name;
  }

  nextFile() {
    const dir = path.dirname(this.filePath);
    const files = fs.readdirSync(dir)
        .sort()
        .filter(function(file) {
          return path.extname(file) == '.html';
        });
    const nextPos = files.indexOf(path.basename(this.fileName())) + 1;
    if (nextPos == 0 || nextPos >= files.length) {
      return null;
    }
    return fromPath(path.join(dir, files[nextPos]));
  };

  fileName() {
    return path.basename(this.filePath);
  }

  githubUrl() {
    const parentDir = path.basename(path.dirname(this.filePath));
    return GITHUB_PREFIX + '/' + parentDir + '/' + this.fileName();
  }

  targetParentDir() {
    const parentDir = path.basename(path.dirname(this.filePath));
    return this.stripNumberPrefix(parentDir).toLowerCase();
  }

  targetName() {
    return this.name().toLowerCase();
  }

  targetPath() {
    return path.join(this.targetParentDir(), this.targetName(), 'index.html');
  }

  title() {
    return FileName.toString(this.fileName());
  }

  url() {
    return '/' +
      encodeURI(this.targetParentDir()) +
      '/' +
      encodeURI(this.targetName());
  }

  /** private **/
  stripNumberPrefix(string) {
    return string.replace(PREFIX, '');
  }

}

module.exports.fromPath = fromPath;
module.exports.GITHUB_PREFIX = GITHUB_PREFIX;

