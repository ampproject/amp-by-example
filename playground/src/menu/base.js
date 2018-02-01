import './base.css';
import events from '../events/events.js';
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
      <h2><b>AMP</b> Playground</h2>
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
