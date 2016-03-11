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

describe("Document", function() {

  const CodeSection = require('../../tasks/lib/CodeSection');
  const Document = require('../../tasks/lib/Document');

  describe("description", function() {

    it('first section stripped of html tags', function() {
      expect(descriptionOf("hello world")).toBe("hello world");
    });
    it('trims newlines', function() {
      expect(descriptionOf("hello\nworld")).toBe("hello world");
    });
    it('is first sentence in first section', function() {
      expect(descriptionOf("hello world. next sentence")).toBe("hello world.");
    });
    it('sentences can span multiple lines', function() {
      expect(descriptionOf("hello\nworld. next sentence")).toBe("hello world.");
    });
    it('ignores headlines', function() {
      expect(descriptionOf("## Headline\nhello world\n")).toBe("hello world");
    });
    it('empty if there are no sections', function() {
      expect(new Document().description()).toBe("");
    });
    it('uses first section with docs', function() {
      const doc = new Document();
      const sectionWithoutDoc = new CodeSection();
      doc.addSection(sectionWithoutDoc);
      const sectionWithDoc = new CodeSection();
      sectionWithDoc.appendDoc('hello world');
      doc.addSection(sectionWithDoc);
      expect(doc.description()).toBe("hello world");
    });
    it('uses first section with paragraphs', function() {
      const doc = new Document();
      const sectionWithoutParagraph = new CodeSection();
      sectionWithoutParagraph.appendDoc('## Headlline');
      doc.addSection(sectionWithoutParagraph);
      const sectionWithDoc = new CodeSection();
      sectionWithDoc.appendDoc('hello world');
      doc.addSection(sectionWithDoc);
      expect(doc.description()).toBe("hello world");
    });

  });

  function descriptionOf(text) {
    const doc = new Document();
    const section = new CodeSection();
    section.appendDoc(text);
    doc.addSection(section);
    return doc.description();
  }

});

