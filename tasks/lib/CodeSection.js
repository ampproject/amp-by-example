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
  highlight: function(code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

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
  }

  appendDoc(doc) {
    doc = this.removeCommentTag(doc);
    this.doc += doc + '\n';
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
      // temporary workaround to fix anchor links breaking
      // links in the text
      if(this.cachedMarkedDoc.trim().startsWith('<h')) {
        this.cachedMarkedDoc = '<div class="anchor-trigger">' +
          this.cachedMarkedDoc +
          '</div>';
      }
    }
    return this.cachedMarkedDoc;
  }

  /* PRIVATE */
  removeCommentTag(string) {
    return string.replace(/\<\!--|--\>/g, '').trim();
  }
};

