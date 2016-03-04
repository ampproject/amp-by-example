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
const sm = require('sitemap');
const ExampleFile = require('./lib/ExampleFile');
const Metadata = require('./lib/Metadata');

/**
 * Collects a list of example files and generates a sitemap.xml file.
 */
module.exports = function() {
  let latestFile;
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

    files.push(file.path);
    // set latest file if not already set,
    // or if the current file was modified more recently.
    if (!latestMod || file.stat && file.stat.mtime > latestMod) {
      latestFile = file;
      latestMod = file.stat && file.stat.mtime;
    }

    cb();
  }

  function endStream(cb) {
    // no files passed in, no file goes out
    if (!latestFile || !files) {
      cb();
      return;
    }

    // initialize urls with homepage
    const urls = [{
      url: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmodrealtime: true,
      lastmodfile: latestFile.path
    }];
    // add example urls
    files.forEach(function(file) {
      urls.push({
        url: ExampleFile.fromPath(file).url(),
        changefreq: 'daily',
        priority: 0.8,
        lastmodrealtime: true,
        lastmodfile: file
      });
    });

    const sitemap = sm.createSitemap({
      hostname: Metadata.HOST,
      cacheTime: 600000,  //600 sec (10 min) cache purge period
      urls: urls
    });

    const sitemapFile = latestFile.clone({contents: false});
    sitemapFile.path = path.join(latestFile.base, 'sitemap.xml');
    sitemapFile.contents = new Buffer(sitemap.toString());
    this.push(sitemapFile);
    gutil.log('Generated ' + sitemapFile.relative);
    cb();
  }

  return through.obj(bufferContents, endStream);
};
