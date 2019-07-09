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

const {parse} = require('./DocumentParser.js');
const ExampleFile = require('./ExampleFile.js');

const {promisify} = require('util');
const fs = require('fs');
const Hogan = require('hogan.js');
const readFileAsync = promisify(fs.readFile);

module.exports = async (filePath, config, contents) => {
  if (!contents) {
    contents = await readFileAsync(filePath, 'utf-8');
  }
  const template = Hogan.compile(contents, {delimiters: '<% %>'});
  contents =  template.render(config);
  const doc = parse(contents);
  const exampleFile = ExampleFile.fromPath(filePath);
  if (!doc.title) {
    console.warn(`${filePath} has no title`);
    doc.title = exampleFile.title();
  } else if (doc.title !== exampleFile.title()) {
    console.warn(
        `${filePath} has invalid title: "${exampleFile.title()}" vs "${doc.title}"`
    );
  }
  exampleFile.source = contents.replace(/\<!---.*--->/gms, '').trim();
  exampleFile.document = doc;
  return exampleFile;
}
