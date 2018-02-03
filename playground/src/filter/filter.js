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

import Wade from 'wade';
import debounce from '../debounce/debounce.js';

const MIN_SEARCH_LENGTH = 3;
const CSS_FILTER_RULE = 'filtered';

export default class Filter {
  constructor(strings, input, elements) {
    this.search = Wade(strings);
    this.elements = elements;
    this.input = input;
    this.input.addEventListener('input', debounce(this.doFilter.bind(this), 200));
  }

  doFilter() {
    const searchInput = this.input.value.trim();
    if (searchInput.length < MIN_SEARCH_LENGTH) {
      this.clear();
      return;
    }
    const results = this.search(searchInput);

    const mapping = new Set();
    results.forEach(r => {
      mapping.add(r.index);
    });

    this.elements.forEach((e, index) => {
      e.classList.toggle(CSS_FILTER_RULE, !mapping.has(index));
    });
  }

  clear() {
    this.elements.forEach(e => {
      e.classList.toggle(CSS_FILTER_RULE, false);
    });
  }
}
