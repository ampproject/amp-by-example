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

import createDialog from '../dialog/base.js';
import './base.css';
import ListFilter from '../filter/filter.js';
import * as Button from '../button/button.js';
import absolutify from 'absolutify';
import dialogHeader from './header.html';
import events from '../events/events.js';

const SITEMAP_URL = 'https://ampbyexample.com/sitemap.json';

export default function createTemplateDialog(button, callback) {
  return new TemplateDialog(document, createDialog(), button, callback);
}

class TemplateDialog {
  constructor(doc, dialog, button, callback) {
    this.doc = doc;
    this.callback = callback;
    this.dialog = dialog;
    this.fetchTemplates();
    this.button = button;
  }

  open(runtime) {
    this.runtime = runtime;
    this.fetchTemplates()
      .then((sitemap) => this.renderTemplates(sitemap))
      .catch(err => {
        console.log(err);
        this.callback.onError('Could not fetch templates');
      });
  }

  close() {
    if (!this.dialog) {
      return;
    }
    this.dialog.close();
  }

  fetchTemplates() {
    if (this.templates) {
      return this.templates;
    }
    this.templates = fetch(SITEMAP_URL, {
      mode: 'cors'
    }).then(response => {
      this.button.enable();
      return response.json();
    }).catch(err => {
      console.error(err);
      this.templates = null;
    });
    return this.templates;
  }

  renderTemplates(sitemap) {
    const root = this.doc.createElement('div');
    root.addEventListener('click', this._onListItemClick.bind(this));
    const heading = this.doc.createRange().createContextualFragment(dialogHeader);
    root.appendChild(heading);
    root.setAttribute('id', 'templates');
    const searchStrings = [];
    const items = [];
    const templates = this.selectTemplatesForRuntime(sitemap);
    templates.categories.forEach(c => {
      this.addTemplateCategory(c, root, items, searchStrings);
    });
    const searchInputField = root.querySelector('#template-search-input');
    this.filter = new ListFilter(searchStrings, searchInputField, items);
    this.dialog.open(root);
  }

  addTemplateCategory(category, parent, items, searchStrings) {
    const root = this.doc.createElement('div');
    const heading = this.doc.createElement('h2');
    heading.textContent = category.name;
    root.appendChild(heading);
    const templateList = this.doc.createElement('ul');
    root.appendChild(templateList);
    category.examples.forEach(e => {
      const listItem = this.createTemplateListItem(e);
      templateList.appendChild(listItem);
      items.push(listItem);
      searchStrings.push(this.buildSearchString(category, e));
    });
    parent.appendChild(root);
  }

  createTemplateListItem(example) {
    const listItem = this.doc.createElement('li');
    listItem.setAttribute('data-url', 'https://ampbyexample.com' + example.url + 'source/');
    listItem.textContent = example.title;
    listItem.setAttribute('tabindex', 0);
    listItem.setAttribute('role', 'button');
    return listItem;
  }

  loadTemplate(url) {
    this.callback.onStart();
    this.close();
    fetch(url, {
      mode: 'cors'
    }).then(response => response.text())
      .then(body => {
        this.callback.onSuccess({
          url: url,
          content: this.makeLinksAbsolute(url, body)
        });
      }).catch(err => {
        console.error(err);
        this.callback.onError('Could not fetch template');
      });
  }

  makeLinksAbsolute(url, body) {
    const origin = new URL(url).origin;
    if (origin !== window.location.origin) {
      body = absolutify(body, origin);
    }
    return body;
  }

  buildSearchString(category, example) {
    let str = [category.name, example.title, example.description].join(' ');
    str = str.replace(/(amp-([a-z\d]*))/g, '$1 $2');
    return str;
  }

  selectTemplatesForRuntime(sitemap) {
    if (this.runtime.id === 'amphtml') {
      return sitemap[0];
    } else if (this.runtime.id === 'amp4ads') {
      return sitemap[1];
    } else if (this.runtime.id === 'amp4stories' && sitemap.length > 2) {
      return sitemap[2];
    } else {
      return {
        categories: [{
          name: 'No templates available',
          examples: []
        }]
      };
    }
  }

  _onListItemClick(e) {
    if (e.target.tagName !== 'LI') {
      return;
    }
    e.preventDefault();
    this.loadTemplate(e.target.dataset.url);
  }
}
