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

import * as PlaygroundDocument from './document.js';
import * as Button from '../button/button.js';

import navigationWarning from '../navigation-warning/navigation-warning.js';
import params from '../params/base.js';
import events from '../events/events.js';
import snackbar from '../snackbar/base.js';
import {EVENT_INPUT_CHANGE} from '../editor/editor.js';
import key from 'keymaster/keymaster.js';

const URL_DOC_ID_PREFIX = 'amp/';
const REGEX_DOC_ID = /^.*\/amp\/(.+)$/;

export default class DocumentController {

  constructor(editor, runtime, container, win) {
    this.win = win;
    this.container = container;
    this.editor = editor;
    this.srcDoc = PlaygroundDocument.createDocument();
    this._setupDocument(runtime);
    this._configureStatemachine();
    events.subscribe(
      EVENT_INPUT_CHANGE,
      editor => this.srcDoc.update()
    );
    events.subscribe(
      PlaygroundDocument.EVENT_DOCUMENT_STATE_CHANGED,
      this._onStateChange.bind(this)
    );
    // TODO find a better place for key handling
    key.filter = event => true;
    key('⌘+s, ctrl+s', (e) => {
      e.preventDefault();
      this.save();
    });
  }

  _configureStatemachine() {
    this.statemachine = new Map()
      .set(PlaygroundDocument.READ_ONLY, this._stateReadOnly)
      .set(PlaygroundDocument.DIRTY, this._stateDirty)
      .set(PlaygroundDocument.SAVED, this._stateSaved);
  }

  _setupDocument(runtime) {
    const docUrl = params.get('url');
    this.docId = this._getDocumentId();
    let promise;
    if (docUrl) {
      promise = this.srcDoc.fetchUrl(docUrl);
    } else if (this.docId) {
      promise = this.srcDoc.fetchDocument(this.docId);
    } else {
      promise = Promise.resolve(runtime.template);
    }
    promise.then(content => this.editor.setSource(content))
      .catch(err => {
        console.error(err);
        snackbar.show('Could not fetch document.');
        this.editor.setSource(runtime.template);
      });
  }

  _getDocumentId() {
    const match = this.win.location.toString().match(REGEX_DOC_ID);
    if (!match) {
      return '';
    }
    return match[1];
  }

  _setDocumentId(docId) {
    if (this.docId === docId) {
      return;
    }
    params.replace('url', '');
    this.docId = docId;
    const path = this.win.location.pathname.replace(REGEX_DOC_ID, '/');
    const newLocation = path + URL_DOC_ID_PREFIX + docId + this.win.location.hash;
    this.win.history.replaceState(null, null, newLocation);
  }

  show() {
    this.saveButton = Button.from(this.win.document.getElementById('save-document'), this.save.bind(this));
    this.forkButton = Button.from(this.win.document.getElementById('fork-document'), this.fork.bind(this));
    this._onStateChange(this.srcDoc.state, true);
  }

  fork() {
    this.forkButton.disable();
    this.srcDoc.fork()
      .then(docId => {
        this._setDocumentId(docId);
        this.forkButton.enable();
        snackbar.show('Document forked');
      })
      .catch(err => {
        console.error(err);
        this.forkButton.enable();
        snackbar.show('Could not fork document');
      });
  }

  save() {
    if (this.srcDoc.state !== PlaygroundDocument.DIRTY && 
        this.srcDoc.state !== PlaygroundDocument.READ_ONLY) {
      return;
    }
    this.saveButton.disable();
    this.srcDoc.save(this.editor.getSource())
      .then(docId => {
        this._setDocumentId(docId);
      })
      .catch(err => {
        console.error(err);
        this.saveButton.enable();
        snackbar.show('Could not save document');
      });
  }

  _onStateChange(newState, disableSnackbar) {
    const transition = this.statemachine.get(newState);
    if (!transition) {
      console.error('unknown state', newState);
      return;
    }
    transition.apply(this, [disableSnackbar]);
  }

  _stateSaved(disableSnackbar) {
    navigationWarning.disable();
    this.saveButton
      .setHtml('Saved')
      .disable();
    if (disableSnackbar) {
      return;
    }
    snackbar.show('Document saved');
  }

  _stateDirty() {
    navigationWarning.enable();
    this.saveButton.show()
      .setHtml('Save')
      .enable();
  }

  _stateReadOnly() {
    navigationWarning.enable();
    this.saveButton.hide()
      .disable();
  }
}
