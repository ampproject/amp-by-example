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
const PARAGRAPH = /\<p(\s[^\>]+)?\>([\s\S]*?)\<\/p\>/;

/**
 * Contains the content of an example.
 */
module.exports = class Document {

  constructor() {
    this.sections = [];
    this.head = '';
    this.styles = '';
    this.title = '';
    this.metadata = {};
    this.body = '';
    this.elementsAfterBody = '';
  }

  addSection(section) {
    const prevSection = this.lastSection();
    if (prevSection) {
      prevSection.isLastSection = false;
    } else {
      section.isFirstSection = true;
    }
    this.sections.push(section);
  }

  appendHead(line) {
    this.head += line + '\n';
  }

  appendStyles(line) {
    this.styles += line + '\n';
  }

  /**
   * Returns a short description consisting of the first
   * sentence in the doc strings. The description may contain
   * some html tags (code).
   */
  description() {
    if (this._description) {
      return this._description;
    }
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (!section.doc) {
        continue;
      }
      const desc = this.extractDescription(section.markedDoc());
      if (desc) {
        this._description = desc;
        return desc;
      }
    }
    return '';
  }

  /**
   * Returns true if the document contains a canonical link
   */
  hasCanonical() {
    return this.head.indexOf('rel="canonical"') > -1;
  }

  /**
   * Returns true if the document imports the given component
   */
  importsComponent(componentName) {
    return this.head.indexOf('custom-element="' + componentName + '"') > -1;
  }

  includesLink(relType) {
    return this.head.indexOf('rel="' + relType + '"') > -1;
  }

  /* private */
  extractDescription(htmlString) {
    let desc = this.extractFirstParagraph(htmlString);
    desc = S(desc).stripTags().s;
    desc = this.extractFirstSentence(desc);
    desc = desc.trim();
    desc = S(desc).decodeHTMLEntities().s;
    return desc;
  }

  extractFirstParagraph(string) {
    const paragraphs = PARAGRAPH.exec(string);
    if (!paragraphs) {
      return '';
    }
    return paragraphs[2];
  }

  extractFirstSentence(str) {
    let current;
    let prev;
    const result = [];
    for (var i = 0, len = str.length; i < len; i++) {
      current = str[i];
      if (prev == '.' && (current === ' ' || current === '\r' || current === '\n' )) {
        break;
      }
      if (current !== '\r' && current !== '\n') {
        result.push(current);
      }
      if (prev !== '\n' && current === '\n') {
        result.push(' ');
      }
      prev = current;
    }
    return result.join('');
  }

  lastSection() {
    return this.sections[this.sections.length - 1];
  }

};
