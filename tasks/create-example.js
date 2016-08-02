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
const Templates = require('./lib/Templates');
const Metadata = require('./lib/Metadata');
const ExampleFile = require('./lib/ExampleFile');

/**
 * Create an empty example.
 */
module.exports = function(config) {
  let templateName;
  let templates;

  if (typeof config.templates.root === 'string') {
    templates = Templates.get(config.templates.root);
  } else {
    throw new PluginError('create-example',
        'Missing template root in template options for create-example');
  }

  if (typeof config.templates.newExample === 'string') {
    templateName = config.templates.newExample;
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
      const exampleFile = ExampleFile.fromPath(file.path);
      gutil.log('Creating example ' + file.relative);
      const args = {
        config: config,
        title: exampleFile.title(),
        fileName: exampleFile.url()
      };
      Metadata.add(args);
      const html = templates.render(templateName, args);
      file.contents = new Buffer(html);
      stream.push(file);
      callback();
    }
  });
};
