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
import events from '../events/events.js';
import '../../static/images/logo.svg';
import {runtimes, EVENT_SET_RUNTIME} from '../runtime/runtimes.js';
import {isDescendant} from '../node/base.js';

export function create() {
  const menu = new Menu(document);
  menu.create();
  return menu;
}

class Menu {

  constructor(doc) {
    this.doc = doc;
    this._clickHandler = this._closeOnClick.bind(this);
  }

  create() {
    if (this._root) {
      return;
    }
    console.log(' create menu');
    this._root = this.doc.createElement('div');
    this._root.innerHTML = this._buildMenu();
    this._menu = this._root.querySelector('.menu');
    this._registerActions();
    this.doc.body.append(this._root);
  }

  show() {
    this._setActiveRuntime();
    this._menu.classList.toggle('hide', false);
    setTimeout(() => this.doc.body.addEventListener('touchend', this._clickHandler, false), 10);
  }

  hide() {
    this._menu.classList.toggle('hide', true);
    this.doc.body.removeEventListener('touchend', this._clickHandler, false);
  }

  _setActiveRuntime() {
    this._menu.querySelectorAll('input[name=runtime]').forEach(input => {
      input.checked = runtimes.activeRuntime.id === input.id;
    });
  }

  _buildMenu() {
    return `<div class="menu hide elevation-2dp">
      <img src="images/logo.svg" height="32">
      <div role="separator"></div>
      ${this._buildRuntimeSection()}
      <div role="separator"></div>
      <div id="menu-format-source" role="button" tabindex="0">Format</div>
      <div role="separator"></div>
      <a href="https://www.google.com/intl/en/policies/privacy/">Privacy</a>
   </div>`
  }

  _buildRuntimeSection() {
    return runtimes.values.map(runtime => 
      `<label><input type="radio" name="runtime" id="${runtime.id}">${runtime.name}</label>`
    ).join('');
  }

  _registerActions() {
    this._menu.querySelectorAll('input[name=runtime]').forEach(input => {
      input.addEventListener('change', 
        e => events.publish(EVENT_SET_RUNTIME, runtimes.get(e.target.id))
      );
    });
  }

  _closeOnClick(e) {
    if (isDescendant(e.target, this._root)) {
      setTimeout(() => this.hide(), 200);
    } else {
      this.hide();
    }
  }
}
