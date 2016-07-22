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
module.exports = function(config, updateTimestamp) {
  let latestFile;
  let latestMod;
  let examples;
  let templates;
  let timestamp = new Date().toISOString();

  if (typeof config.templateRoot === 'string') {
    templates = Templates.get(config.templateRoot);
  } else {
    throw new PluginError('compile-index-example',
        'Missing template root in template options for compile-example');
  }

  if (typeof config.templateIndex != 'string') {
    throw new PluginError('compile-index-example',
        'Missing templateIndex name in template options for compile-example');
  }

  if (typeof config.templateExample != 'string') {
    throw new PluginError('compile-index-example',
        'Missing templateExample name in template options for compile-example');
  }

  if (updateTimestamp == false) {
    timestamp = 0;
  }

  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    // we don't do streams
    if (file.isStream()) {
      this.emit('error', new PluginError('compile-example',
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

    // parse examples into documents and add metadata
    if (file.isBuffer()) {
      const example = ExampleFile.fromPath(file.path);
      const contents = file.contents.toString();
      example.document = DocumentParser.parse(contents);
      example.file = file;
      examples.push(example);
    }

    cb();
  }

  function endStream(cb) {
    // no examples passed in, no file goes out
    if (!latestFile || !examples) {
      cb();
      return;
    }

    const stream = this;
    compileIndex(stream);
    compileExamples(stream);

    cb();
  }

  function compileIndex(stream) {
    const args = {
      categories: mapToCategories(examples),
      title: 'AMP by Example',
      desc: 'A hands-on introduction to Accelerated Mobile Pages (AMP) ' +
        'focusing on code and live samples. Learn how to create AMP pages ' +
        'and see examples for all AMP components.',
      timestamp: timestamp,
      github: "https://github.com/ampproject/amp-by-example/",
      fileName: '/'
    };

    Metadata.add(args);
    args.fileName = '';
    const html = templates.render(config.templateIndex, args);
    const indexFile = latestFile.clone({contents: false});
    indexFile.path = path.join(latestFile.base, "index.html");
    indexFile.contents = new Buffer(html);
    gutil.log('Generated ' + indexFile.relative);
    stream.push(indexFile);

  }

  function compileExamples(stream) {
    examples.forEach(function(example) {
      const document = example.document;
      const file = example.file;
      const nextExample = example.nextFile();
      const args = {
        head: document.head,
        title: example.title() + ' - ' + 'AMP by Example',
        desc: document.description(),
        timestamp: timestamp,
        fileName: example.url(),
        github: example.githubUrl(),
        subHeading: example.title(),
        exampleStyles: document.styles,
        categories: mapToCategories(examples, example),
        component: document.metadata.component,
        sections: document.sections,
        metadata: document.metadata,
        nextExample: nextExample,
        skipCanonical: document.hasCanonical(),
        includesAnalytics: document.importsComponent('amp-analytics'),
        includesServiceWorker: document.importsComponent('amp-install-serviceworker')
      };
      Metadata.add(args);

      if (document.metadata.experiment && !document.metadata.component) {
        throw new PluginError({
          plugin: 'compile-example',
          message: 'Example (' + file.path + ') is `experiment`: true, but ' +
            'is missing the `component` metadata'});
      }

      // compile example
      const sampleHtml = templates.render(config.templateExample, args);
      file.path = path.join(file.base, example.targetPath());
      file.metadata = document.metadata;
      file.contents = new Buffer(sampleHtml);
      gutil.log('Generated ' + file.relative);
      stream.push(file);

      // compile example preview
      if (document.metadata.preview) {
        const previewFile = file.clone({contents: false});
        const previewHtml = templates.render(config.templatePreview, args);
        previewFile.path = path.join(file.base, example.targetPreviewPath());
        previewFile.metadata = document.metadata;
        previewFile.contents = new Buffer(previewHtml);
        gutil.log('Generated ' + previewFile.relative);
        stream.push(previewFile);
      }
    });
  }

  function mapToCategories(examples, currentExample) {
    const categories = [];
    let currentCategory;
    sortedExamples(examples)
      .filter(exampleFile => exampleFile.category() && !exampleFile.document.metadata.draft)
      .forEach(function(exampleFile) {
        // add example to categories instance
        if (!currentCategory ||
          currentCategory.name != exampleFile.category().name) {
          currentCategory = exampleFile.category();
          currentCategory.examples = [];
          if (currentExample) {
            currentCategory.selected =
              (currentCategory.name == currentExample.category().name);
          }
          categories.push(currentCategory);
        }
        const selected = currentExample &&
          exampleFile.title() == currentExample.title();

        currentCategory.examples.push({
          title: exampleFile.title(),
          name: exampleFile.name(),
          description: exampleFile.document.description(),
          url: exampleFile.url(),
          selected: selected,
          experiment: exampleFile.document.metadata.experiment,
          highlight: exampleFile.document.metadata.highlight
        });
      });
    return sortedCategories(categories);
  }

  function sortedExamples(examples) {
    examples.sort(function(a, b) {
      return a.filePath.localeCompare(b.filePath);
    });
    return examples;
  }

  function sortedCategories(categories) {
    categories.sort(function(a, b) {
      return a.position - b.position;
    });
    return categories;
  }

  return through.obj(bufferContents, endStream);
};
