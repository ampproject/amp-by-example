/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

'use strict';

const fs = require('fs');
const path = require('path');

function listFiles(currentDirPath, result = [], recursive = false) {
  fs.readdirSync(currentDirPath).forEach(name => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && !path.basename(filePath).startsWith('.')) {
      result.push(filePath);
    } else if (stat.isDirectory() && recursive) {
      listFiles(filePath, result, true);
    }
  });
  return result;
}

function writeFile() {
  if (arguments.length < 2) {
    throw new Error('expect path segments followed by content');
  }
  const filePath = Array.prototype.slice.call(arguments, 0, -1).join(path.sep);
  const content = arguments[arguments.length - 1];
  mkdir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function mkdir(dirPath) {
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    if (err.code !== 'EEXIST') {throw err;}
  }
}

module.exports.listFiles = listFiles;
module.exports.writeFile = writeFile;
module.exports.readFile = readFile;
module.exports.mkdir = mkdir;
