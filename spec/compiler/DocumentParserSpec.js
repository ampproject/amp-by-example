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

describe("DocumentParser", function() {

  var DocumentParser = require('../../lib/DocumentParser').DocumentParser;
  var CodeSection = require('../../lib/CodeSection');

  var HEAD = '<head>';
  var HEAD_END = '</head>';
  var BODY = '<body>';
  var BODY_END = '</body>';
  var TAG = '<h1>hello</h1>';
  var EMPTY_LINE = '';
  var WRAPPED_TAG = `<h1
    class="test">
    hello
    </h1>`;
  var TITLE = '  <title>hello</title>';
  var ANOTHER_TAG = '<h1>world</h1>';
  var NESTED_TAG = `<div>
  <h1>hello</h1>
</div>`.trim();
  var NESTED_SAME_TAG = `<div>
  <div>hello</div>
</div>`.trim();
  var COMMENT = '<!--comment-->';
  var COMMENT_WITH_HEADING = '<!--\n   # heading\n\ncomment-->';
  var HINT = '<!--~hint~-->';
  var LINK = ' <link href="Hello World" />';
  var META = ' <meta href="Hello World" />';
  var BASE = ' <base href="/">';
  var DOCUMENT_METADATA = `<!---
    experiments:
      - amp-accordion
  --->`;
  var DOCUMENT_METADATA_INVALID = `<!---
    experiment: true,
    component: amp-accordion
  }}--->`;

  beforeEach(function() {
    sectionCounter = 0;
  });

  it("adds code", function() {
    expect(parse(TAG).sections[0])
      .toEqual(newSection('', TAG + '\n', '', true, true));
  });

  it("adds comments", function() {
    expect(parse(COMMENT, TAG).sections)
      .toEqual([
          newSection('comment\n', TAG + '\n', '', true, true),
      ]);
  });
  it("strips whitespace before headings", function() {
    expect(parse(COMMENT_WITH_HEADING, TAG).sections[0].doc)
      .toEqual('\n# heading\n\ncomment\n');
  });

  it("adds hint", function() {
    const expected = newSection(
      '',
      `<!--START_HINT_0-->\n${TAG}\n<!--END_HINT-->\n`,
      '',
      true,
      true
    );
    expected.hints = ['hint'];

    expect(parse(HINT, TAG).sections).toEqual([expected]);
  });

  it("supports wrapped attributes", function() {
    var sections = parse(COMMENT, WRAPPED_TAG).sections;
    expect(sections[0].code).toEqual(WRAPPED_TAG + '\n');
  });

  describe('example spans', function() {

    it("element after comment", function() {
      expect(parse(COMMENT, TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', TAG + '\n', "", true, false),
            newSection('', ANOTHER_TAG + '\n', "", false, true)
        ]);
    });

    it("nested elements after comment", function() {
      expect(parse(COMMENT, NESTED_TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', NESTED_TAG + '\n', "", true, false),
            newSection('', ANOTHER_TAG + '\n', "", false, true)
        ]);
    });

    it("nested elements of same type after comment", function() {
      expect(parse(COMMENT, NESTED_SAME_TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', NESTED_SAME_TAG + '\n', "", true, false),
            newSection('', ANOTHER_TAG + '\n', "", false, true)
        ]);
    });

    it("ignores empty lines", function() {
      expect(parse(COMMENT, EMPTY_LINE, TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', EMPTY_LINE + '\n' + TAG + '\n', "", true, false),
            newSection('', ANOTHER_TAG + '\n', "", false, true)
        ]);
    });
    it("resets current tag after tag end", function() {
      var doc = parse(HEAD, COMMENT, META, LINK, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
  });

  it("adds content in body to preview", function() {
    var section = parse(HEAD, HEAD_END, BODY, TAG, BODY_END).sections[0];
    expect(section.preview).toEqual(TAG + '\n');
  });

  it("closes section before ending the body", function() {
    var sections = parse(HEAD, HEAD_END, BODY, TAG, BODY_END).sections;
    expect(sections.length).toEqual(2);
  });

  it("marks sections in body", function() {
    var sections = parse(HEAD, HEAD_END, BODY, COMMENT, TAG, BODY_END).sections;
    expect(sections[0].inBody).toBe(false);
    expect(sections[1].inBody).toBe(true);
  });

  it("adds head content to document", function() {
    var doc = parse(HEAD, ANOTHER_TAG, HEAD_END, BODY, TAG, BODY_END);
    expect(doc.head).toEqual(ANOTHER_TAG + '\n');
  });

  describe("single line tags", function() {
    it("link", function() {
      var doc = parse(HEAD, COMMENT, LINK, TITLE, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
    it("meta", function() {
      var doc = parse(HEAD, COMMENT, META, TITLE, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
  });

  describe("ends void tags automatically", function() {
    it("base", function() {
      var doc = parse(HEAD, COMMENT, BASE, TITLE, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
  });

  it("adds title to document", function() {
    var doc = parse(HEAD, TITLE, HEAD_END);
    expect(doc.title).toEqual('hello');
  });

  describe("adds metadata to document", function() {
    it("after comment", function() {
      var doc = parse(COMMENT, DOCUMENT_METADATA, HEAD, TITLE, HEAD_END, BODY, COMMENT, BODY_END);
      expect(doc.metadata.experiments).toEqual(["amp-accordion"]);
      expect(doc.sections.length).toEqual(3);
    });
    it("invalid metadata", function() {
      expect(function(){
        parse(COMMENT, DOCUMENT_METADATA_INVALID, HEAD, TITLE, HEAD_END, BODY, COMMENT, BODY_END);})
          .toThrowError(/line 5/);
    });
  });

  describe('xml tag parsing', function() {

    beforeEach(function() {
      parser = new DocumentParser('');
    });

    it("start tag", function() {
      expect(parser.extractTag('<div>')).toEqual('div');
      expect(parser.extractTag('  <div>')).toEqual('div');
      expect(parser.extractTag('</div>')).toEqual('');
      expect(parser.extractTag('<div class="test">')).toEqual('div');
      expect(parser.extractTag('<')).toEqual('');
      expect(parser.extractTag('< ')).toEqual('');
      expect(parser.extractTag('div')).toEqual('');
      expect(parser.extractTag('<!--')).toEqual('');
      expect(parser.extractTag('<!---{')).toEqual('');
      expect(parser.extractTag('<!--- -->')).toEqual('');
      expect(parser.extractTag('  <h4>Hello World</h4>')).toEqual('h4');
      expect(parser.extractTag('<amp-ad width="300"')).toEqual('amp-ad');
      expect(parser.extractTag('<input type="text">')).toEqual('input');
    });

    it("end tag", function() {
      expect(parser.extractEndTag('<div>')).toEqual('');
      expect(parser.extractEndTag('  <div>')).toEqual('');
      expect(parser.extractEndTag('</div>')).toEqual('div');
      expect(parser.extractEndTag('   </div>')).toEqual('div');
      expect(parser.extractEndTag('<div class="test">')).toEqual('');
      expect(parser.extractEndTag('  <h4>Hello World</h4>')).toEqual('h4');
    });
  });

  describe('extracts body tag', function() {
    it("no body", function() {
      const noBody = '<notBody>';
      expect(parse('something').body).toEqual('');
    });
    it("body only", function() {
      expect(parse(BODY).body).toEqual(BODY);
    });
    it("body with attributes", function() {
      const bodyWithAttributes = '<body attr="hello" attr2="world">';
      expect(parse(bodyWithAttributes).body).toEqual(bodyWithAttributes);
    });
    it("incomplete body", function() {
      const noBody = '<body';
      expect(parse('something').body).toEqual('');
    });
  });

  describe('parses lang', function() {
    it("defaults to en", function() {
      const document = parse('<html>');
      expect(document.lang).toBe('en');
    });
    it("uses lang attr otherwise", function() {
      const document = parse('<html ⚡ lang="de">');
      expect(document.lang).toBe('de');
    });
    it("handles comments before", function() {
      const document = parse('<!-- -->', '<html ⚡ lang="de">');
      expect(document.lang).toBe('de');
    });
  })

  describe('parses stories', function() {
    it("sets isAmpStory to true", function() {
      const document = parse('<body>', '<amp-story standalone>', '</amp-story>', '</body>');
      expect(document.isAmpStory).toBe(true);
    });
    it("sets story id", function() {
      const document = parse('<body>', '<amp-story standalone>', '<amp-story-page id="story-id">', '</amp-story-page>', '</amp-story>', '</body>');
      expect(document.sections[0].storyPageId).toBe('story-id');
    });
  });

  describe('parses runtime', function() {
    it('amp-story', function() {
      const document = parse('<html ⚡>', '<body>', '<amp-story standalone>', '</amp-story>', '</body>');
      expect(document.isAmpStory).toBe(true);
      expect(document.isAmpWeb).toBe(true);
      expect(document.isAmpEmail).toBe(false);
      expect(document.isAmpAds).toBe(false);
    });
    it('amp-mail', function() {
      const document = parse('<html ⚡4email>', '<body>', '</body>');
      expect(document.isAmpStory).toBe(false);
      expect(document.isAmpWeb).toBe(false);
      expect(document.isAmpEmail).toBe(true);
      expect(document.isAmpAds).toBe(false);
    });
    it('amp-ad', function() {
      const document = parse('<html ⚡4ads>', '<body>', '</body>');
      expect(document.isAmpStory).toBe(false);
      expect(document.isAmpWeb).toBe(false);
      expect(document.isAmpEmail).toBe(false);
      expect(document.isAmpAds).toBe(true);
    });
    it('amp-web', function() {
      const document = parse('<html ⚡>', '<body>', '</body>');
      expect(document.isAmpStory).toBe(false);
      expect(document.isAmpWeb).toBe(true);
      expect(document.isAmpEmail).toBe(false);
      expect(document.isAmpAds).toBe(false);
    });
  });

  function newSection(comment, doc, preview, isFirstSection, isLastSection) {
    const section = new CodeSection(comment, doc, preview);
    section.isLastSection = isLastSection;
    section.isFirstSection = isFirstSection;
    section.id = sectionCounter++;
    return section;
  }

  function parse() {
    var lines = [];
    for(var i = 0; i < arguments.length; i++) {
      lines = lines.concat(arguments[i].split('\n'));
    }
    var parser = new DocumentParser(lines);
    parser.execute();
    return parser.document;
  }

});
