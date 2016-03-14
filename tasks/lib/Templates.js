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

const Handlebars = require('handlebars');
const CleanCSS = new (require('clean-css'));
const fs = require('fs');
const path = require('path');

module.exports.get = function(root) {
  return new Templates(root);
};

class Templates {

  constructor(root) {
    this.templates = [];
    this.registerTemplates(root, '');
  }

  render(templateFile, args) {
    return this.templates[templateFile](args);
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
        const compiledTemplate = context.compileTemplate(filePath);
        Handlebars.registerPartial(key, compiledTemplate);
        context.templates[key] = compiledTemplate;
      }
    });
  }

  compileTemplate(filePath) {
    let contents = fs.readFileSync(filePath, 'utf8');
    if (filePath.endsWith('.css')) {
      contents = CleanCSS.minify(contents).styles;
    }
    return Handlebars.compile(contents, {compat: true});
  }

}
