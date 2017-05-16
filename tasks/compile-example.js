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
const PluginError = gutil.PluginError;
const DocumentParser = require('../lib/DocumentParser');
const ExampleFile = require('../lib/ExampleFile');
const Metadata = require('../lib/Metadata');
const Templates = require('../lib/Templates');

/**
 * Collects a list of example files, renders them (using templateExample) and
 * creates a list (using templateIndex)
 */
module.exports = function(config, indexPath, updateTimestamp) {
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
      latestFile.section = example.section();
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
    const sections = createSections(examples);
    compileIndex(stream, sections);
    compileSitemap(stream, sections);
    compileExamples(stream);
    cb();
  }

  function compileIndex(stream, sections) {
    sections.forEach(section => {
      const args = require('../data/index.json');

      // clear selection state
      sections.forEach(s => s.selected = false);
      section.selected = true;

      const indexArgs = {
        config: config,
        title: section.title,
        desc: section.desc,
        sections: sections,
        categories: section.categories,
        timestamp: timestamp,
        github: "https://github.com/ampproject/amp-by-example/",
        fileName: '/'
      };
      Object.assign(args, indexArgs);

      Metadata.add(args);
      args.fileName = '';
      const html = pageTemplates.render(config.templates.index, args);
      const indexFile = latestFile.clone({contents: false});
      indexFile.path = path.join(latestFile.base, section.path, "index.html");

      indexFile.contents = new Buffer(html);
      stream.push(indexFile);
    });
  }

  function compileSitemap(stream, sections) {
    const indexFile = latestFile.clone({contents: false});
    indexFile.path = path.join(latestFile.base, "sitemap.json");
    indexFile.contents = new Buffer(JSON.stringify(sections, null, 2));
    stream.push(indexFile);
  }

  function findNextExample(examples, index) {
    const next = examples[index];
    if (!next) {
      return null;
    }
    const metadata = next.document.metadata;
    if (!next.category() || (metadata && metadata.draft)) {
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
      const sections = createSections(examples, example);
      const args = require('../data/index.json');
      const sampleArgs = {
        config: config,
        index: index,
        document: document,
        head: document.head,
        title: example.title() + ' - ' + 'AMP by Example',
        desc: document.description(),
        timestamp: timestamp,
        fileName: example.url(),
        host: config.host,
        urlSource: example.urlSource(),
        urlPreview: previewUrl(example),
        github: example.githubUrl(),
        subHeading: example.title(),
        exampleStyles: document.styles,
        component: document.metadata.component,
        bodyTag: document.body,
        elementsAfterBody: document.elementsAfterBody,
        sections: sections,
        headings: document.headings(),
        metadata: document.metadata,
        nextExample: nextExample,
        skipCanonical: document.hasCanonical(),
        includesManifest: document.includesLink('manifest'),
        includesAnalytics: document.importsComponent('amp-analytics'),
        includesLiveList: document.importsComponent('amp-live-list'),
        includesAccordion: document.importsComponent('amp-accordion'),
        includesSelector: document.importsComponent('amp-selector'),
        includesSidebar: document.importsComponent('amp-sidebar'),
        includesServiceWorker: document.importsComponent('amp-install-serviceworker') || document.metadata.skipServiceWorker
      };
      sampleArgs.supportsAmpSelector = !sampleArgs.includesLiveList && !sampleArgs.includesSelector;
      Object.assign(args, sampleArgs);
      Metadata.add(args);

      // compile source file
      const inputFile = example.file;
      inputFile.path = path.join(inputFile.base, example.targetSourcePath());
      inputFile.contents = new Buffer(
        example.contents.replace(/\<\!\-\-\-\{(.|[\n\r])*\}\-\-\-\>/, '').trim());
      inputFile.metadata = document.metadata;
      //gutil.log('Generated ' + inputFile.relative);
      stream.push(inputFile);

      // compile example
      compileTemplate(stream, example, args, {
        template: config.templates.example,
        targetPath: example.targetPath(),
        isEmbed: false
      });

      // compile embed
      compileTemplate(stream, example, args, {
        template: config.templates.example,
        targetPath: example.targetEmbedPath(),
        isEmbed: true
      });

      // compile example preview
      // the default preview template
      let previewTemplate = config.templates.preview;

      // a4a preview embeds the original sample via iframe
      if (document.isAmpAdSample()) {
        previewTemplate = config.a4a.template;
        // configure a4a preview
        args.width = document.metadata.width || config.a4a.defaultWidth;
        args.height = document.metadata.height || config.a4a.defaultHeight;
        args.layout = document.metadata.layout || config.a4a.defaultLayout;
        args.adContainerHeight = args.height; 
        args.a4aEmbedUrl = example.urlSource();
      }

      args.title = example.title() + ' (Preview) - ' + 'AMP by Example';
      args.desc = "This is a live preview of the '" + example.title() + "' sample. " + args.desc;
      args.canonical = config.host + example.url() + 'preview/';

      // generate preview
      compileTemplate(stream, example, args, {
        template: previewTemplate,
        targetPath: example.targetPreviewPath(),
        isEmbed: false
      });

      // generate preview embed
      compileTemplate(stream, example, args, {
        template: previewTemplate,
        targetPath: example.targetPreviewEmbedPath(),
        isEmbed: true
      });
    });
  }

  function prerenderTemplates(string, config) {
    return sampleTemplates.renderString(string, config);
  }

  function createSections(examples, currentExample) {
    const sections = [];
    let currentCategory;
    let currentSection;
    sort(examples)
      .filter(exampleFile => exampleFile.category() && !exampleFile.document.metadata.draft)
      .forEach(function(exampleFile) {
        // add new section
        if (!currentSection || currentSection.path !== exampleFile.section().path) {
          currentSection = exampleFile.section();
          currentSection.categories = [];
          sections.push(currentSection);
          currentSection.selected = false;
        }
        // add example to categories instance
        if (!currentCategory ||
          currentCategory.name !== exampleFile.category().name) {
          currentCategory = exampleFile.category();
          currentCategory.examples = [];
          currentSection.categories.push(currentCategory);
          currentCategory.selected = false;
        }
        const selected = currentExample &&
          exampleFile.title() == currentExample.title();
        if (selected) {
          currentCategory.selected = selected;
          currentSection.selected = selected;
        }

        const experiments = exampleFile.document.metadata.experiments;

        currentCategory.examples.push({
          title: exampleFile.title(),
          name: exampleFile.name(),
          description: exampleFile.document.description(),
          url: exampleFile.url(),
          urlPreview: previewUrl(exampleFile),
          urlPreviewEmbed: exampleFile.urlPreviewEmbed(),
          urlEmbed: exampleFile.urlEmbed(),
          selected: selected,
          metadata: exampleFile.document.metadata,
          experiments: experiments,
          experiment: experiments && experiments.length > 0,
          highlight: exampleFile.document.metadata.highlight
        });
      });
    return sections;
  }

  function compileTemplate(stream, example, args, options) {
    const document = example.document;
    const inputFile = example.file;
    args.isEmbed = options.isEmbed;
    const sampleHtml = pageTemplates.render(options.template, args);
    args.isEmbed = false;
    const sampleFile = inputFile.clone({contents: false});
    sampleFile.path = path.join(inputFile.base, options.targetPath);
    sampleFile.metadata = document.metadata;
    sampleFile.contents = new Buffer(sampleHtml);
    stream.push(sampleFile);
  }

  function previewUrl(exampleFile) {
    const document = exampleFile.document;
    if (!document.metadata.preview) {
      return null;
    }
    if (document.isAmpAdSample() || document.metadata.preview === 'cache') {
      return cachedUrl(exampleFile.urlPreview());
    } else {
      return exampleFile.urlPreview();
    }
  }

  function cachedUrl(url) {
    return 'https://ampbyexample-com.cdn.ampproject.org/c/s/ampbyexample.com' + url + '?exp=a4a:-1';
  }

  function sort(examples) {
    examples.sort(function(a, b) {
      return a.filePath.localeCompare(b.filePath);
    });
    return examples;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return through.obj(bufferContents, endStream);
};
