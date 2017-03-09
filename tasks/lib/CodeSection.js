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

"use strict";

const S = require('string');
const highlight = require('highlight.js').highlight;
const marked = require('marked');
const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  return '<h' + level + ' id="' + escapedText +
    '" class="www-heading pb4 mb2 relative h3">' + text + '</h' + level +
    '>';
};
renderer.paragraph = function (text) {
  return '<p class="mb2 px1">' + text + '</p>';
};

const encodedTemplateRegexp = /\[\[\s*<.*?>([A-Za-z]*?)\s*(<.*?>)?(\.[A-Za-z]*)?\s*<\/span>\s*\]\]/g

marked.setOptions({
  highlight: function(code, lang) {
    if (lang) {
      return highlight(lang, code).value;
    } else {
      return S(code).escapeHTML().s;
    }
  }
});
const COMMENT_START = '<!--';
const COMMENT_END = '-->';
const HIDDEN_LINE_COUNT_THRESHOLD = 1;

module.exports = class CodeSection {

  constructor(doc, code, preview) {
    if (!arguments.length) {
      doc = '';
      code = '';
      preview = '';
    }
    this.doc = doc;
    this.code = code;
    this.preview = preview;
    this.inBody = false;
    this.id = 0;
    this.cachedMarkedDoc = false;
    this.isLastSection = true;
    this.isFirstSection = false;
    this.commentOffset = 0;
    this.codeOffset = 0;
    this.headings = [];
  }

  appendDoc(doc) {
    const normalizedDoc = this.normalizeDoc(doc);
    this.extractHeadings(normalizedDoc);
    this.doc += normalizedDoc + '\n';
    this.cachedMarkedDoc = false;
  }

  appendCode(code) {
    if (!this.code) {
      this.codeOffset = code.search(/\S|$/);
    }
    const startIndex = this.stripLeadingWhitespace(code, this.codeOffset);
    this.code += code.substring(startIndex) + '\n';
  }

  appendPreview(code) {
    this.preview += code + '\n';
  }

  escapedCode() {
    const result = S(this.code).trimRight().s;
    return this.cleanUpCode(highlight('html', result).value);
  }

  markedDoc() {
    if (!this.cachedMarkedDoc) {
      this.cachedMarkedDoc = marked(this.doc, {
        renderer: renderer
      });
    }
    return this.cachedMarkedDoc;
  }

  hideDocOnMobile() {
    return !this.doc.trim();
  }

  hidePreviewOnMobile() {
    return this.hideCodeOnMobile() || !this.preview.trim();
  }

  isEmptyCodeSection() {
    return this.code.trim().length === 0;
  }

  showPreview() {
    return !this.isEmptyCodeSection() && this.inBody;
  }

  hideCodeOnMobile() {
    return this.hideDocOnMobile() || this.isEmptyCodeSection();
  }

  hideColumns() {
    return !this.doc.trim() && this.shouldHideSection(this.code);
  }

  /* PRIVATE */
  shouldHideSection(str) {
    const lines = str.trim().split(/\r\n|\r|\n/);
    return lines.length > HIDDEN_LINE_COUNT_THRESHOLD || lines.some(this.isBoilerplate);
  }

  isBoilerplate(str) {
    return str.trim().startsWith('<style amp-boilerplate>')
  }

  /**
   * Normalizes a string based on the indentation of the comment tag.
   * Substracts the comment tag indentation from all following lines.
   */
  normalizeDoc(string) {
    let startIndex = string.indexOf(COMMENT_START);
    if (startIndex == -1) {
      startIndex = 
        this.stripLeadingWhitespace(string, this.commentOffset);
    } else {
      this.commentOffset = startIndex;
      startIndex = startIndex + COMMENT_START.length;
    }
    let endIndex = string.indexOf(COMMENT_END);
    if (endIndex == -1) {
      endIndex = string.length;
    }
    return string.substring(startIndex, endIndex);
  }

  stripLeadingWhitespace(string, offset) {
    let startIndex = 0;
    for (let i = 0; i < offset; i++) {
      if (string.charAt(i) === ' ') {
        startIndex++;
      } else {
        break;
      }
    }
    return startIndex;
  }

  cleanUpCode(input) {
    return input.replace(encodedTemplateRegexp,"[[$1 $3]]");
  }

  extractHeadings(line) {
    const matches = line.match(/^\s*#+\s*(.+)$/m);
    if (!matches) {
      return;
    }
    const name = matches[1].trim();
    const heading = {
      id: name.toLowerCase().replace(/[^\w]+/g, '-'),
      name: name
    };
    this.headings.push(heading);
  };
};

