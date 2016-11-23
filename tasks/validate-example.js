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
const amphtmlValidator = require('amphtml-validator');

module.exports = function() {
  let success = true;
  const passed = [];
  const failed = [];
  const ignored = [];

  function validate(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('validate-example',
        'Streams not supported!'));
    } else if (file.isBuffer()) {
      // skip over experiments which will fail validation
      if (file.metadata &&
        (file.metadata.experiments ||
          file.metadata.skipValidation) ||
          !file.path.endsWith('.html')) {
        ignored.push(gutil.colors.yellow('IGNORED') + ' ' + file.relative);
        return callback(null, file);
      }
      return amphtmlValidator.getInstance().then(function(validator) {
        try {
          let report = '';
          const result = validator.validateString(file.contents.toString());
          const validationPassed = result.status === 'PASS';
          if (validationPassed) {
            report += gutil.colors.green('PASSED ') + ' ' + file.relative;
          } 
          for (let ii = 0; ii < result.errors.length; ii++) {
            const error = result.errors[ii];
            let msg = 'line ' + error.line + ', col ' + error.col + ': ' +
              error.message;
            if (error.specUrl !== null) {
              msg += ' (see ' + error.specUrl + ')';
            }
            if (error.severity === 'ERROR') {
              report += gutil.colors.red('FAILED ')  + ' ' + file.relative + '\n' + msg;
              success = false;
            }
          }
          if (validationPassed) {
            passed.push(report);
          } else {
            failed.push(report);
          }
        } catch (e) {
          gutil.log(e);
          this.emit('error', new PluginError('validate-example',
            'Sample validation exception'));
        }
        return callback(null, file);
      });
    }
  }

  function endStream(callback) {
    const result = passed.concat(ignored, failed).join('\n');
    gutil.log('Validation results:\n\n' + result + '\n');
    if (success) {
      return callback();
    }
    this.emit('error', new PluginError('validate-example',
      'Validation failed with ' + failed.length + ' errors'));
  }

  return through.obj(validate, endStream);
};
