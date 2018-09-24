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

import './app.critical.css';
import './loader/base.critical.css';
import './preview/preview.critical.css';
import './event-listener-options/base.js';

import DocumentController from './document/controller.js';
import Fab from './fab/fab.js';

import * as AutoImporter from './auto-importer/auto-importer.js';
import * as ComponentsProvider from './components-provider/components-provider.js';
import * as ErrorList from './error-list/error-list.js';
import * as Validator from './validator/validator.js';
import * as Editor from './editor/editor.js';
import * as Preview from './preview/preview.js';
import * as Button from './button/button.js';
import * as Menu from './menu/base.js';

import createSelector from './selector/selector.js';
import createTemplateDialog from './template-dialog/base.js';
import params from './params/base.js';
import events from './events/events.js';
import titleUpdater from './title-updater/base.js';
import snackbar from './snackbar/base.js';
import {runtimes, EVENT_SET_RUNTIME} from './runtime/runtimes.js';
import detectRuntime from './runtime/detector.js';
import addSplitPaneBehavior from './split-pane/base.js';

import './service-worker/base.js';
import './request-idle-callback/base.js';

// create editing/preview panels
const editor = Editor.createEditor(document.getElementById('source'));
const preview = Preview.createPreview(document.getElementById('preview'));
addSplitPaneBehavior(document.querySelector('main'));

// configure error list behavior
const errorIndicator = document.getElementById('error-indicator');
const errorListContainer = document.getElementById('error-list');

events.subscribe(
  ErrorList.EVENT_ERROR_SELECTED,
  error => editor.setCursorAndFocus(error.line, error.col)
);

const validator = Validator.createValidator();

const componentsProvider = ComponentsProvider.createComponentsProvider();

// Create AMP component auto-importer
const autoImporter = AutoImporter.createAutoImporter(componentsProvider, editor);

// runtime select
const runtimeChanged = runtimeId => {
  const newRuntime = runtimes.get(runtimeId);
  if (!newRuntime) {
    console.error('unknown runtime: ' + newRuntime);
    return;
  };
  events.publish(EVENT_SET_RUNTIME, newRuntime);
};

const runtimeSelector = createSelector(document.getElementById('runtime-select'), {
  classes: ['minimal'],
  id: 'runtime',
  label: 'select runtime',
  values: runtimes.values.map(r => {return {
    id: r.id,
    label: r.name,
    selected: r === runtimes.activeRuntime,
  };}),
  onChange: runtimeChanged
});
runtimeSelector.show();

let activeRuntime;
events.subscribe(EVENT_SET_RUNTIME, newRuntime => {
  preview.setRuntime(newRuntime);
  runtimeSelector.selectOption(newRuntime.id);
  // change editor input to new runtime default if current input is unchanged
  if (activeRuntime && 
    activeRuntime != newRuntime && 
    activeRuntime.template === editor.getSource()) {
    editor.setSource(newRuntime.template);
  };
  validator.validate(editor.getSource());
  activeRuntime = newRuntime;
});

runtimes.init();

// configure editor
const editorUpdateListener = () => {
  const source = editor.getSource();
  preview.refresh(source);
  validator.validate(source);
  titleUpdater.update(source);
};
events.subscribe(
  [Editor.EVENT_INPUT_CHANGE],
  editorUpdateListener
);
events.subscribe(Validator.EVENT_NEW_VALIDATION_RESULT, validationResult => {
  editor.setValidationResult(validationResult);
});
events.subscribe([Editor.EVENT_INPUT_NEW], () => {
  const source = editor.getSource();
  const runtime = detectRuntime(source);
  runtimeChanged(runtime.id);
  editorUpdateListener();
});

// configure auto-importer
events.subscribe(Validator.EVENT_NEW_VALIDATION_RESULT, validationResult => {
  autoImporter.update(validationResult);
});

// setup document
const documentController = new DocumentController(
  editor,
  runtimes.activeRuntime,
  document.querySelector('header'),
  window
);
documentController.show();

// configure preview
preview.setRuntime(runtimes.activeRuntime);
const previewPanel = document.getElementById('preview');
const showPreview = new Fab(document.body, '▶', () => {
  previewPanel.classList.add('show');
  params.push('preview', true);
});

// load template dialog
const loadTemplateButton = Button.from(
  document.getElementById('document-title'),
  () => templateDialog.open(runtimes.activeRuntime)
);
const templateDialog = createTemplateDialog(loadTemplateButton, {
  onStart: () => editor.showLoadingIndicator(),
  onSuccess: template => { 
    editor.setSource(template.content);
    params.replace('url', template.url);
  },
  onError: err => {
    snackbar.show(err);
  }
});

//configure menu
const menu = Menu.create();
Button.from(document.getElementById('show-menu'), () => {
  menu.show();
});

const formatSource = () => {
  import('./formatting/base.js')
    .then(formatHtml => {
      const formattedCode = formatHtml.default(editor.getSource());
      editor.setSource(formattedCode);
    })
    .catch(e => {
      console.error(e);
      snackbar.show('Could not fetch formatter');
    });
};
Button.from(document.getElementById('format-source'), formatSource);
Button.from(document.getElementById('menu-format-source'), formatSource);


window.onpopstate = () => {
  if (!params.get('preview')) {
    previewPanel.classList.remove('show');
    showPreview.show();
  };
};

showPreview.show();

