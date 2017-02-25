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
  describe('hide columns if code section', function() {
    /*
    it('is longer than 4 lines', function() {
      section.appendCode("line1");
      expect(section.hideColumns()).toEqual(false);
      section.appendCode("line2");
      expect(section.hideColumns()).toEqual(false);
      section.appendCode("line3");
      expect(section.hideColumns()).toEqual(false);
      section.appendCode("line4");
      expect(section.hideColumns()).toEqual(false);
      section.appendCode("line5");
      expect(section.hideColumns()).toEqual(true);
    });
    */
    it('has no doc', function() {
      section.appendDoc("some doc");
      section.appendCode("line1");
      section.appendCode("line2");
      section.appendCode("line3");
      section.appendCode("line4");
      section.appendCode("line5");
      expect(section.hideColumns()).toEqual(false);
    });
    it('is boilerplate', function() {
      section.appendCode("line1\n   <style amp-boilerplate> more\n code");
      expect(section.hideColumns()).toEqual(true);
    });
  });
  describe('removes uncorrectly escaped templates', function(){
    it('contains an escaped template', function() {
      expect(section.cleanUpCode("[[<span class=\"hljs-attr\">.Disabled</span>]]")).toEqual("[[ .Disabled]]")
    });
    it('contains an escaped template and spaces', function() {
      expect(section.cleanUpCode("[[    <span class=\"hljs-attr\">.Disabled    </span>]]")).toEqual("[[ .Disabled]]")
    });
    it('does not alter valid escaped templates', function() {
      expect(section.cleanUpCode("<span class=\"hljs-string\">\"[[.Timestamp]]\"</span>")).toEqual("<span class=\"hljs-string\">\"[[.Timestamp]]\"</span>")
    });
    it('contains an escaped template with range clause', function() {
      expect(section.cleanUpCode("[[<span class=\"hljs-attr\">range</span><span class=\"hljs-attr\">.BlogItems</span>]]")).toEqual("[[range .BlogItems]]")
    });
    it('contains an escaped template with if clause', function() {
      expect(section.cleanUpCode("[[<span class=\"hljs-attr\">if</span><span class=\"hljs-attr\">.BlogItems</span>]]")).toEqual("[[if .BlogItems]]")
    });
    it('contains an escaped template with if clause and spaces', function() {
      expect(section.cleanUpCode("[[   <span class=\"hljs-attr\">if   </span><span class=\"hljs-attr\">.BlogItems</span>   ]]")).toEqual("[[if .BlogItems]]")
    });
    it('contains an escaped template with end clause', function() {
      expect(section.cleanUpCode("[[<span class=\"hljs-attr\">end</span>]]")).toEqual("[[end ]]")
    });

  });

  describe("parses outline", function() {
    it('has no headings by default', function() {
      section.appendDoc("Some Doc");
      expect(section.headings).toEqual([]);
    });
    it('ignores # in text', function() {
      section.appendDoc("asdfsafd ### Some Doc");
      expect(section.headings).toEqual([]);
    });
    it('adds single heading', function() {
      section.appendDoc("##Some Doc");
      expect(section.headings).toEqual([{
        id: 'some-doc',
        name: 'Some Doc',
      }]);
    });
    it('removes whitespace heading', function() {
      section.appendDoc("##  Some Doc   ");
      expect(section.headings).toEqual([{
        id: 'some-doc',
        name: 'Some Doc',
      }]);
    });
    it('adds multiple headings', function() {
      section.appendDoc("##Some Doc");
      section.appendDoc("##Another Doc");
      expect(section.headings).toEqual([{
        id: 'some-doc',
        name: 'Some Doc'
      }, {
        id: 'another-doc',
        name: 'Another Doc'
      }]);
    });
  });

});

