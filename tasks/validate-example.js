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

const through = require('through2');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;
const FileName = require('./lib/FileName');
const os = require('os');
const fs = require('fs');
const cp = require('child_process');

/**
 * Create an empty example.
 */
module.exports = function() {

  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('validate-example',
            'Streams not supported!'));
    } else if (file.isBuffer()) {
      // write file to disk, invoke validator, capture output & cleanup
      const exampleName = FileName.toString(file);
      const tmpFile = os.tmpdir() + '/' + exampleName;
      fs.writeFile(tmpFile, file.contents, 'utf8', function(err) {
        if (err) {
          return callback(err);
        }
        const child = cp.spawn('validate', [tmpFile]);
        let output = '';
        let error = false;
        child.stderr.on('data', function(data) {
          output += data.toString();
        });
        child.stdout.on('data', function(data) {
          output += data.toString().trim();
        });
        child.on('exit', function() {
          gutil.log('Validating example ' + file.relative + ': ' + output);
          if (!error) {
            fs.unlink(tmpFile, function() {
              callback();
            });
          }
        });
        child.on('error', function() {
          error = true;
          gutil.log('Could not find \'validate\' binary in path. Build from: https://github.com/ampproject/amphtml/tree/master/validator');
          callback();
        });
      });
    }
  });
};
