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

import './base.css';
import dialogHtml from './dialog-container.html';

export default function createDialog() {
  return new Dialog(document.body, document);
}

class Dialog {
  constructor(container, doc) {
    this.container = container;
    this.doc = doc;
  }

  open(content) {
    this.container.insertAdjacentHTML('afterbegin', dialogHtml);
    this.container.querySelector('.dialog-content').appendChild(content);
    const closeButton = this.container.querySelector('.dialog-content .close');
    closeButton.addEventListener('click', this.close.bind(this));
  }

  close() {
    const dialog = this.container.querySelector('.dialog');
    if (!dialog) {
      return;
    }
    dialog.remove();
  }
}
