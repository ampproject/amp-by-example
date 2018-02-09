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

import './fab.css';

export default class Fab {
  constructor(container, content, action) {
    this.createFab(container, content);
    this.action = action;
    this.button.addEventListener('click', this.onClick.bind(this), false);
  }

  createFab(container, content) {
    this.button = document.createElement('div');
    this.button.setAttribute('role', 'button');
    this.button.setAttribute('tabindex', '0');
    this.button.classList.add('fab');
    this.button.innerHTML = content;
    container.appendChild(this.button);
  }

  onClick(e) {
    e.preventDefault();
    this.action(this.button);
    this.hide();
  }

  show() {
    this.button.classList.remove('hide');
    this.button.classList.add('show');
  }

  hide() {
    this.button.classList.remove('show');
    this.button.classList.add('hide');
  }
}
