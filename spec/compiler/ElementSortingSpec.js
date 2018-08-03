/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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

describe('ElementSorting', function() {

  const CodeSection = require('../../lib/CodeSection');
  const Document = require('../../lib/Document');
  const elementSorting = require('../../lib/ElementSorting');

  const body = '<body><div></div>';
  const appBanner = '<amp-app-banner><child></child></amp-app-banner>';
  const sidebar = '<amp-sidebar><child></child></amp-sidebar>';
  const nestedAppBanner = '<div>' + appBanner + '</div>';

  const multiLineBody = '\n<body>\n<div></div>';
  const multiLineSidebar = '\n<amp-sidebar>\n<child>\n\n</child></amp-sidebar>';
  const sidebarWithAttribute = '<amp-sidebar id="menu"><child></child></amp-sidebar>';

  beforeEach(function() {
    doc = new Document();
  });

  describe('amp-app-banner', function(){
    it('removes amp-app-banner', function() {
      const sectionWithAppBanner = addSection(appBanner);
      elementSorting.apply(doc);
      expect(sectionWithAppBanner.preview).toBe('');
    });

    it('removes nested amp-app-banner', function() {
      const sectionWithAppBanner = addSection(nestedAppBanner);
      elementSorting.apply(doc);
      expect(sectionWithAppBanner.preview).toBe('<div></div>');
    });

    it('appends amp-app-banner after body', function() {
      addSection(body);
      addSection(nestedAppBanner);
      elementSorting.apply(doc);
      expect(doc.elementsAfterBody).toBe(appBanner);
    });
  });

  describe('amp-sidebar', function(){
    it('removes amp-sidebar', function() {
      const sectionWithSidebar = addSection(sidebar);
      elementSorting.apply(doc);
      expect(sectionWithSidebar.preview).toBe('');
    });
    it('removes multiple sidebars', function() {
      addSection(sidebar);
      const secondSection = addSection(sidebar);
      elementSorting.apply(doc);
      expect(secondSection.preview).toBe('');
    });
    it('appends amp-sidebar after body', function() {
      addSection(body);
      addSection(sidebar);
      elementSorting.apply(doc);
      expect(doc.elementsAfterBody).toBe(sidebar);
    });
  });

  describe('parsing matches', function(){
    it('body with multiple lines', function() {
      addSection(multiLineBody);
      addSection(sidebar);
      elementSorting.apply(doc);
      expect(strip(doc.elementsAfterBody)).toBe(sidebar);
    });
    it('element with multiple lines', function() {
      addSection(body);
      addSection(multiLineSidebar);
      elementSorting.apply(doc);
      expect(strip(doc.elementsAfterBody)).toBe(strip(multiLineSidebar));
    });
    it('element with attributes', function() {
      addSection(body);
      addSection(sidebarWithAttribute);
      elementSorting.apply(doc);
      expect(doc.elementsAfterBody).toBe(sidebarWithAttribute);
    });
  });

  it('places sidebar directly after body', function() {
    const bodySection = addSection(body);
    const sectionWithSidebar = addSection(sidebar);
    const sectionWithAppBanner = addSection(appBanner);
    elementSorting.apply(doc);
    expect(doc.elementsAfterBody).toBe(sidebar + appBanner);
  });

  function strip(string) {
    return string.replace(/\n/g, '');
  }

  function addSection(string) {
    const cs = new CodeSection();
    cs.preview = string;
    doc.addSection(cs);
    return cs;
  };

});

