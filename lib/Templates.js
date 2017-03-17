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

const Hogan = require('hogan.js');
const CleanCSS = new (require('clean-css'));
const fs = require('fs');
const path = require('path');

module.exports.get = function(root, minify, delimiters) {
  return new Templates(root, minify, delimiters);
};

class Templates {

  constructor(root, minify, delimiters) {
    this.delimiters = delimiters;
    this.minify = minify;
    this.templates = [];
    this.registerTemplates(root, '');
  }

  render(templateFile, args) {
    return this.templates[templateFile].render(args, this.templates);
  }

  renderString(string, args) {
    return this.compileTemplate(string).render(args, this.templates);
  }

  /* private */
  registerTemplates(dir, prefix) {
    const context = this;
    fs.readdirSync(dir).forEach(function(file) {
      const key = path.join(prefix, file);
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        context.registerTemplates(filePath, key);
      } else {
        const compiledTemplate = context.compileTemplateFromFile(filePath);
        context.templates[key] = compiledTemplate;
      }
    });
  }

  compileTemplateFromFile(filePath) {
    let string = fs.readFileSync(filePath, 'utf8');
    if (filePath.endsWith('.css') && this.minify) {
      string = CleanCSS.minify(string).styles;
    }
    return this.compileTemplate(string);
  }

  compileTemplate(string) {
    return Hogan.compile(string, {delimiters: this.delimiters});
  }

}
