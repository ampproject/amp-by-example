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

export default function addSplitPaneBehavior(container) {
  return new SplitPane(container);
}

class SplitPane {

  constructor(container) {
    this.container = container;
    const children = container.children;
    if (children.length !== 3) {
      console.error('webui-splitpane must have three children: left, handle, right');
      return;
    }
    // init panes & drag handle
    this._isResizing = false;
    this._left = children[0];
    this._dragHandle = children[1];
    this._right = children[2];

    // register dragging listeners
    this._dragHandle.addEventListener('mousedown', this._startResizing.bind(this), {passive: true});
    document.addEventListener('mousemove', this._resizing.bind(this), {passive: true});
    document.addEventListener('mouseup', this._endResizing.bind(this), {passive: true});
  }

  _startResizing() {
    this._isResizing = true;
    // disable pointer events for all children to avoid mouse events
    // being swallowed by the iframe and changing the editor scroll
    // position
    this._setPointerEvent('none');
  }

  _resizing(e) {
    // we don't want to do anything if we aren't resizing.
    if (!this._isResizing) {
      return;
    }
    this._updateSize(e.clientX - this.container.getBoundingClientRect().left);
  }

  _endResizing() {
    // we don't want to do anything if we aren't resizing.
    if (!this._isResizing) {
      return;
    }
    this._isResizing = false;
    // re-enable pointer events for all children
    this._setPointerEvent('auto');
    // save the pane ratio
    this.ustomRatio = this._left.offsetWidth / this.offsetWidth;
  }

  _updateSize(size) {
    // adjust the panes size
    this._size = size;
    window.requestAnimationFrame(this._updatePanes.bind(this));
  }

  _updatePanes() {
    this._left.style.width = this._size + 'px';
    const newRightWidth = this.container.offsetWidth - this._size - this._dragHandle.offsetWidth;
    this._right.style.width = String(newRightWidth) + 'px';
  }

  _setPointerEvent(value) {
    const children = this.container.getElementsByTagName('*');
    for (let i = 0; i < children.length; i++) {
      children[i].style['pointer-events'] = value;
    };
  }

  _onResize() {
    if (!this.ratio) {
      return;
    }
    this._updateSize(this.offsetWidth * this.ratio);
  }

  _localStorageLoad() {
    if (this.customRatio) {
      this.ratio = this.customRatio;
      this._onResize();
    }
  }
}
