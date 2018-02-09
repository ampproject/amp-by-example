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

class TitleUpdater {

  constructor(win) {
    this.win = win;
    this.originalTitle = win.document.title;
    this.titleLabel = win.document.getElementById('document-title');
  }

  update(text) {
    this.win.requestIdleCallback(() => {
      const match = text.match(/<title[^>]*>([^<]+)<\/title>/im);
      const snippetTitle = match ? match[1] : 'untitled';
      this.titleLabel.textContent = snippetTitle;
      this.titleLabel.classList.toggle('hidden', false);
      this.win.document.title = snippetTitle + ' - ' + this.originalTitle;
    });
  }

}

export default new TitleUpdater(window);
