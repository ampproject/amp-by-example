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

const yaml = require('js-yaml');

const CodeSection = require('./CodeSection');
const Document = require('./Document');
const elementSorting = require('./ElementSorting');
const beautifyHtml = require('js-beautify').html;

const SINGLE_LINE_TAGS = ['link', 'meta', '!doctype'];
const VOID_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                   'link', 'meta', 'param', 'source', 'track', 'wbr'];

const SAMPLE_THUMBNAIL = '/favicons/android-chrome-256x256.png';
const DEFAULT_LANG = 'en';
const AMP_STORY_CLEANER_REGEX =
  ['amp-story', 'amp-story-auto-ads']
      .map(extension =>
        new RegExp('<script\\s+async\\s+custom-element="' + extension
      + '"\\s+src="https:\\/\\/cdn\\.ampproject\\.org\\/v0\\/' + extension
      + '-\\d\\.\\d\\.js"><\\/script>')
      );
const AMPHTML_BOILERPLATE = '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>'; // eslint-disable-line max-len


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
module.exports.parse = function(input, filePath='') {
  input = beautifyHtml(input, BEAUTIFY_OPTIONS);
  const parsing = new DocumentParser(input.split('\n'), filePath);
  parsing.execute();
  elementSorting.apply(parsing.document);
  return parsing.document;
};

class DocumentParser {

  constructor(lines, filePath='') {
    this.lines = lines;
    this.document = new Document();
    this.document.firstImage = SAMPLE_THUMBNAIL;
    this.inComment = false;
    this.currentTag = '';
    this.currentTagCounter = 0;
    this.inBody = false;
    this.inMetadata = false;
    this.inHint = false;
    this.inHintedElement = false;
    this.metadata = '';
    this.filePath = filePath;
  }

  execute() {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('<!--')) {
        if (trimmedLine.startsWith('<!---')) {
          this.inMetadata = true;
        } else if (trimmedLine.startsWith('<!--~')) {
          this.inHint = true;
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
      if (this.inHint) {
        this.currentSection().appendHint(line);
      }
      if (!this.inComment && !this.inMetadata && !this.inHint) {
        this.updatePreview(line);
        this.currentSection().appendCode(line);
        this.updateHtmlTag(line);
        this.updateHead(line);
        this.updateStory(line);
        if (this.endOfCurrentTag(line)) {
          // console.log("end tag: " + this.currentTag);
          if (this.inHintedElement) {
            this.currentSection().endHint();
            this.inHintedElement = false;
          } else {
            this.endSection();
          }
          this.currentTag = '';
        }
      }
      if (trimmedLine.endsWith('-->')) {
        if (trimmedLine.endsWith('--->')) {
          this.inMetadata = false;
          try {
            this.document.metadata = yaml.safeLoad(this.metadata);
          } catch (err) {
            throw new Error(
              'There is an error in the YAML frontmatter in ' + this.filePath + ' at line ' + (i + 1) +
                '\n' + '"' + line + '"', err);
          }
        } else if (trimmedLine.endsWith('~-->')) {
          this.inHint = false;
          this.inHintedElement = true;
          this.currentTag = this.nextTag(i);
        } else if (this.inComment) {
          this.inComment = false;
          this.currentTag = this.nextTag(i);
          //console.log("start tag: " + this.currentTag);
        }
      }
    }
    this.migrateRuntimeToAmphtml();
  }

  /* private */

  updateHtmlTag(line) {
    if (this.extractTag(line) == 'html') {
      this.document.lang = this.attr(line, 'lang') || DEFAULT_LANG;
      if (line.includes('4ads')) {
        this.document.isAmpAds = true;
      } else if (line.includes('4email')) {
        this.document.isAmpEmail = true;
      } else {
        this.document.isAmpWeb = true;
      }
    }
  }

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
        this.document.title = title[1].trim();
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

  migrateRuntimeToAmphtml() {
    let head = this.document.head;
    if (this.document.isAmpEmail) {
      head = this.replaceAmpHtmlEmailRuntimeAddViewport(head);
    } else if (this.document.isAmpAds) {
      head = this.replaceAmpAdRuntime(head);
    } else if (this.document.isAmpStory) {
      head = this.replaceAmpStoryRuntime(head);
    }
    this.document.head = head;
  }

  replaceAmpStoryRuntime(string) {
    AMP_STORY_CLEANER_REGEX.forEach(r => string = string.replace(r, ''));
    return string;
  }

  replaceAmpHtmlEmailRuntimeAddViewport(string) {
    return string.replace(
        '<style amp4email-boilerplate>body{visibility:hidden}</style>',
        '<meta name="viewport" content="width=device-width,minimum-scale' +
        '=1,initial-scale=1">' +
      AMPHTML_BOILERPLATE);
  }

  replaceAmpAdRuntime(string) {
    string = string.replace('https://amp-ads.firebaseapp.com/dist/amp-inabox.js', 'https://amp-ads.firebaseapp.com/dist/amp.js');
    string = string.replace(
        '<style amp4ads-boilerplate>body{visibility:hidden}</style>',
        AMPHTML_BOILERPLATE);
    return string.replace('https://cdn.ampproject.org/amp4ads-v0.js', 'https://cdn.ampproject.org/v0.js');
  }

  verifySectionFilters(section) {
    if (!section || !section.filters) {
      return;
    }
    for (const filter of section.filters) {
      if (!this.document.formats().includes(filter)) {
        throw new Error(`Section uses filter that's not listed in formats: ${filter}`);
      }
    }
  }

  endSection() {
    this.verifySectionFilters(this.section);
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
    if (VOID_TAGS.indexOf(this.currentTag) > -1 && line.trim().endsWith('>')) {
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

  updateStory(line) {
    if (this.extractTag(line) == 'amp-story') {
      this.document.isAmpStory = true;
      this.currentSection().isAmpStoryTag = true;
    }
    if (this.document.isAmpStory && this.extractTag(line) == 'amp-story-page') {
      this.currentSection().storyPageId = this.attr(line, 'id');
    }
  }

  attr(line, name) {
    const match = line.match(name + '=\"(.*)\"');
    return match ? match[1] : '';
  }

};

module.exports.DocumentParser = DocumentParser;
