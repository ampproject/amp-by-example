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

import URLSearchParams from 'url-search-params';

class Params {

  constructor(win) {
    this.win = win;
  }

  get(key, alt) {
    const params = new URLSearchParams(this.win.location.hash.slice(1));
    let result = params.get(key);
    if (!result) {
      result = alt;
    }
    return result;
  }

  replace(key, value) {
    this.win.history.replaceState(null, null, this._newLocation(key, value));
  }

  push(key, value) {
    this.win.history.pushState(null, null, this._newLocation(key, value));
  }

  _newLocation(key, value) {
    const params = new URLSearchParams(this.win.location.hash.slice(1));
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    let paramsString = params.toString();
    if (paramsString) {
      paramsString = '#' + params.toString();
    }
    return this.win.location.pathname + paramsString;
  }
}

export default new Params(window);
