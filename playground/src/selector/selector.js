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

import params from '../params/base.js';

export default function createSelector(container, config) {
  return new Selector(container, config, document);
}

class Selector {
  constructor(container, config, doc) {
    this.container = container;
    this.config = config;
    this.doc = doc;
  }

  show() {
    this.select = this.doc.createElement('select');
    this.select.setAttribute('aria-label', this.config.label);
    this.config.classes.forEach(c => this.select.classList.add(c));
    if (this.config.id) {
      this.select.setAttribute('id', this.config.id);
    }
    this.select.addEventListener('change', () => {
      params.replace('runtime', this.select.value);
      this.config.onChange(this.select.value);
    });
    this.config.values.forEach(value => {
      const option = this.doc.createElement('option');
      option.setAttribute('value', value.id);
      if (value.selected) {
        option.setAttribute('selected', null);
      }
      option.innerHTML = value.label;
      this.select.appendChild(option);
    });

    this.container.appendChild(this.select);
  }

  selectOption(value) {
    const option = this.select.querySelector('[value=' + value + ']')
    if (!option) {
      return;
    }
    option.setAttribute('selected', '');;
  }
}
