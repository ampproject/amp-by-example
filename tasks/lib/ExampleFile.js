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
const SRC_DIR = "src";
const GITHUB_PREFIX = "https://github.com/ampproject/amp-by-example/blob/master/" + SRC_DIR;


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

  // TODO: cache categories across all samples in a dir 
  category() {
    if (this._category) {
      return this._category;
    }
    const parentDir = this.parentDir();
    if (!parentDir) {
      return '';
    }
    const metadataFile = path.join(path.dirname(this.filePath), 'index.json');
    try {
      this._category = require(metadataFile);
    }catch(err) {
      this._category = {};
    }
    this._category.name = FileName.toString(this.stripNumberPrefix(parentDir));
    this._category.url = this.targetParentDir();
    this._category.targetDir = path.join(this.targetParentDir(), "index.html");
    return this._category;
  }

  name() {
    return path.parse(this.filePath).name;
  }

  nextFile() {
    if (!this.category()) {
      return null;
    }
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
    return encodeURI([GITHUB_PREFIX, this.parentDir(), this.fileName()].join('/'));
  }

  targetParentDir() {
    return this.clean(this.stripNumberPrefix(this.parentDir()));
  }

  targetName() {
    return this.clean(this.name());
  }

  targetPath() {
    return path.join(this.targetParentDir(), this.targetName(), 'index.html');
  }

  targetPreviewPath() {
    return path.join(this.targetParentDir(),
        this.targetName(),
        'preview',
        'index.html');
  }

  title() {
    return FileName.toString(this.fileName());
  }

  url() {
    return '/' +
      this.targetParentDir() +
      '/' +
      this.targetName() +
      '/';
  }

  /** private **/
  parentDir() {
    const parentDir = path.basename(path.dirname(this.filePath));
    if (parentDir === SRC_DIR) {
      return '';
    }
    return parentDir;
  }

  stripNumberPrefix(string) {
    return string.replace(PREFIX, '');
  }

  clean(string) {
    return decodeURIComponent(string)
      .toLowerCase()
      .replace(/[^\w\d_-]/g, '')
      .replace(/_+/g, '_');
  }
}

module.exports.fromPath = fromPath;
module.exports.GITHUB_PREFIX = GITHUB_PREFIX;

