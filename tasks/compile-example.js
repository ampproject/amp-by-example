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

const gutil = require('gulp-util');
const path = require('path');
const through = require('through2');
const PluginError = gutil.PluginError;
const DocumentParser = require('./lib/DocumentParser');
const ExampleFile = require('./lib/ExampleFile');
const Metadata = require('./lib/Metadata');
const Templates = require('./lib/Templates');

/**
 * Collects a list of example files, renders them (using templateExample) and
 * creates a list (using templateIndex)
 */
module.exports = function(templateRoot, templateIndex, templateExample) {
  let latestFile;
  let latestMod;
  let examples;
  let templateIndexName;
  let templateExampleName;
  let templates;

  if (typeof templateRoot === 'string') {
    templates = Templates.get(templateRoot);
  } else {
    throw new PluginError('compile-index-example',
        'Missing template root in template options for gulp-index');
  }

  if (typeof templateIndex === 'string') {
    templateIndexName = templateIndex;
  } else {
    throw new PluginError('compile-index-example',
        'Missing templateIndex name in template options for gulp-index');
  }

  if (typeof templateExample === 'string') {
    templateExampleName = templateExample;
  } else {
    throw new PluginError('compile-index-example',
        'Missing templateExample name in template options for gulp-index');
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

    // create examples list
    if (!examples) {
      examples = [];
    }

    // compile example
    if (file.isBuffer()) {
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
        throw new PluginError({
          plugin: 'compile-example',
          message: 'Example (' + file.path + ') is `experiment`: true, but ' +
            'is missing the `component` metadata'});
      }

      example.metadata = document.metadata;
      examples.push(example);

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
      const html = templates.render(templateExampleName, args);
      file.path = path.join(file.base, example.targetPath());
      file.metadata = document.metadata;
      file.contents = new Buffer(html);
      gutil.log('Generated ' + file.relative);
      stream.push(file);
    }

    cb();
  }

  function endStream(cb) {
    // no examples passed in, no file goes out
    if (!latestFile || !examples) {
      cb();
      return;
    }

    const categories = mapToCategories(examples);
    const stream = this;
    const args = {
      categories: categories,
      title: 'AMP by Example',
      desc: 'Accelerated Mobile Pages in Action',
      fileName: '/'
    };
    Metadata.add(args);
    args.fileName = '';
    const html = templates.render(templateIndexName, args);
    const indexFile = latestFile.clone({contents: false});
    indexFile.path = path.join(latestFile.base, "index.html");
    indexFile.contents = new Buffer(html);
    gutil.log('Generated ' + indexFile.relative);
    stream.push(indexFile);
    cb();
  }

  function mapToCategories(examples) {
    const categories = [];
    let currentCategory;
    sort(examples).forEach(function(exampleFile) {
      // add example to categories instance
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
        url: exampleFile.url(),
        experiment: exampleFile.metadata.experiment
      });
    });
    return categories;
  }

  function sort(examples) {
    examples.sort(function(a, b) {
      return a.filePath.localeCompare(b.filePath);
    });
    return examples;
  }

  return through.obj(bufferContents, endStream);
};
