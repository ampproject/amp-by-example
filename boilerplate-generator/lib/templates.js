/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const Handlebars = require('handlebars');
const io = require('./io');
const path = require('path');
const hljs = require('highlight.js');

const beautifyHtml = require('js-beautify').html;
const beautifyJs = require('js-beautify').js;
const BEAUTIFY_OPTIONS = {
  unformatted: ['code', 'pre', 'em', 'strong', 'span', 'noscript', 'style'],
  content_unformatted: ['pre'],
  indent_inner_html: true,
  indent_char: ' ',
  indent_size: 2,
  preserve_newlines: true,
  max_preserve_newlines: 2,
  wrap_attributes: 'aligned-multiple',
  wrap_line_length: 80,
  sep: '\n',
  no_preserve_newlines: '',
  extra_liners: []
};
const BEAUTIFY_OPTIONS_JS = {
  'indent_size': 2
};

const PARTIALS_DIR = '../partials/';

const REGEX_SECTION_START = /(\s*)\{\{#([^\}]+)\}\}(\s*)/gm;
const REGEX_SECTION_END = /(\s*)\{\{\/([^\}]+)\}\}(\s*)/gm;

function renderTemplate(template, context={}) {
  return Handlebars.compile(template, {compat: true})(context);
}

function findTemplates(dir) {
  const templates = {};
  const partials = findPartials(path.join(dir, PARTIALS_DIR));
  Handlebars.registerPartial(partials);
  io.listFiles(dir).forEach(name => {
    const templateName = path.basename(name, path.extname(name));
    templates[templateName] = readTemplate(name, partials);
  });
  return templates;
}

function readTemplate(name, partials) {
  let string = io.readFile(name);
  string = renderTemplate(string);
  let ext = path.extname(name).substring(1);
  if (ext === 'html') {
    //string = beautifyHtml(string, BEAUTIFY_OPTIONS);
  } else if (ext === 'js') {
    string = beautifyJs(string, BEAUTIFY_OPTIONS_JS);
    ext = 'javascript';
  }
  string = hljs.highlight(ext, string).value;
  if (ext === 'html') {
    string = highlightSections(string);
  }
  return string;
}

function highlightSections(string) {
  string = string.replace(REGEX_SECTION_START, replaceStartTag);
  string = string.replace(REGEX_SECTION_END, replaceEndTag);
  return string;
}

function replaceStartTag(match, p1, p2, p3) {
  const replacement = `${match}<mark class="highlight-block">`;
  return replacement;
}
function replaceEndTag(match, p1, p2, p3) {
  let replacement =  `</mark>${match}`;
  return replacement;
}

function findPartials(dir) {
  const partialFiles = io.listFiles(dir, [], true);
  return partialFiles.map(f => {
    const name = f.replace(dir, '');
    const content = io.readFile(f, 'utf-8');
    return [name, content];
  })
  .reduce((obj, prop) => {
    obj[prop[0]] = prop[1];
    return obj;
  }, {});
}
module.exports.find = findTemplates;
module.exports.render = renderTemplate;
