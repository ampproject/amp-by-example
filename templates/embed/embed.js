/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** Manage embed height **/

// minimum height amp-iframes can be resized to
var MIN_IFRAME_HEIGHT = 100;

var preview = document.getElementById('preview');
var previewPanel = document.getElementById('preview-panel');

/**
 * Set the preview width and height.
 */
function setPreviewHeight(height) {
  previewPanel.style.height = height + 'px';
}

/**
 * Adjusts the iframe height based on the iframe's document height. The width is unchanged.
 */
function fitPreviewToContent() {
  var iframeDoc = preview.contentDocument || preview.contentWindow.document;
  setPreviewHeight(iframeDoc.body.offsetHeight);
}

/**
 * Post a message containing the document height to the amp-iframe to trigger the resize.
 */
function postEmbedHeightToViewer() {
  var newHeight = document.getElementById('tabinterface').clientHeight;
  if (newHeight < MIN_IFRAME_HEIGHT) {
    console.log('embed height too small, reset height to 100px');
    newHeight = MIN_IFRAME_HEIGHT;
  }
  // Tell the viewer about the new size
  window.parent.postMessage({
    sentinel: 'amp',
    type: 'embed-size',
    height: newHeight
  }, '*');
}

// Listen to resize events and update the preview dimension
window.addEventListener('resize', fitPreviewIntoAvailableSpace, true);

/**
 * Resize the preview based on the available width and the resulting preview content height.
 */
function fitPreviewIntoAvailableSpace() {
  window.requestAnimationFrame(function() {
    fitPreviewToContent();
    postEmbedHeightToViewer();
  });
};

// Initially give preview same size as source code view (for a smoother transition)
var sourcePanel = document.getElementById('source-panel');
setPreviewHeight(sourcePanel.offsetHeight);

/** Configure Tabs **/

// Setup tab panel behavior
// (based on http://heydonworks.com/practical_aria_examples/#tab-interface)
var tabs = document.getElementById('tabinterface');

// For each individual tab panel, set class and aria-hidden attribute, and hide it
var tabPanels = tabs.querySelectorAll('section');
tabPanels.forEach(function(tabPanel) {
  tabPanel.setAttribute('role', 'tabpanel');
});

// Make all but the first section hidden (ARIA state and display CSS)
tabs.querySelectorAll('[role="tabpanel"]:not(:first-of-type)').forEach(function(tabPanel) {
  tabPanel.setAttribute('aria-hidden', 'true');
});

// Get the list of tab links
var tabsList = tabs.querySelector('ul');
tabsList.setAttribute('role', 'tablist');
tabsList.querySelectorAll('li').forEach(function(li) {
  li.setAttribute('role', 'presentation');
  var a = li.querySelector('a');
  a.setAttribute('role', 'tab');
  a.setAttribute('aria-control', a.getAttribute('href').substring(1));
});

// Init tab selector click behavior
tabs.querySelectorAll('[role="tab"]').forEach(function(e) {
  e.onclick = function(event) {
    event.preventDefault();
    tabs.querySelectorAll('[role="tab"]').forEach(function(t) {
      // Remove focusability [sic] and aria-selected
      t.setAttribute('tabindex', '-1');
      t.removeAttribute('aria-selected');
    });
    // Replace above on clicked tab
    e.setAttribute('tabindex', '0');
    e.setAttribute('aria-selected', true);

    // Hide panels
    tabPanels.forEach(function(p) {
      p.setAttribute('aria-hidden', 'true');
    });

    // Show corresponding panel
    var activePanel = tabs.querySelector(e.getAttribute('href'));
    activePanel.removeAttribute('aria-hidden');

    // calculate new height
    fitPreviewToContent();
    postEmbedHeightToViewer();
  };
});
