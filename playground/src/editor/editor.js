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

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/addon/hint/show-hint.css';

import 'codemirror/addon/selection/selection-pointer.js';
import 'codemirror/addon/selection/active-line.js';

import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/edit/closetag.js';

import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/xml-hint.js';
import 'codemirror/addon/hint/html-hint.js';
import 'codemirror/addon/hint/css-hint.js';

import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';

import events from '../events/events.js';

import './editor.css';
import './hints.css';

import CodeMirror from 'codemirror';
import Loader from '../loader/base.js';

const DEFAULT_DEBOUNCE_RATE = 500;
const HINT_IGNORE_ENDS = new Set([
  ';', ',',
  ')',
  '`', '"', "'", 
  ">",
  "{", "}", 
  "[", "]"
]);


export const EVENT_INPUT_CHANGE = 'editor-input-change';
export const EVENT_INPUT_NEW = 'editor-input-new';

export function createEditor(container) {
  return new Editor(container, window);
}

class Editor {
  constructor(container, win) {
    this.container = container;
    this.win = win;
    this.debounceRate = DEFAULT_DEBOUNCE_RATE;
    this.createCodeMirror();
    this.errorMarkers = [];
    this.loader = new Loader(this.container);
  }

  createCodeMirror() {
    const input = document.createElement('textarea');
    this.container.appendChild(input);
    this.codeMirror = CodeMirror.fromTextArea(input, {
      mode: 'text/html',
      selectionPointer: true,
      styleActiveLine: true,
      lineNumbers: false,
      showCursorWhenSelecting: true,
      cursorBlinkRate: 300,
      autoCloseBrackets: true,
      autoCloseTags: true,
      gutters: ['CodeMirror-error-markers'],
      extraKeys: {"Ctrl-Space": "autocomplete"},
      hintOptions: {
        completeSingle: false
      }
    });
    CodeMirror.htmlSchema['amp-img'] = {attrs: {}};
    this.codeMirror.on('changes', () => {
      if (this.timeout) {
        this.win.clearTimeout(this.timeout);
      }
      if (this.debounceRate === -1) {
        this.debounceRate = DEFAULT_DEBOUNCE_RATE;
        return;
      }
      this.timeout = this.win.setTimeout(() => {
        events.publish(EVENT_INPUT_CHANGE, this);
        this.debounceRate = DEFAULT_DEBOUNCE_RATE;
      }, this.debounceRate);
    });
    this.codeMirror.on('inputRead', (editor, change) => {
      if (this.hintTimeout) {
        clearTimeout(this.hintTimeout);
      }
      if (change.origin !== '+input') {
        return;
      }
      if (change && change.text && HINT_IGNORE_ENDS.has(change.text.join(''))) {
        return;
      }
      this.hintTimeout = setTimeout(() => {
        if (editor.state.completionActive) {
          return;
        }
        const cur = editor.getCursor();
        const token = editor.getTokenAt(cur);
        const isCss = token.state.htmlState.context.tagName === 'style';
        const isTagDeclaration = token.state.htmlState.tagName;
        const isTagStart = token.string === '<';
        if (isCss || isTagDeclaration || isTagStart) {
          CodeMirror.commands.autocomplete(editor);
        }
      }, 150);
    });
  }

  setSource(text) {
    this.loader.hide();
    this.debounceRate = -1; // don't debounce
    this.codeMirror.setValue(text);
    events.publish(EVENT_INPUT_NEW, this);
  }

  getSource() {
    return this.codeMirror.getValue();
  }

  setCursorAndFocus(line, col) {
    this.codeMirror.setCursor(line - 1, col, {'scroll': true});
    this.codeMirror.focus();
  }

  setCursor(line, col) {
    this.codeMirror.setCursor(line, col);
  }

  getCursor() {
    return this.codeMirror.getCursor();
  }

  setValidationResult(validationResult) {
    this.codeMirror.clearGutter('CodeMirror-error-markers');
    this.codeMirror.operation(() => {
      validationResult.errors.forEach(error => {
        const marker = document.createElement('div');
        const message = marker.appendChild(document.createElement('span'));
        message.appendChild(document.createTextNode(error.message));
        marker.className = 'gutter-' + error.icon;
        this.codeMirror.setGutterMarker(error.line - 1, 'CodeMirror-error-markers', marker);
      });
    });
  }

  showLoadingIndicator() {
    this.codeMirror.setValue('');
    this.loader.show();
  }

  lineCount() {
    return this.codeMirror.lineCount();
  }

  getLineTokens(lineNumber) {
    return this.codeMirror.getLineTokens(lineNumber);
  }

  replaceRange(replacement, from, to, origin) {
    this.codeMirror.replaceRange(replacement, from, to, origin);
  }

  getTokenAt(pos, precise) {
    return this.codeMirror.getTokenAt(pos, precise);
  }

}
