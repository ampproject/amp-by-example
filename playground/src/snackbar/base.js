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
import '../request-idle-callback/base.js';

const SNACKBAR_TIMEOUT = 4000;

class Snackbar {
  constructor(win, doc) {
    this.win = win;
    this.doc = doc;
    this.element = new Promise(resolve => {
      this.win.requestIdleCallback(() => {
        const snackbarContainer = this.doc.createElement('div');
        snackbarContainer.classList.add('snackbar-container');
        this.doc.body.append(snackbarContainer);
        resolve(snackbarContainer);
      });
    });
  }

  show(message) {
    this.element.then(snackbarContainer => {
      const snackbar = this.doc.createElement('div');
      snackbar.classList.add('snackbar');
      snackbarContainer.append(snackbar);
      snackbar.innerHTML = message;
      setTimeout(() =>{
        snackbar.classList.add('snackbar-active');
      }, 100);
      setTimeout(() =>{
        snackbar.classList.remove('snackbar-active');
        setTimeout(() => snackbar.remove(), 500);
      }, SNACKBAR_TIMEOUT);
    });
  }

}

export default new Snackbar(window, document);
