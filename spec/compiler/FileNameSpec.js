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

describe("FileName", function() {

  var FileName = require('../../tasks/lib/FileName');

  describe('fromString', function() {
    it('returns empty string for undefined', function() {
      expect(FileName.fromString(null))
        .toEqual('');
    });
    it('appends .html', function() {
      expect(FileName.fromString('file'))
        .toEqual('file.html');
    });
    it('replaces whitespace with _', function() {
      expect(FileName.fromString('A String with whitespace'))
        .toEqual('A_String_with_whitespace.html');
    });
    it('URI encodes other chars', function() {
      expect(FileName.fromString("What's possible with X?"))
        .toEqual("What%27s_possible_with_X%3F.html");
    });
    it('returns empty string when the file is undefined', function() {
      expect(FileName.fromString(undefined))
        .toEqual('');
    });
    it('Adds path', function() {
      expect(FileName.fromString("hello", "world"))
        .toEqual("hello/world.html");
    });
  });

  describe('toString', function() {
    it('removes file extension', function() {
      expect(FileName.toString('file.txt'))
        .toEqual('file');
    });
    it('replaces _ with space', function() {
      expect(FileName.toString('A_String_with_whitespace'))
        .toEqual('A String with whitespace');
    });
    it('URI encodes other chars', function() {
      expect(FileName.toString("What%27s_possible_with_X%3F"))
        .toEqual("What's possible with X?");
    });
    it('returns empty string when the file is undefined', function() {
      expect(FileName.toString(undefined))
        .toEqual('');
    });
  });

});


