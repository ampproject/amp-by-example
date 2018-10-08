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

const Hogan = require('hogan.js');
const fs = require('fs');
const glob = require('glob');
const slug = require('slug');
const pygmentize = require('pygmentize-bundled');
const minify = require('html-minifier').minify;
const path = require('path');
const mkdirp = require('mkdirp').sync;
const phantom = require('phantom');

const DocumentParser = require('./DocumentParser');

const templatesDir = path.join(__dirname, '../templates/embed');

const templates = {
  embed: compileTemplate('embed.html'),
  template: compileTemplate('template.html'),
  preview: compileTemplate('preview.html'),
  styles: compileTemplate('styles.css'),
  embedJs: compileTemplate('embed.js'),
};

/**
 * Reads all html files in a folder and generates the embeds.
 */
function generateEmbeds(config) {
  glob(config.src + '/**/*.html', {}, (err, files) => {
    files.forEach(file => generateEmbed(config, file));
  });
};

/**
 * Generates embeds for a given file.
 */
function generateEmbed(config, file) {
  const targetPath = path.join(config.destDir, path.relative(config.src, file));
  const document = parseDocument(file);
  const sampleSections = document.sections.filter(
    s => s.inBody && !s.isEmptyCodeSection()
  );
  sampleSections.forEach((section, index) => {
    highlight(section.codeSnippet()).then(code => {
      const tag = section.doc ? slug(section.doc.toLowerCase()) : index;
      const context = {
        sample: {
          file: path.basename(targetPath),
          preview: addFlag(targetPath, tag, 'preview'),
          embed: addFlag(targetPath, tag, 'embed'),
          template: addFlag(targetPath, tag, 'template'),
          body: section.code,
          code: code,
        },
        config: config,
        document: document,
      };
      generate(context.sample.preview, templates.preview, context, /* minify */ true);
      generate(context.sample.embed, templates.embed, context, /* minify */ true);
      generateTemplate(context);
    });
  });
};

/**
 * Syntax highlights a string.
 */
function highlight(code) {
  return new Promise((resolve, reject) => {
    pygmentize({ lang: 'html', format: 'html' }, code, function (err, result) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result.toString());
      };
    });
  });
};

/**
 * Renders the given template into a file.
 */
function generate(file, template, context, minifyResult) {
  let string = template.render(context, {
    'styles.css': templates.styles,
    'embed.js': templates.embedJs
  });
  if (minifyResult) {
    string = minify(string, {
      caseSensitive: true,
      collapseWhitespace: true,
      html5: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeAttributeQuotes: true
    });
  };
  writeFile(path.join(context.config.destRoot, file), string);
};

/**
 * Appends a list of flags separated by a '.' to a filename.
 */
function addFlag() {
  const filename = arguments[0];
  const postfix = [].slice.call(arguments, 1).join('.');
  return filename.replace('.html', '.' + postfix + '.html');
};

/**
 * Parses an ABE document from a file.
 */
function parseDocument(file) {
  const inputString = fs.readFileSync(file, 'utf-8');
  return DocumentParser.parse(inputString);
};

/**
 * Opens the embed html file in a browser to determine the initial height.
 */
function generateTemplate(context) {
  let _page;
  let _phantom;
  phantom.create([], { logLevel: 'error' }).then(function (ph) {
    _phantom = ph;
    ph.createPage()
    .then(page => {
      _page = page;
      const url = path.join(context.config.destRoot, context.sample.embed);
      return _page.property('viewportSize', {width: 1024, height: 768})
        .then(() => _page.open(url) );
    })
    .then(status => {
      return _page.evaluate(function() {
        const element = document.querySelector('#source-panel');
        const height = element.getBoundingClientRect().top + element.offsetHeight;
        return height;
      });
    })
    .then(height => {
      context.sample.height = height;
      generate(context.sample.template, templates.template, context);
    })
    .then(() => {
      _page.close();
      _phantom.exit();
    })
    .catch(err => console.log(err));
  });
};

function compileTemplate(filePath) {
  let string = fs.readFileSync(path.join(templatesDir, filePath), 'utf8');
  return Hogan.compile(string);
};

function writeFile(filePath, content) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
};

module.exports = generateEmbeds;
