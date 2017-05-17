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

const CodeSection = require('./CodeSection');
const Document = require('./Document');
const elementSorting = require('./ElementSorting');
const beautifyHtml = require('js-beautify').html;

const SINGLE_LINE_TAGS = ['link', 'meta', '!doctype'];

/* eslint-disable */
const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  "wrap_attributes": "force",
  //"wrap_attributes_indent_size": 4,
  unformatted: ['noscript', 'style', 'head'],
  'indent-char': ' ',
  'no-preserve-newlines': '',
  'extra_liners': []
};
/* eslint-enable */

/**
 * Parses an input HTML file and splits it into sections. A section is defined
 * by:
 *
 * - starts with an HTML comment
 * - spans the next tag and its children after a comment
 */
module.exports.parse = function(input) {
  input = beautifyHtml(input, BEAUTIFY_OPTIONS);
  const parsing = new DocumentParser(input.split('\n'));
  parsing.execute();
  elementSorting.apply(parsing.document);
  return parsing.document;
};

class DocumentParser {

  constructor(lines) {
    this.lines = lines;
    this.document = new Document();
    this.inComment = false;
    this.currentTag = '';
    this.currentTagCounter = 0;
    this.inBody = false;
    this.inMetadata = false;
    this.metadata = '';
  }

  execute() {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('<!--')) {
        if (trimmedLine.startsWith('<!---')) {
          this.inMetadata = true;
        } else {
          this.newSection();
          this.inComment = true;
        }
      }
      if (this.inComment) {
        this.currentSection().appendDoc(line);
      }
      if (this.inMetadata) {
        this.appendMetadata(line);
      }
      if (!this.inComment && !this.inMetadata) {
        this.updatePreview(line);
        this.currentSection().appendCode(line);
        this.updateHead(line);
        if (this.endOfCurrentTag(line)) {
          // console.log("end tag: " + this.currentTag);
          this.endSection();
          this.currentTag = '';
        }
      }
      if (trimmedLine.endsWith('-->')) {
        if (trimmedLine.endsWith('--->')) {
          this.inMetadata = false;
          try {
            this.document.metadata = JSON.parse(this.metadata);
          } catch (err) {
            throw new Error(
              "There is an error in the JSON metadata at line " + (i + 1));
          }
        } else {
          this.inComment = false;
          this.currentTag = this.nextTag(i);
          // console.log("start tag: " + this.currentTag);
        }
      }
    }
  }

  /* private */

  updateHead(line) {
    if (this.extractTag(line) == 'head') {
      this.inHead = true;
      return;
    }
    if (!this.inHead) {
      return;
    }
    if (this.extractEndTag(line) == 'head') {
      this.inHead = false;
      return;
    }
    if (!this.document.title) {
      const title = /\s*<title>(.*?)<\/title>/g.exec(line);
      if (title) {
        this.document.title = title[1];
      }
    }
    if (line.indexOf('<style amp-custom>') > -1) {
      this.inStyles = true;
      return;
    }
    if (this.inStyles) {
      if (this.extractEndTag(line) == 'style') {
        this.inStyles = false;
      } else {
        this.document.appendStyles(line);
      }
      return;
    }
    this.document.appendHead(line);
  }

  updatePreview(line) {
    if (this.extractTag(line) == 'body') {
      this.inBody = true;
      this.document.body = this.extractTagValue(line, 'body');
      return;
    }
    if (!this.inBody) {
      return;
    }
    if (this.extractEndTag(line) == 'body') {
      this.inBody = false;
      // end section to show body tag below preview
      this.endSection();
      return;
    }
    this.currentSection().appendPreview(line);
  }

  endSection() {
    this.section = null;
  }

  endOfCurrentTag(line) {
    if (!this.currentTag) {
      return false;
    }

    const tag = this.extractTag(line);
    if (SINGLE_LINE_TAGS.indexOf(tag) > -1) {
      return true;
    }
    if (tag == this.currentTag) {
      this.currentTagCounter++;
    }
    const endTag = this.extractEndTag(line);
    if (endTag == this.currentTag) {
      this.currentTagCounter--;
    }
    return endTag == this.currentTag && this.currentTagCounter == 0;
  }

  nextTag(index) {
    const nextIndex = index + 1;
    const nextLine = this.lines[nextIndex];
    if (nextLine == null) {
      // end of file
      return '';
    }
    if (nextLine.trim() == '') {
      return this.nextTag(nextIndex);
    }
    const nextTag = this.extractTag(nextLine);
    this.currentTagCounter = 0;
    return nextTag;
  }

  extractTag(string) {
    const start = string.indexOf('<');
    const nextChar = string.charAt(start + 1);
    if (nextChar == '/' || nextChar == '!') {
      return '';
    }
    const closingBracket = string.indexOf('>', start);
    const nextSpace = string.indexOf(' ', start);
    if (closingBracket == -1 && nextSpace == -1) {
      return '';
    }
    let end = closingBracket;
    if ((nextSpace > -1 && nextSpace < closingBracket) ||
        closingBracket == -1) {
      end = nextSpace;
    }
    return string.substring(start + 1, end);
  }

  extractEndTag(string) {
    const start = string.indexOf('</');
    if (start == -1) {
      return '';
    }
    const end = string.indexOf('>', start);
    if (end == -1) {
      return '';
    }
    return string.substring(start + 2, end);
  }

  currentSection() {
    if (!this.section) {
      this.newSection();
    }
    return this.section;
  }

  newSection() {
    this.section = new CodeSection();
    this.section.inBody = this.inBody;
    this.section.id = this.document.sections.length;
    this.document.addSection(this.section);
  }

  removeMetadataTag(string) {
    return string.replace(/\<\!---|---\>/g, '').trim();
  }

  appendMetadata(metadata) {
    metadata = this.removeMetadataTag(metadata);
    this.metadata += metadata + '\n';
  }

  extractTagValue(string, tagName) {
    const start = string.indexOf('<' + tagName);
    const end = string.indexOf('>') + 1;
    return string.substring(start, end);
  }

};

module.exports.DocumentParser = DocumentParser;
