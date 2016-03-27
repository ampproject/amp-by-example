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

const striptags = require('striptags');
const SENTENCE = /([^.!?]*[.!?])/;
const PARAGRAPH = /\<p\>([\s\S]*)\<\/p\>/;

/**
 * Contains the content of an example.
 */
module.exports = class Document {

  constructor() {
    this.sections = [];
    this.head = '';
    this.styles = '';
    this.title = '';
    this.metadata = '';
  }

  addSection(section) {
    const prevSection = this.lastSection();
    if (prevSection) {
      prevSection.isLastSection = false;
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
   * sentence in the doc strings.
   */
  description() {
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (!section.doc) {
        continue;
      }
      const desc = this.extractDescription(section.markedDoc());
      if (desc) {
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

  /* private */
  extractDescription(htmlString) {
    let desc = this.extractFirstParagraph(htmlString);
    desc = striptags(desc);
    desc = this.extractFirstSentence(desc);
    desc = desc.replace(/[\r?\n]+/, ' ');
    desc = desc.trim();
    return desc;
  }

  extractFirstParagraph(string) {
    const paragraphs = string.match(PARAGRAPH);
    if (!paragraphs) {
      return '';
    }
    return paragraphs[1];
  }

  extractFirstSentence(string) {
    const sentences = string.match(SENTENCE);
    if (!sentences) {
      return string;
    }
    return sentences[1];
  }

  lastSection() {
    return this.sections[this.sections.length-1];
  }

};
