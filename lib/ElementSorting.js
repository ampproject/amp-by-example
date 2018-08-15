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

// the order is important: amp-sidebar must come directly after the body
const ELEMENTS_TO_MOVE = ['amp-sidebar', 'amp-app-banner'].map(e => matchHtmlTag(e));

// we're using regex to match the XML tags as we might have to handle 
// incomplete html tags in code sections, which DOM parsers such as cheerio automatically
// fix when serializing.
function matchHtmlTag(tagName) {
  return new RegExp('<' + tagName + '(\\s(.|\\n)*)?>(.|\\n)+<\\/' + tagName + '>', 'i');
}

/*
 * Extracts amp-app-banner and amp-sidebar from the document's preview sections.
 * The extracted sections will be added after the body tag to the document.
 */
class ElementSorting {

  apply(doc) {
    ELEMENTS_TO_MOVE.forEach(matcher => {
      const elements = this._extract(doc.sections, matcher);
      elements.forEach(e => doc.elementsAfterBody += e);
    });
  }

  _extract(codeSections, regExp) {
    const result = [];
    for (let section of codeSections) {
      const preview = section.preview;
      const match = regExp.exec(preview);
      if (!match) {
        continue;
      }
      const element = match[0];
      const prefix = preview.substr(0, match.index);
      const postfix = preview.substr(match.index + element.length, preview.length);
      section.preview = prefix + postfix;
      result.push(element);
    }
    return result;
  }

}

module.exports = new ElementSorting();
