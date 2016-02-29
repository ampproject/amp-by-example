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
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;
const mu = require('mu2');
const DocumentParser = require('./lib/DocumentParser');
const Metadata = require('./lib/Metadata');
const FileName = require('./lib/FileName');

/**
 * Parses an example into it's sections and renders them
 * into the given template.
 */
module.exports = function(templateRoot, template) {
  let templateName;
  if (typeof templateRoot === 'string') {
    mu.cache = {};
    mu.root = templateRoot;
  } else {
    throw new PluginError('gulp-index',
        'Missing template root in template options for gulp-index');
  }
  if (typeof template === 'string') {
    templateName = template;
  } else {
    throw new PluginError('gulp-index',
        'Missing template in template options for gulp-index');
  }

  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      // nothing to do
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-index',
            'Streams not supported!'));
    } else if (file.isBuffer()) {
      const contents = file.contents.toString();
      const document = DocumentParser.parse(contents);
      const stream = this;
      const title = FileName.toString(file);
      const nextTitle = FileName.toString(FileName.nextFile(file.path));
      const next = FileName.fromString(nextTitle);

      const args = {
        head: document.head,
        title: title,
        subHeading: title,
        exampleStyles: document.styles,
        sections: document.sections,
        next: next,
        nextTitle: nextTitle
      };

      Metadata.add(args);
      // hack to avoid duplicate canonical refs as some examples define a canonical link
      if (document.head.indexOf('rel="canonical"') > -1) {
        args.skipCanonical = 'true';
      }
      if (next) {
        document.sections[document.sections.length - 1].appendDoc(
              '<p>Next up: <a id="nextArticle" href="' +
              next + '">' + nextTitle +
              '</a></p>');
      }
      const generatedContents = mu.compileAndRender(templateName, args);
      let html = '';
      generatedContents.on('data', function(chunk) {
        html += chunk;
      })
      .on('end', function() {
        gutil.log('Generated ' + file.relative);
        file.contents = new Buffer(html);
        stream.push(file);
        callback();
      });
    }
  });
};
