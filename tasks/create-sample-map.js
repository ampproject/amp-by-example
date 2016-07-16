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
const ExampleFile = require('./lib/ExampleFile');

/**
 * Collects a list of example files and generates a samples.json file.
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
      files = {};
    }

    if (file.isBuffer()) {
      const exampleFile = ExampleFile.fromPath(file.path);
      files[path.basename(file.path)] = {
        path: file.path,
        url: exampleFile.url()
      };
    }
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

    const result = latestFile.clone({contents: false});
    result.path = path.join(latestFile.base, 'samples.json');
    result.contents = new Buffer(JSON.stringify(files, null, 4));
    this.push(result);
    gutil.log('Generated ' + result.relative);
    cb();
  }

  return through.obj(bufferContents, endStream);
};
