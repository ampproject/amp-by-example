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
const marked = require('marked');
const fs = require('fs');
const path = require('path');
const PREFIX = /(^|\/)\d\d_/g;
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
    const parentDir = this.sampleParentDir();
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
    this._category.url = this.section().path + '#' + this.targetParentDir();
    this._category.id = this.targetParentDir();
    if (this._category.description) {
      this._category.description = marked(this._category.description);
    }
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
    return encodeURI([GITHUB_PREFIX, this.sampleParentDir(), this.fileName()].join('/'));
  }

  targetParentDir() {
    return this.clean(this.stripNumberPrefix(this.sampleParentDir()));
  }

  targetName() {
    return this.clean(this.name());
  }

  targetPath() {
    return path.join(this.targetParentDir(), this.targetName(), 'index.html');
  }

  targetSourcePath() {
    return path.join(this.targetParentDir(),
      this.targetName(),
      'source',
      'index.html');
  }

  targetEmbedPath() {
    return path.join(this.targetParentDir(),
      this.targetName(),
      'embed',
      'index.html');
  }

  targetPreviewPath() {
    return path.join(this.targetParentDir(),
        this.targetName(),
        'preview',
        'index.html');
  }

  targetPreviewEmbedPath() {
    return path.join(this.targetParentDir(),
      this.targetName(),
      'preview',
      'embed',
      'index.html');
  }

  title() {
    let fileName = this.fileName();
    if (fileName == 'index.html') {
      // If the file name is index.html fallback to the parent directory
      fileName = this.sampleParentDir();
    }
    return FileName.toString(fileName).trim();
  }

  url() {
    return '/' +
      this.targetParentDir() +
      '/' +
      this.targetName() +
      '/';
  }

  urlPreview() {
    return this.url() + 'preview/';
  }

  urlPreviewEmbed() {
    return this.urlPreview() + 'embed/';
  }

  urlEmbed() {
    return this.url() + 'embed/';
  }

  urlSource() {
    return this.url() + 'source/';
  }

  section() {
    if (this._section) {
      return this._section;
    }

    // sections contain title & desc in a json file
    this._section = {};
    const relativePath = this.relativePath();
    const segments = relativePath.split(path.sep);
    this._section.path = '/';
    if (segments.length === 3) {
      this._section.path += '' + segments[0];
    }
    try {
      const sectionDir = path.resolve(this.filePath, '../..');
      const config = require(path.join(sectionDir, 'index.json'));
      Object.assign(this._section, config);
    } catch(err) {
      // not a section
    }
    return this._section;
  }

  /** private **/
  sampleParentDir() {
    const dir =  path.dirname(this.relativePath());
    if (dir === '.') {
      return '';
    }
    return dir;
  }

  relativePath() {
    return path.relative(SRC_DIR, this.filePath);
  }

  stripNumberPrefix(string) {
    return string.replace(PREFIX, '$1');
  }

  clean(string) {
    return decodeURIComponent(string)
      .toLowerCase()
      .replace(/^_+/g, '')
      .replace(/[!@#$%\^&*()\?']/g, '')
      .replace(/_+/g, '_');
  }
}

module.exports.fromPath = fromPath;
module.exports.GITHUB_PREFIX = GITHUB_PREFIX;
