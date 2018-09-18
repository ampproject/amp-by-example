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

const COMPONENTS_URL = '/playground/amp-component-versions';

export function createComponentsProvider() {
  return new ComponentsProvider(window);
}

class ComponentsProvider {

  constructor(win) {
    this.win = win;
    this.componentsMap = new Promise((resolve, reject) => {
      this.win.requestIdleCallback(() => {
        let request = new Request(COMPONENTS_URL, {
          headers: new Headers({'x-requested-by': 'playground'})
        });
        fetch(request)
            .then((r) => r.json())
            .then((data) => {
              resolve(data);
            })
            .catch(() => {
              console.warn('Failed to fetch AMP component versions mapping');
              resolve({});
            })
      });
    });
  }

  get() {
    return this.componentsMap;
  }

}