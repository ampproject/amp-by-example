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

    it("trims content", function() {
      section.appendDoc("<!-- hello");
      section.appendDoc("world -->");
      expect(section.doc).toEqual("hello\nworld\n");
    });

  });

});

