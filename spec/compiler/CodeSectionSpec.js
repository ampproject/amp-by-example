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

describe("CodeSection", function() {

  var CodeSection = require('../../tasks/lib/CodeSection');

  beforeEach(function() {
    section = new CodeSection();
  });

  describe("equal to", function() {

    it("to same section", function() {
      var section1 = new CodeSection('a', 'b', 'c');
      var section2 = new CodeSection('a', 'b', 'c');
      expect(section1).toEqual(section2);
    });

    it("to different section", function() {
      var section1 = new CodeSection('a', 'b', 'c');
      var section2 = new CodeSection('c', 'd', 'e');
      expect(section1).not.toEqual(section2);
    });

  });

  describe("appending docs", function() {

    it("adds new docs", function() {
      section.appendDoc("hello");
      section.appendDoc("world");
      expect(section.doc).toEqual("hello\nworld\n");
    });

    it("removes comment tags ", function() {
      section.appendDoc("<!--hello");
      section.appendDoc("world-->");
      expect(section.doc).toEqual("hello\nworld\n");
    });

    it("keeps indentation", function() {
      section.appendDoc("<!--");
      section.appendDoc("  hello");
      section.appendDoc("-->");
      expect(section.doc).toEqual("\n  hello\n\n");
    });

    it("normalizes indentation", function() {
      section.appendDoc("  <!--");
      section.appendDoc("    hello");
      section.appendDoc("  -->");
      expect(section.doc).toEqual("\n  hello\n\n");
    });

    it("handles wrong indentation", function() {
      section.appendDoc("  <!--");
      section.appendDoc(" x  hello");
      section.appendDoc("  -->");
      expect(section.doc).toEqual("\nx  hello\n\n");
    });

    it("keeps empty lines", function() {
      section.appendDoc("  <!--");
      section.appendDoc("  hello");
      section.appendDoc("\n");
      section.appendDoc("  world");
      section.appendDoc("  -->");
      expect(section.doc).toEqual("\nhello\n\n\nworld\n\n");
    });

  });

  describe("hideCodeOnMobile", function() {
    it('hides codesections without comment', function() {
      section.appendCode("Some Code");
      expect(section.hideCodeOnMobile()).toEqual(true);
    });
    it('hides codesections with empty comment', function() {
      section.appendDoc("  ");
      section.appendCode("Some Code");
      expect(section.hideCodeOnMobile()).toEqual(true);
    });
    it('hides codesections with empty code', function() {
      section.appendDoc("Some Doc");
      section.appendCode("  ");
      expect(section.hideCodeOnMobile()).toEqual(true);
    });
    it('shows codesections with comment and code', function() {
      section.appendDoc("Some Doc");
      section.appendCode("Some Code");
      expect(section.hideCodeOnMobile()).toEqual(false);
    });
  });
  describe("hidePreviewOnMobile", function() {
    it('shows previews with code', function() {
      section.appendDoc("Some Doc");
      section.appendCode("Some Code");
      section.appendPreview("Some Code");
      expect(section.hidePreviewOnMobile()).toEqual(false);
    });
    it('hides empty previews', function() {
      section.appendDoc("Some Doc");
      section.appendCode("Some Code");
      section.appendPreview("  ");
      expect(section.hidePreviewOnMobile()).toEqual(true);
    });
    it('previews without code', function() {
      section.appendPreview("  ");
      expect(section.hidePreviewOnMobile()).toEqual(true);
    });
  });
  describe("hideDocOnMobile", function() {
    it('shows doc', function() {
      section.appendDoc("Some Doc");
      expect(section.hideDocOnMobile()).toEqual(false);
    });
    it('hides empty doc', function() {
      section.appendDoc("  ");
      expect(section.hideDocOnMobile()).toEqual(true);
    });
  });

});

