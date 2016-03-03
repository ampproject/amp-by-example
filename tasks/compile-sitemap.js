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

'use strict';

const through = require('through2');
const path = require('path');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;
const mu = require('mu2');
const sm = require('sitemap')
const fs = require('fs');
const FileName = require('./lib/FileName');
const Metadata = require('./lib/Metadata');

/**
 * Collects a list of example files and renders them
 * into the given template.
 */
module.exports = function() {
  let latestMod;
  let files;

  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    // we don't do streams
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-index',
            'Streaming not supported'));
      cb();
      return;
    }

    // create file name list
    if (!files) {
      files = [];
    }

    files.push(file);
    latestFile = file;

    cb();
  }

  function endStream(cb) {
    // no files passed in, no file goes out
    if (!latestFile || !files) {
      cb();
      return;
    }

    const sitemap = sm.createSitemap ({
      hostname: Metadata.HOST,
      cacheTime: 600000,
      urls: [
      { url: '/page-1/',  changefreq: 'daily', priority: 0.3 },
      { url: '/page-2/',  changefreq: 'monthly',  priority: 0.7 },
      { url: '/page-3/'},    // changefreq: 'weekly',  priority: 0.5
      { url: '/page-4/',   img: "http://urlTest.com" }
      ]
    });

    const indexFile = latestFile.clone({contents: false});
    indexFile.path = path.join(latestFile.base, targetFile);
    indexFile.contents = new Buffer(html);
    stream.push(indexFile);
    gutil.log('Generated ' + indexFile.relative);
    cb();
  }

  return through.obj(bufferContents, endStream);
};
