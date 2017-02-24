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

  const CANONICAL = '<link rel="canonical" href="https://ampbyexample.com/" >';
  const NON_CANONICAL = '<link href="https://ampbyexample.com/" >';

  const CodeSection = require('../../tasks/lib/CodeSection');
  const Document = require('../../tasks/lib/Document');

  beforeEach(function() {
      doc = new Document();
  });

  describe("description", function() {
    it('first section stripped of html tags', function() {
      expect(descriptionOf("hello world")).toBe("hello world");
    });
    it('is first sentence in first section', function() {
      expect(descriptionOf("hello world. next sentence.")).toBe("hello world.");
    });
    it('trims newlines', function() {
      expect(descriptionOf("hello\nworld. next sentence.")).toBe("hello world.");
    });
    it('sentences can span multiple lines', function() {
      expect(descriptionOf("hello\nworld. next sentence")).toBe("hello world.");
    });
    it('sentences can end at line break', function() {
      expect(descriptionOf("hello world.\nnext sentence.")).toBe("hello world.");
    });
    it('sentences can end at line break 2', function() {
      expect(descriptionOf("hello world.\r\nnext sentence.")).toBe("hello world.");
    });
    it('sentences can end at line break 3', function() {
      expect(descriptionOf("hello world.\n\nnext sentence.")).toBe("hello world.");
    });
    it('sentences cannot contain links', function() {
      expect(descriptionOf('The <a href="https://example.com/amp-access.md">amp-access</a> component. Next sentence.')).toBe('The amp-access component.');
    });
    it('ignores headlines', function() {
      expect(descriptionOf("## Headline\nhello world\n")).toBe("hello world");
    });
    it('unescapes html', function() {
      expect(descriptionOf("don't")).toBe("don't");
    });
    it('empty if there are no sections', function() {
      expect(doc.description()).toBe("");
    });
    it('uses first section with docs', function() {
      const sectionWithoutDoc = new CodeSection();
      doc.addSection(sectionWithoutDoc);
      const sectionWithDoc = new CodeSection();
      sectionWithDoc.appendDoc('hello world');
      doc.addSection(sectionWithDoc);
      expect(doc.description()).toBe("hello world");
    });
    it('uses first section with paragraphs', function() {
      const sectionWithoutParagraph = new CodeSection();
      sectionWithoutParagraph.appendDoc('## Headlline');
      doc.addSection(sectionWithoutParagraph);
      const sectionWithDoc = new CodeSection();
      sectionWithDoc.appendDoc('hello world');
      doc.addSection(sectionWithDoc);
      expect(doc.description()).toBe("hello world");
    });

  });

  describe("hasCanonical is", function() {
    it("true if head contains canonical link ", function() {
      doc.appendHead(CANONICAL);
      expect(doc.hasCanonical()).toEqual(true);
    });
    it("false if head doesn't include canonical link", function() {
      doc.appendHead(NON_CANONICAL);
      expect(doc.hasCanonical()).toEqual(false);
    });
  });

  describe("importsComponent is", function() {
    it("true if head imports component ", function() {
      doc.appendHead('<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>');
      expect(doc.importsComponent('amp-analytics')).toEqual(true);
    });
    it("false if head doesn't include canonical link", function() {
      doc.appendHead('<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>');
      expect(doc.importsComponent('amp-accesss')).toEqual(false);
    });
  });

  describe("marks first section", function() {
    it("true", function() {
      const onlySection = new CodeSection();
      doc.addSection(onlySection);
      expect(onlySection.isFirstSection).toEqual(true);
    });
    it("false", function() {
      const firstSection = new CodeSection();
      const secondSection = new CodeSection();
      doc.addSection(firstSection);
      doc.addSection(secondSection);
      expect(secondSection.isFirstSection).toEqual(false);
    });
  });

  describe("marks last section", function() {
    it("true", function() {
      const onlySection = new CodeSection();
      doc.addSection(onlySection);
      expect(onlySection.isLastSection).toEqual(true);
    });
    it("false", function() {
      const firstSection = new CodeSection();
      const secondSection = new CodeSection();
      doc.addSection(firstSection);
      doc.addSection(secondSection);
      expect(firstSection.isLastSection).toEqual(false);
      expect(secondSection.isLastSection).toEqual(true);
    });
  });

  describe("parses outline", function() {
  });

  function descriptionOf(text) {
    const section = new CodeSection();
    section.appendDoc(text);
    doc.addSection(section);
    return doc.description();
  }

});

