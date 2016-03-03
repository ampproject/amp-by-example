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

describe("ExampleFile", function() {

  var ExampleFile = require('../../tasks/lib/ExampleFile');

  describe('created from path', function() {
    var file = ExampleFile.fromPath('10_Hello_world\'s/What\'s%20up?.html');
    it('extracts title', function() {
      expect(file.title()).toBe("What's up?");
    });
    it('extracts url', function() {
      expect(file.url()).toBe("/hello_world\'s/what\'s%2520up?");
    });
    it('extracts file name', function() {
      expect(file.fileName()).toBe("What\'s%20up?.html");
    });
    it('extracts category', function() {
      expect(file.category()).toBe("Hello world's");
    });
    it('target path', function() {
      expect(file.targetPath()).toBe("hello_world\'s/what\'s%20up?/index.html");
    });
  });

  describe('nextFile', function() {
    it('returns next file in alphabetical order', function() {
      expect(ExampleFile.fromPath('spec/compiler/FileNameSpecFiles/a.html').nextFile().filePath)  
        .toEqual("spec/compiler/FileNameSpecFiles/b.html")
    });
    it('returns undefined when the file is the last one in alphabetical order', function() {
      expect(ExampleFile.fromPath('spec/compiler/FileNameSpecFiles/b.html').nextFile())  
        .toEqual(null)
    });
    it('returns undefined when the file does not exist', function() {
      expect(ExampleFile.fromPath('spec/compiler/FileNameSpecFiles/notExistentFile.html').nextFile())  
        .toEqual(null)
    });
  });

});
