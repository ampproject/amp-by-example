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
const mu = require('mu2');
const FileName = require('./lib/FileName');

/**
 * Create an empty example.
 */
module.exports = function(templateRoot, template) {
  let templateName;

  if (typeof templateRoot === 'string') {
    mu.root = templateRoot;
  } else {
    throw new PluginError('create-example',
        'Missing template root in template options for create-example');
  }

  if (typeof template === 'string') {
    templateName = template;
  } else {
    throw new PluginError('create-example',
        'Missing template name in template options for create-example');
  }

  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      // nothing to do
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('create-example',
            'Streams not supported!'));
    } else if (file.isBuffer()) {
      const stream = this;
      const exampleName = FileName.toString(file);
      gutil.log('Creating example ' + file.relative);
      const htmlStream = mu.compileAndRender(templateName, {
        title: exampleName,
        fileName: FileName.fromString(exampleName)
      });
      let html = '';
      htmlStream.on('data', function(chunk) {
        html += chunk;
      }).on('end', function() {
        file.contents = new Buffer(html);
        stream.push(file);
        callback();
      });
    }
  });
};
