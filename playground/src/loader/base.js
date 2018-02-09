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

/**
 * copyright 2017, google, inc.
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *    http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */

import loaderHtml from './loader.hbs';

const FADE_OUT_ANIMATION_LENGTH = 250;

export default function createLoader(container) {
  return new Loader(container);
}

/**
 * a css only loader showing three dots.
 */
export class Loader {
  /**
   * create a new loader.
   *
   * @param container {htmlelement} the element containing the loader
   */
  constructor(container) {
    this.container = container;
  }

  /**
   * adds a css loader to the given element.
   */
  show() {
    if (this._findLoaders().length > 0) {
      return;
    }
    this.container.insertAdjacentHTML('afterbegin', loaderHtml());
  }

  /**
   * removes a css loader from the given element.
   *
   * @param container {htmlelement} the element containing the loader.
   */
  hide() {
    this._findLoaders().forEach(l => {
      l.classList.add('loader-fadeout');
      window.requestIdleCallback(() => l.remove(), {
        timeout: FADE_OUT_ANIMATION_LENGTH
      });
    });
  }

  _findLoaders() {
    return this.container.querySelectorAll('.loader');
  }
}
