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
const fs = require('fs');
const mkdirp = require('mkdirp');
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
  let sampleTemplates;
  let pageTemplates;

  let latestFile;
  let latestMod;
  let examples;
  let timestamp = new Date().toISOString();

  if (typeof config.templates.root === 'string') {
    pageTemplates = Templates.get(config.templates.root,/* minify */ true);
    sampleTemplates = Templates.get(config.templates.root,/* minify */ false, '<% %>');
  } else {
    throw new PluginError('compile-index-example',
        'Missing template root in template options for compile-example');
  }

  if (typeof config.templates.index != 'string') {
    throw new PluginError('compile-index-example',
        'Missing templateIndex name in template options for compile-example');
  }

  if (typeof config.templates.example != 'string') {
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
      const contents = prerenderTemplates(file.contents.toString(), config);
      example.document = DocumentParser.parse(contents);
      example.file = file;
      example.contents = contents;
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
      config: config,
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
    const html = pageTemplates.render(config.templates.index, args);
    const indexFile = latestFile.clone({contents: false});
    indexFile.path = path.join(latestFile.base, "index.html");
    indexFile.contents = new Buffer(html);
    gutil.log('Generated ' + indexFile.relative);
    stream.push(indexFile);
  }

  function findNextExample(examples, index) {
      const next = examples[index];
      if (!next) {
        return null;
      }
      const metadata = next.document.metadata;
      if (metadata && metadata.draft) {
        return findNextExample(examples, index+1);
      }
      return next;
  }

  function compileExamples(stream) {
    examples.forEach(function(example, index) {
      const document = example.document;
      const file = example.file;
      let nextExample = '';
      if (example.category()) {
        nextExample = findNextExample(examples, index + 1);
      }
      const args = {
        config: config,
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
        includesAccordion: document.importsComponent('amp-accordion'),
        includesSidebar: document.importsComponent('amp-sidebar'),
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
      const sampleHtml = pageTemplates.render(config.templates.example, args);
      file.path = path.join(file.base, example.targetPath());
      file.metadata = document.metadata;
      file.contents = new Buffer(sampleHtml);
      gutil.log('Generated ' + file.relative);
      stream.push(file);

      // compile example preview
      if (document.metadata.preview) {
        // the default preview template
        let previewTemplate = config.templates.preview;

        // a4a preview embeds the original sample via iframe
        if (document.metadata.preview.toLowerCase() == "a4a") {
          previewTemplate = config.a4a.template;
          // copy ad sample to api app engine folder
          const previewPath = path.join(config.api.dist, example.targetPath());
          mkdirp.sync(path.dirname(previewPath));
          fs.writeFileSync(previewPath, example.contents);
          gutil.log('Generated ' + previewPath);
          // configure a4a preview
          args.width = document.metadata.width || config.a4a.defaultWidth;
          args.height = document.metadata.height || config.a4a.defaultHeight;
          args.adContainerHeight = args.height + config.a4a.adContainerLabelHeight;
          args.a4aEmbedUrl = config.api.host + '/' + example.targetPath();
        }

        // generate prewiew 
        args.title = example.title() + ' (Preview) - ' + 'AMP by Example';
        args.desc = "This is a live preview of the '" + example.title() + "' sample. " + args.desc;
        args.canonical = config.host + example.url() + 'preview/';
        const previewFile = file.clone({contents: false});
        const previewHtml = pageTemplates.render(previewTemplate, args);
        previewFile.path = path.join(file.base, example.targetPreviewPath());
        previewFile.metadata = document.metadata;
        previewFile.contents = new Buffer(previewHtml);
        gutil.log('Generated ' + previewFile.relative);
        stream.push(previewFile);
      }
    });
  }

  function prerenderTemplates(string, config) {
    return sampleTemplates.renderString(string, config);
  }

  function mapToCategories(examples, currentExample) {
    const categories = [];
    let currentCategory;
    sort(examples)
      .filter(exampleFile => exampleFile.category() && !exampleFile.document.metadata.draft)
      .forEach(function(exampleFile) {
        // add example to categories instance
        if (!currentCategory ||
          currentCategory.name != exampleFile.category().name) {
          currentCategory =  exampleFile.category();
          currentCategory.examples = [];
          if (currentExample) {
            currentCategory.selected =
              (currentCategory.name == currentExample.category().name);
          }
          categories.push(currentCategory);
        }
        const selected = currentExample &&
          exampleFile.title() == currentExample.title();

        let exampleUrl = exampleFile.url();
        if(exampleFile.document.metadata.default == 'preview') {
          exampleUrl += "preview/";
        }

        currentCategory.examples.push({
          title: exampleFile.title(),
          name: exampleFile.name(),
          description: exampleFile.document.description(),
          url: exampleUrl,
          selected: selected,
          experiment: exampleFile.document.metadata.experiment,
          highlight: exampleFile.document.metadata.highlight
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
