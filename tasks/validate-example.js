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
const os = require('os');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');

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

      // skip over experiments which will fail validation
      if (file.metadata &&
        (file.metadata.experiment || file.metadata.skipValidation)) {
        gutil.log('Validating ' + file.relative +
          ': ' + gutil.colors.yellow('IGNORED'));
        return callback(null, file);
      }

      // write file to disk, invoke validator, capture output & cleanup
      const inputFilename = path.basename(file.path);
      const tmpFile = path.join(os.tmpdir(), inputFilename);
      const self = this;
      fs.writeFile(tmpFile, file.contents, encoding, function(err) {
        if (err) {
          return callback(err);
        }
        const child = cp.spawn(
            path.join(__dirname, '../node_modules/.bin/amp-validator'),
            ['-o', 'json', inputFilename],
            {cwd: os.tmpdir()}
        );
        let output = '';
        let error = false;
        let timeout = false;
        child.stderr.on('data', function(data) {
          output += data.toString();
          if (output === 'undefined:1') {
            timeout = true;
          }
        });
        child.stdout.on('data', function(data) {
          output += data.toString().trim();
        });
        child.on('exit', function() {
          if (timeout) {
            return self.emit('error', new PluginError('validate-example',
              'Timeout occured while fetching AMP for validation. Try again'));
          }
          let printedOutput = '';
          const parsedOutput = JSON.parse(output);
          const exampleKey = 'http://localhost:30000/' + inputFilename;
          if (parsedOutput[exampleKey].success) {
            printedOutput = gutil.colors.green('PASSED');
          } else {
            const errorList = parsedOutput[exampleKey].errors;
            printedOutput = gutil.colors.red('FAILED\n\n');
            errorList.forEach(function(item) {
              printedOutput += item.line + ': ' + item.reason + '\n';
            });
          }
          gutil.log('Validating ' + file.relative + ': ' +
              printedOutput);
          if (!error) {
            fs.unlink(tmpFile, function() {
              if (parsedOutput[exampleKey].success) {
                callback();
              } else {
                self.emit('error', new PluginError('validate-example',
                      'Example has failed AMP validation'));
              }
            });
          }
        });
        child.on('error', function() {
          error = true;
          self.emit('error', new PluginError('validate-example',
                'Error invoking amp-validate process'));
        });
      });
    }
  });
};
