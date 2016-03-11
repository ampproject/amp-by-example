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
const ExampleFile = require('./lib/ExampleFile');
const Metadata = require('./lib/Metadata');

/**
 * Collects a list of example files and renders them
 * into the given template.
 */
module.exports = function(file, templateRoot, template) {
  let latestFile;
  let latestMod;
  let targetFile;
  let files;
  let templateName;

  if (typeof file === 'string') {
    targetFile = file;
  } else if (typeof file.path === 'string') {
    targetFile = path.basename(file.path);
  } else {
    throw new PluginError('compile-index',
        'Missing path in file options for gulp-index');
  }

  if (typeof templateRoot === 'string') {
    mu.cache = {};
    mu.root = templateRoot;
  } else {
    throw new PluginError('compile-index',
        'Missing template root in template options for gulp-index');
  }

  if (typeof template === 'string') {
    templateName = template;
  } else {
    throw new PluginError('compile-index',
        'Missing template name in template options for gulp-index');
  }

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

    // set latest file if not already set,
    // or if the current file was modified more recently.
    if (!latestMod || file.stat && file.stat.mtime > latestMod) {
      latestFile = file;
      latestMod = file.stat && file.stat.mtime;
    }

    // create file name list
    if (!files) {
      files = [];
    }
    files.push(file.path);
    cb();
  }

  function endStream(cb) {
    // no files passed in, no file goes out
    if (!latestFile || !files) {
      cb();
      return;
    }

    const categories = mapToCategories(files);

    const stream = this;
    const args = {
      categories: categories,
      title: 'AMP by Example',
      desc: 'Accelerated Mobile Pages in Action',
      fileName: '/'
    };
    Metadata.add(args);
    args.fileName = '';
    const htmlStream = mu.compileAndRender(templateName, args);
    let html = '';

    htmlStream.on('data', function(chunk) {
      html += chunk;
    }).on('end', function() {
      const indexFile = latestFile.clone({contents: false});
      indexFile.path = path.join(latestFile.base, targetFile);
      indexFile.contents = new Buffer(html);
      gutil.log('Generated ' + indexFile.relative);
      stream.push(indexFile);
      cb();
    });
  }

  function mapToCategories(files) {
    const categories = [];
    let currentCategory;
    files.sort().forEach(function(file) {
      // add file to categories instance
      const exampleFile = ExampleFile.fromPath(file);
      if (!currentCategory || currentCategory.name != exampleFile.category()) {
        currentCategory = {
          name: exampleFile.category(),
          examples: []
        };
        categories.push(currentCategory);
      }
      currentCategory.examples.push({
        title: exampleFile.title(),
        name: exampleFile.name(),
        url: exampleFile.url()
      });
    });
    return categories;
  }

  return through.obj(bufferContents, endStream);
};
