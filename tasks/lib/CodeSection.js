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
  }

  appendDoc(doc) {
    this.doc += this.normalizeDoc(doc) + '\n';
    this.cachedMarkedDoc = false;
  }

  appendCode(code) {
    this.code += code + '\n';
  }

  appendPreview(code) {
    this.preview += code + '\n';
  }

  escapedCode() {
    const result = S(this.code).trimRight().s;
    return highlight('html', result).value;
  }

  markedDoc() {
    if (!this.cachedMarkedDoc) {
      this.cachedMarkedDoc = marked(this.doc);
    }
    return this.cachedMarkedDoc;
  }

  hideDocOnMobile() {
    return !this.doc.trim();
  }

  hidePreviewOnMobile() {
    return this.hideCodeOnMobile() || !this.preview.trim();
  }

  hideCodeOnMobile() {
    return this.hideDocOnMobile() || !this.code.trim();
  }

  /* PRIVATE */

  /**
   * Normalizes a string based on the indentation of the comment tag.
   * Substracts the comment tag indentation from all following lines.
   */
  normalizeDoc(string) {
    let startIndex = string.indexOf(COMMENT_START);
    if (startIndex == -1) {
      startIndex = this.stripLeadingWhitespace(string);
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

  stripLeadingWhitespace(string) {
    let startIndex = 0;
    for (let i = 0; i < this.commentOffset; i++) {
      if (string.charAt(i) == ' ') {
        startIndex++;
      } else {
        break;
      }
    }
    return startIndex;
  }
};

