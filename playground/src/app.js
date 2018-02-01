import './app.critical.css';
import './loader/base.critical.css';
import './preview/preview.critical.css';
import './event-listener-options/base.js';

import DocumentController from './document/controller.js';
import Fab from './fab/fab.js';

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
const errorList = ErrorList.createErrorList(errorListContainer, errorIndicator);
events.subscribe(
  ErrorList.EVENT_ERROR_SELECTED,
  error => editor.setCursorAndFocus(error.line, error.col)
);

const validator = Validator.createValidator();

// runtime select
const runtimeChanged = runtimeId => {
  const newRuntime = runtimes.get(runtimeId);
  if (!newRuntime) {
    console.error('unknown runtime: ' + newRuntime);
    return;
  }
  events.publish(EVENT_SET_RUNTIME, newRuntime);
}

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
  console.log(`runtime ${activeRuntime} ->: ${newRuntime.id}`);
  preview.setRuntime(newRuntime);
  // change editor input to new runtime default if current input is unchanged
  if (activeRuntime && activeRuntime.template === editor.getSource()) {
    editor.setSource(newRuntime.template);
  }
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
  [Editor.EVENT_INPUT_CHANGE, Editor.EVENT_INPUT_NEW],
  editorUpdateListener
);
events.subscribe(Validator.EVENT_NEW_VALIDATION_RESULT, validationResult => {
  editor.setValidationResult(validationResult);
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
  onSuccess: content => editor.setSource(content),
  onError: err => {
    editor.setSource('');
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
  }
};

showPreview.show();

