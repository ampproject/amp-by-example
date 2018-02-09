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

import './error-list.css';
import events from '../events/events.js';
import * as Button from '../button/button.js';
import * as Validator from '../validator/validator.js';

export const EVENT_ERROR_SELECTED = 'error-selected';

export function createErrorList(container, trigger) {
  return new ErrorList(container, trigger);
}

const DESKTOP_WIDTH = 1024;

class ErrorList {
  constructor(container, trigger) {
    this.container = container;
    this.trigger = Button.from(trigger, this.toggle.bind(this));
    // configure validator
    events.subscribe(Validator.EVENT_NEW_VALIDATION_RESULT, validationResult => {
      this.update(validationResult);
      window.requestIdleCallback(() => {
        if (validationResult === Validator.NO_VALIDATOR) {
          this.trigger.setHtml('valid');
          this.trigger.disable();
          return;
        }
        this.trigger.enable();
        if (validationResult.status == 'PASS') {
          this.trigger.disable();
          return;
        }
        this.trigger.enable();
        this.trigger.setHtml(
          validationResult.errors.length + 
          ' Error' + 
          (validationResult.errors.length > 1 ? 's' : ''));
      });
    });
  }

  update(validationResult) {
    this.validationResult = validationResult;
    window.requestIdleCallback(() => {
      this.container.innerHTML =
        `
        <div class="title">
        <button class="button close">
          <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
          </svg>
        </button>
        <h2>Validation Result</h2>
        </div>
        <ul>${validationResult.errors.map(this.renderError).join('')}</ul>
        `;
      if (validationResult.errors.length === 0) {
        this.container.classList.toggle('show', false);
      }
    });
  }

  renderError(error, index) {
    return `<li class="validation-error ${error.icon}" data-index="${index}">
            <div>
              <div class="message">${error.message}</div>
              <div class="category">${error.category}</div>
              <div class="location">line ${error.line}, column ${error.col}</div>
            </div>
      </li>`;
  }

  toggle(e) {
    if (this.container.classList.contains('show')) {
      this.hideErrorList(e);
    } else {
      this.showErrorList(e);
    }
  }

  hideErrorList() {
    document.body.removeEventListener('click', this.onItemClickHandler, false);
    this.container.classList.toggle('show', false);
  }

  showErrorList(e) {
    e.stopPropagation();
    this.onItemClickHandler = this.onItemClick.bind(this);
    document.body.addEventListener('click', this.onItemClickHandler, false);
    this.container.classList.toggle('show', true);
  }

  onItemClick(e) {
    if (!this.validationResult) {
      return;
    }
    const target = e.target.closest('li.validation-error');
    if (!target) {
      this.hideErrorList();
      return;
    }
    const index = target.dataset.index;
    const error = this.validationResult.errors[index];
    if (!error) {
      return;
    }
    e.stopPropagation();
    if (window.innerWidth < DESKTOP_WIDTH) {
      this.hideErrorList();
    }
    events.publish(EVENT_ERROR_SELECTED, error);
  }

}
