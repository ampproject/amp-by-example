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

import dimensions from './dimensions.json';
import params from '../params/base.js';
import debounce from '../debounce/debounce.js';
import createLoader from '../loader/base.js';

const PARAM_MODE = 'mode';
const PARAM_WIDTH = 'width';
const PARAM_HEIGHT = 'height';

const MOBILE_BREAK_POINT = 767;

export function createPreview(container) {
  return new Preview(container, document, createLoader(container));
}

class Preview {

  constructor(container, doc, loader) {
    this.doc = doc;
    this.loader = loader;
    this.container = container;
    this.previewContainer = container.querySelector('#preview-container');
    this.panelHeader = this.container.querySelector('.panel-header');
    this.createHeader();
  }

  setRuntime(runtime) {
    this.setDefaultDimension(runtime);
    if (!this.runtime) {
      // reset preview state
      params.replace('preview', '');
      // configure device dimension
      this.setDimensionFromParams();
      // disable device dimensions on mobile (except for ad preview)
      if (window.innerWidth <= MOBILE_BREAK_POINT && runtime.id !== 'amp4ads') {
        this.dimension.width = '100%';
        this.dimension.height = '100%';
      }
    }
    this.runtime = runtime;
    this.configurePreviewSwitcher();
    // reload existing preview
    if (this.documentString) {
      this.reload();
    }
  }

  setDefaultDimension(runtime) {
    this.dimensions = dimensions[runtime.preview.mode];
    this.dimension = this.findDimensionByLabel(runtime.preview.default);
  }

  setDimensionFromParams() {
    const label = params.get(PARAM_MODE);
    if (!label) {
      return;
    }
    const newDimension = this.findDimensionByLabel(label);
    if (!newDimension) {
      return;
    }
    this.dimension = newDimension;
    if (label == 'Custom') {
      this.dimension.width = params.get(PARAM_WIDTH, this.dimension.width);
      this.dimension.height = params.get(PARAM_HEIGHT, this.dimension.height);
    }
  }

  findDimensionByLabel(label) {
    return this.dimensions.find(d => d.label === label);
  }

  updateParams() {
    params.replace(PARAM_MODE, this.dimension.label);
    params.replace(PARAM_WIDTH, '');
    params.replace(PARAM_HEIGHT, '');
  }

  createHeader() {
    const closeButton = this.container.querySelector('#preview-header-close');
    closeButton.addEventListener('click', () => history.back());
    const refreshButton = this.container.querySelector('#preview-header-refresh');
    refreshButton.addEventListener('click', this.reload.bind(this));
  }

  configurePreviewSwitcher() {
    if (!this.select) {
      const root = this.doc.createDocumentFragment();
      this.select = this.createPreviewSelect();
      root.appendChild(this.select);
      this.customSizeInput = this.createCustomSizeInputs();
      root.appendChild(this.customSizeInput);
      this.panelHeader.insertBefore(root, this.panelHeader.firstChild.nextSibling.nextSibling);
    }

    const fragment = this.doc.createDocumentFragment();
    this.dimensions.forEach((d, i) => {
      const option = this.doc.createElement('option');
      option.setAttribute('value', i);
      if (d.label === this.dimension.label) {
        option.setAttribute('selected', null);
      }
      option.innerHTML = d.label;
      fragment.appendChild(option);
    });
    this.select.innerHTML = '';
    this.select.appendChild(fragment);
    this.toggleCustomSizeInput();
  }

  createPreviewSelect() {
    const select = this.doc.createElement('select');
    select.setAttribute('class', 'minimal');
    select.setAttribute('id', 'preview-size');
    select.setAttribute('label', 'select preview size');
    select.addEventListener('change', () => {
      this.dimension = this.dimensions[this.select.value];
      this.updateIframeDimensions();
      this.updateParams();
    });
    return select;
  }

  createCustomSizeInputs() {
    const div = this.doc.createElement('div');
    div.setAttribute('id', 'preview-custom-dimension');
    div.appendChild(
      this.createSizeInput(PARAM_WIDTH, params.get(PARAM_WIDTH, 320), width => {
        this.dimension.width = width;
      })
    );
    div.appendChild(this.doc.createTextNode('✕'));
    div.appendChild(
      this.createSizeInput(PARAM_HEIGHT, params.get(PARAM_HEIGHT, 250), height => {
        this.dimension.height = height;
      })
    );
    return div;
  }

  createSizeInput(label, value, cb) {
    const input = this.doc.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('value', value);
    input.setAttribute('aria-label', label);
    input.setAttribute('class', 'minimal');
    const validator = () => {
      const match = input.value.trim().match(/^(\d+)(\s*px)?$/);
      if (match) {
        const size = match[1];
        input.classList.toggle('invalid', false);
        cb(size);
        params.replace(label, size);
        this.updateIframeDimensions();
      } else {
        input.classList.toggle('invalid', true);
      }
    };
    input.addEventListener('input', debounce(validator, 200));
    return input;
  }

  toggleCustomSizeInput() {
    this.customSizeInput.classList.toggle('hidden', this.dimension.label !== 'Custom');
  }

  createIframe() {
    const iframe = this.doc.createElement('iframe');
    iframe.setAttribute('frameBorder', '0');
    iframe.setAttribute('id', 'previewIframe');
    iframe.setAttribute('title', 'AMP Playground Output');
    // this would run stamp always in fullscreen
    //iframe.setAttribute('allowfullscreen', true);
    iframe.classList.add('elevation-4dp');
    return iframe;
  }

  updateIframeDimensions() {
    if (!this.dimension) {
      return;
    }
    if (this.dimension.width && this.dimension.height) {
      this.previewIframe.style.width = this.dimension.width;
      this.previewIframe.style.height = this.dimension.height;
      this.toggleCustomSizeInput();
    }
  }

  refresh(documentString) {
    this.state = this.saveState(this.previewIframe);
    this.updatePreview(documentString);
  }

  onClose(callback) {
    this.onCloseCallBack = callback;
  }

  updatePreview(documentString) {
    this.documentString = documentString;
    this.reload();
  }

  reload() {
    // create a new preview iframe
    if (!this.previewIframe) {
      // remove initial loading placeholder
      this.clearPlaceholders();
    }
    this.previewIframe = this.createIframe();
    this.updateIframeDimensions();
    this.previewContainer.insertBefore(this.previewIframe, this.previewContainer.firstChild);
    // create the preview
    let childDoc = this.previewIframe.contentDocument;
    const childWindow = this.getIframeWindow(this.previewIframe);
    if (!childDoc) {childDoc = childWindow.document;}
    childDoc.open();
    childDoc.write('');
    childDoc.write(this.documentString);
    childDoc.close();
    (childWindow.AMP = childWindow.AMP || []).push(AMP => {
      this.restoreState(this.previewIframe, this.state);
      this.loader.hide();
      const oldIframes = [].slice.call(this.previewContainer.querySelectorAll('iframe'))
        .filter(e => e !== this.previewIframe);
      oldIframes.forEach(e => {
        e.classList.add('fadeout');
      });
      setTimeout(() => oldIframes.forEach(frame => frame.remove()), 280);
    });
  }

  getIframeWindow(iframeElement) {
    return iframeElement.contentWindow || iframeElement.contentDocument.parentWindow;
  }

  clearPlaceholders() {
    this.previewContainer.querySelectorAll('iframe').forEach(e => e.remove());
  }

  saveState(iframe) {
    if (!iframe) {return {};}
    const win = this.getIframeWindow(iframe);
    if (!win) {return {};}
    return {
      scroll: {
        x: win.scrollX,
        y: win.scrollY
      }
    };
  }

  restoreState(iframe, state) {
    if (!iframe) {return {};}
    const win = this.getIframeWindow(iframe);
    if (!win) {return {};}
    if (state.scroll) {
      win.scrollTo(state.scroll.x, state.scroll.y);
    }
  }
}
