// Copyright 2018 The AMPHTML Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import(/* webpackPrefetch: true */ 'js-beautify/js/lib/beautify-html.js');

const BEAUTIFY_OPTIONS = {
  'indent_size': 2,
  'unformatted': ['noscript', 'style'],
  'indent-char': ' ',
  'no-preserve-newlines': '',
  'extra_liners': [],
};

class Formatter {
  format(code) {
    return import(/* webpackChunkName: "js-beautify" */ 'js-beautify/js/lib/beautify-html.js')
    // eslint-disable-next-line google-camelcase/google-camelcase
        .then((jsBeautify) => jsBeautify.html_beautify(code, BEAUTIFY_OPTIONS));
  }
}

export default new Formatter();
