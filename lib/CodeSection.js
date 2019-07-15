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

const hljs = require('highlight.js');
const marked = require('marked');
const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  const escapedText = text.toLowerCase().replace(/\s+/g, '-');
  return '<h' + level + ' id="' + escapedText +
    '" class="www-heading pb4 mb2 relative h3">' + text + '</h' + level +
    '>';
};
renderer.paragraph = function (text) {
  return '<p class="mb2 px1">' + text + '</p>';
};

const encodedTemplateRegexp = /\[\[\s*<.*?>([A-Za-z]*?)\s*(<.*?>)?(\.[A-Za-z]*)?\s*<\/span>\s*\]\]/g

const hintStartPlaceholder = 'START_HINT';
const hintStartRegexp = new RegExp(`<span class="hljs-comment">&lt;!--${hintStartPlaceholder}_(\\d+)--&gt;</span>\\n?`, 'g');
const hintEndPlaceholder = 'END_HINT';
const hintEndRegexp = new RegExp(`<span class="hljs-comment">&lt;!--${hintEndPlaceholder}--&gt;</span>\\n?`, 'g');

// `${hintStartHtmlOpen} <hint text> ${hintStartHtmlClose} <element> ${hintEndHtml}`
const hintStartHtmlOpen = '<label class="has-hint"><input class="show-hint" type="checkbox"><div class="hint">';
const hintStartHtmlClose = '</div>';
const hintEndHtml = '</label>';

marked.setOptions({
  highlight: function(code, lang) {
    if (lang) {
      return hljs.highlight(lang, code).value;
    } else {
      return hljs.highlightAuto(code).value;
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
    this.doc_ = doc;
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
    this.storyPageId = '';
    this.currentHint = '';
    this.hints = [];
    this.filters = null;
  }

  appendDoc(doc) {
    doc = doc.replace(/<!--|-->/gm, '') + '\n';
    doc = this.parseFilters(doc);
    this.extractHeadings(doc);
    this.doc_ += doc;
    this.cachedMarkedDoc = false;
  }

  appendCode(code) {
    if (!this.code) {
      this.codeOffset = code.search(/\S|$/);
    }
    const startIndex = this.stripLeadingWhitespace(code, this.codeOffset);
    this.code += code.substring(startIndex) + '\n';
  }

  appendHint(hint) {
    if (!this.currentHint) {
      this.appendCode(`<!--${hintStartPlaceholder}_${this.hints.length}-->`);
    }
    this.currentHint += hint;
  }

  endHint() {
    let hint = this.currentHint.replace(/<!--~(.*?)~-->/, '$1')
    hint = hint.replace(/\s+/g, ' ').trim();
    this.hints.push(hint);
    this.currentHint = '';
    this.appendCode(`<!--${hintEndPlaceholder}-->`);
  }

  appendPreview(code) {
    this.preview += code + '\n';
  }

  escapedCode() {
    const result = this.highlight('html', this.codeSnippet());
    return this.cleanUpCode(result);
  }

  codeSnippet() {
    let result = this.code.replace(/~+$/, ''); // trim right
    return this.normalizeLeadingWhitespace(this.removeWrapperDiv(result));
  }

  get doc() {
    if (!this.normalizedDoc_) {
      this.normalizedDoc_ = this.normalizeLeadingWhitespace(this.doc_);
    }
    return this.normalizedDoc_;
  }

  markedDoc() {
    if (!this.cachedMarkedDoc) {
      this.cachedMarkedDoc = marked(this.doc, {
        renderer: renderer
      });
    }
    return this.cachedMarkedDoc;
  }

  isEmptyCodeSection() {
    return this.code.trim().length === 0;
  }

  showPreview() {
    return !this.isEmptyCodeSection() && this.inBody;
  }

  hideColumns() {
    return !this.doc.trim() && this.shouldHideSection(this.code);
  }

  storyPageVariableId() {
    return this.storyPageId.replace(/-/g, '');
  }

  /* PRIVATE */
  removeCommentTags(string) {
  }
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
    string = string.substring(startIndex, endIndex);
    return string;
  }

  normalizeLeadingWhitespace(string) {
    let lines = string.replace(/\t/g, '  ').split(/\r?\n/);
    let offset = Number.MAX_SAFE_INTEGER;
    for (let line of lines) {
      if (line.trim().length > 0) {
        const lineOffset = this.stripLeadingWhitespace(line, line.length);
        offset = offset > lineOffset ? lineOffset : offset;
      }
    }
    offset = offset === Number.MAX_SAFE_INTEGER ? 0 : offset;
    lines = lines.map(line => {
      line = line.substring(offset);
      // remove leading whitespace from headings for markdown compatibility
      const trimmedString = line.trim();
      if (trimmedString.startsWith('#')) {
        line = trimmedString;
      }
      return line;
    });
    return lines.join('\n');
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

  removeWrapperDiv(string) {
    const lines = string.trim().split('\n');
    if (lines.length < 2) {
      return string;
    }
    const firstLine = lines[0];
    const lastLine = lines[lines.length-1];
    if (!firstLine.startsWith('<div>') || !lastLine.endsWith('</div>')) {
      return string;
    }
    return lines.slice(1, lines.length-1).join('\n');
  }

  parseFilters(line) {
    const filterMatch = line.match(/@filter\(([^)]+)\)/);
    if (!filterMatch) {
      return line;
    }
    if (this.filters) {
      throw new Error('Multiple @filter annotations found in section');
    }
    this.filters = filterMatch[1].split(',').map(f => f.trim());
    return line.replace(filterMatch[0], '');
  }

  extractHeadings(line) {
    const matches = line.match(/^\s*#+\s*(.+)$/m);
    if (!matches) {
      return;
    }
    const name = matches[1].trim().replace(/`/g, '');
    const heading = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name
    };
    this.headings.push(heading);
  }

  replaceHints(html) {
    const result = html.replace(hintStartRegexp, (matches, id) => {
      id = Number(id);
      const hint = this.hints[id];
      return `${hintStartHtmlOpen}${hint}${hintStartHtmlClose}`;
    });
    return result.replace(hintEndRegexp, hintEndHtml);
  }

  highlight(name, value) {
    let result = hljs.highlight(name, value).value;
    result = this.replaceHints(result);
    return result;
  }
};
