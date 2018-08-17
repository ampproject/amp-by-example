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

const Mustache = require('mustache');
const io = require('./io');
const path = require('path');
const hljs = require('highlight.js');

const beautifyHtml = require('js-beautify').html;
const beautifyJs = require('js-beautify').js;
const BEAUTIFY_OPTIONS = {
  'indent_size': 2,
  'unformatted': ['noscript', 'style'],
  'indent-char': ' ',
  'preserve-newlines': true,
  'extra_liners': []
};
const BEAUTIFY_OPTIONS_JS = {
  'indent_size': 2
};

const PARTIALS_DIR = '../partials/';

const REGEX_SECTION_START = /\{\{#(\S+)\}\}(\s+)/gm;
const REGEX_SECTION_END = /\s+\{\{\/(\S+)\}\}/gm;

function renderTemplate(template, context) {
  return Mustache.render(template, context);
}

function findTemplates(dir) {
  const oldTags = Mustache.tags;
  Mustache.tags = ['<%', '%>'];
  const templates = {};
  const partials = findPartials(path.join(dir, PARTIALS_DIR));
  io.listFiles(dir).forEach(name => {
    const templateName = path.basename(name, path.extname(name));
    templates[templateName] = readTemplate(name, partials);
  });
  Mustache.tags = oldTags;
  return templates;
}

function readTemplate(name, partials) {
  let string = io.readFile(name);
  string = Mustache.render(string, {}, partials);
  const ext = path.extname(name).substring(1);
  if (ext === 'html') {
    string = beautifyHtml(string, BEAUTIFY_OPTIONS);
  } else if (ext === 'js') {
    string = beautifyJs(string, BEAUTIFY_OPTIONS_JS);
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

function replaceEndTag(match) {
  return `</mark>${match}`;
}
function replaceStartTag(match, p1, p2) {
  return `{{#${p1}}}${p2}<mark class="highlight-block ${p1}">`;
}

function findPartials(dir) {
  const partialFiles = io.listFiles(dir, [], true);
  return partialFiles.map(f => {
    return [f.replace(dir, ''), io.readFile(f, 'utf-8')];
  })
  .reduce((obj, prop) => {
    obj[prop[0]] = prop[1];
    return obj;
  }, {});
}
module.exports.find = findTemplates;
module.exports.render = renderTemplate;
