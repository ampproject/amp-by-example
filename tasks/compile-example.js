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
const path = require('path');
const PluginError = gutil.PluginError;
const mu = require('mu2');
const DocumentParser = require('./lib/DocumentParser');
const Metadata = require('./lib/Metadata');
const ExampleFile = require('./lib/ExampleFile');

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
      const example = ExampleFile.fromPath(file.path);
      const nextExample = example.nextFile();
      const args = {
        head: document.head,
        title: example.title(),
        desc: document.description(),
        fileName: example.url(),
        github: example.githubUrl(),
        subHeading: example.title(),
        exampleStyles: document.styles,
        component: document.metadata.component,
        sections: document.sections,
        isExperiment: document.metadata.experiment
      };

      if (document.metadata.experiment && !document.metadata.component) {
        throw new PluginError('create-example', 'Example (' + file.path
          + ') is `experiment`: true, but is missing the `component` metadata');
      }

      Metadata.add(args);
      // avoid duplicate canonical refs as some examples define a canonical link
      if (document.head.indexOf('rel="canonical"') > -1) {
        args.skipCanonical = 'true';
      }
      if (nextExample) {
        document.sections[document.sections.length - 1].appendDoc(
              '<p>Next up: <a id="nextArticle" href="' +
              nextExample.url() + '">' + nextExample.title() +
              '</a></p>');
      }
      const generatedContents = mu.compileAndRender(templateName, args);
      let html = '';
      generatedContents.on('data', function(chunk) {
        html += chunk;
      })
      .on('end', function() {
        file.path = path.join(file.base, example.targetPath());
        file.metadata = document.metadata;
        file.contents = new Buffer(html);
        gutil.log('Generated ' + file.relative);
        stream.push(file);
        callback();
      });
    }
  });
};
