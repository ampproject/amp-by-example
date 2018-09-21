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

import CodeMirror from 'codemirror';

const ENGINE_MAP = {
  'amphtml engine v0.js script': '"https://cdn.ampproject.org/v0.js"',
  'amp4ads engine amp4ads-v0.js script': '"https://cdn.ampproject.org/amp4ads-v0.js"'
};
let ENGINE_SET = new Set();

// A lookup to override what type of component an AMP component is
const AMP_SCRIPT_TYPE_MAP = {
  'amp-mustache': 'custom-template'
};

// Used as a lookup for attribute names that identify a script tag as being an
// AMP component.
const CUSTOM_ATTRS = {
  'custom-element': 1,
  'custom-template': 1
};

export function createAutoImporter(componentsProvider, editor) {
  return new AutoImporter(componentsProvider, editor);
}

class AutoImporter {

  constructor(componentsProvider, editor) {
    this.componentsProvider = componentsProvider;
    this.editor = editor;
    Object.keys(ENGINE_MAP).forEach((k) => ENGINE_SET.add(ENGINE_MAP[k]));
  }

  update(validationResult) {
    if (validationResult.status !== 'FAIL') {
      return;
    }
    // If the cursor is currently in a tag, e.g. a tag is being entered, don't
    // attempt to act on validation results. Wait til the tag has been fully
    // entered, to avoid any mix up that could occur from one tag being the stem
    // of another, e.g. amp-access and amp-access-laterpay.
    const currentTag = this.editor.getTokenAt(this.editor.getCursor());
    if (currentTag.type === 'tag') {
      return;
    }
    this.componentsProvider.get().then((components) => {
      const missing = this._parseMissingElements(validationResult, components);

      if (Object.keys(missing.missingTags).length
          || missing.missingBaseScriptTag) {
        const existing = this._parseHeadTag();
        // The action taken to insert any elements to fix the report of missing
        // tags is determined by both a combination of looking at the list of
        // missing elements and also the current state of the <head> tag.
        this._insertMissingElements(missing, existing, components);
      }
    });
  }

  /**
   * Inserts missing <script> tags into the document, based on results from the
   * AMP validator, and results from inspecting the current <head> structure.
   *
   * @param {!Object} missing The results from {@code _parseMissingElements()}.
   * @param {!Object} existing The results from {@code _parseHeadTag()}.
   * @param {!Object.<string, string>} components A mapping between AMP
   *     component name and the known version. e.g. amp-bind -> 0.1
   */
  _insertMissingElements(missing, existing, components) {
    const pos = existing.baseScriptTagEnd || existing.lastTag;
    if (!pos) {
      return;
    }
    const toAdd = Object.keys(missing.missingTags)
        // Verify that all components to insert don't already exist: In some
        // circumstances the validator has reported tags missing when in fact
        // they are present.
        .filter((e) => !existing.tags[e])
        .map((e) => this._createAmpComponentElement(e, components));
    if (missing.missingBaseScriptTag && !existing.baseScriptTagEnd) {
      const t = `<script async src=${missing.missingBaseScriptTag}></script>`;
      toAdd.unshift(t);
    }
    if (toAdd.length) {
      const indented = toAdd.map((e) => ' '.repeat(existing.indent || 0) + e);
      const cur = this.editor.getCursor();
      this.editor.replaceRange('\n' + indented.join('\n'), pos, pos);
      this.editor.setCursor(cur.line + indented.length, cur.ch);
    }
  }

  /**
   * Retrieves details of missing AMP components from the AMP validator results.
   *
   * @param {!ValidationResult} validationResult The result from the Validator.
   * @param {!Object.<string, string>} components A mapping between AMP
   *     component name and the known version. e.g. amp-bind -> 0.1
   *
   * @return {{
   *   missingTags: Object,<string, number>,
   *   missingBaseScriptTag: ?string
   * }}
   *
   * missingTags: The keys of this dictionary are those missing AMP components.
   * missingBaseScriptTag: The URL of the missing AMP engine, if missing.
   */
  _parseMissingElements(validationResult, components) {
    let missingElements = {
      missingBaseScriptTag: null,
      missingTags: {}
    };

    for (let err of validationResult.errors) {
      if (err.category === 'MANDATORY_AMP_TAG_MISSING_OR_INCORRECT') {
        switch(err.code) {
          case 'MANDATORY_TAG_MISSING':
            if (err.params && ENGINE_MAP[err.params[0]]) {
              missingElements.missingBaseScriptTag = ENGINE_MAP[err.params[0]];
            }
            break;
          case 'MISSING_REQUIRED_EXTENSION':
          case 'ATTR_MISSING_REQUIRED_EXTENSION':
            if (err.params && err.params.length > 1) {
              const tagName = err.params[1];
              if (components[tagName]) {
                missingElements.missingTags[tagName] = 1;
              } else {
                console.log(`Warning: Unknown AMP component : ${tagName}`);
              }
            }
            break;
          default:
            // no default
        }
      }
    }
    return missingElements;
  }

  /**
   * Parses the CodeMirror document and extracts details of the current <head>
   * structure, if present.
   *
   * This is used primarily to determine the insertion point for any AMP
   * components that are missing. It has a secondary use of being used to
   * verify that elements reported by AMP validator as missing are indeed
   * missing.
   *
   * @return {{
   *   tags: Object,<string, {start: CodeMirror.Pos, end: CodeMirror.Pos}>,
   *   [lastTag]: CodeMirror.Pos,
   *   [baseScriptTagEnd]: CodeMirror.Pos,
   *   [indent]: number
   * }}
   *
   * tags: A dictionary of existing AMP components found in the <head> tag, if
   *     any, e.g. "amp-bind", "amp-geo", with corresponding start and end.
   * lastTag: The position of the end of the tag at the end of <head>, if
   *     present.
   * baseScriptTagEnd: The position of the end of the AMP engine script tag, if
   *     present.
   * indent: The number of characters that tags are indented in <head>, if
   *     identified.
   */
  _parseHeadTag() {
    const lineCount = this.editor.lineCount();
    let tagStart = null;
    let tag = null;
    let inBaseScriptTag = false;
    let lastTag = null;

    const result = {
      tags: {}
    };

    let i = 0;
    while (i < lineCount && !result.lastTag) {
      const tokens = this.editor.getLineTokens(i);
      let j = 0;
      while (j < tokens.length && !result.lastTag) {
        let tok = tokens[j];
        const htmlState = tok.state.htmlState;
        if (htmlState.context) {
          if (htmlState.tagName === 'script') {
            if (!tagStart) {
              tagStart = CodeMirror.Pos(i, htmlState.tagStart);
              result.indent = htmlState.indented;
            } else if (tok.type === 'attribute' && CUSTOM_ATTRS[tok.string]) {
              // Identified as an AMP component, now extract the component name.
              while (tok.type != 'string' && j < tokens.length - 1) {
                tok = tokens[++j];
              }
              tag = tok.type === 'string' ? tok.string : null;
            } else if (tok.type === 'string' && ENGINE_SET.has(tok.string)) {
              inBaseScriptTag = true;
            }
          } else if (htmlState.context.tagName === 'head' && tok.string === '>'
              && tok.type === 'tag bracket') {
            if (tagStart) {
              // Closing a <script> tag in <head>
              const pos = {start: tagStart, end: CodeMirror.Pos(i, tok.end)};
              if (tag) {
                // Component name is enclosed in quotes, which are removed.
                result.tags[tag.slice(1, -1)] = pos;
              } else if (inBaseScriptTag) {
                result.baseScriptTagEnd = CodeMirror.Pos(i, tok.end);
              }
              tagStart = null;
              tag = null;
              inBaseScriptTag = false;
            } else {
              // Closing some other tag in <head>, or the <head> opening tag.
              // Used to identify the insertion point where the AMP engine
              // script is not present.
              lastTag = CodeMirror.Pos(i, tok.end);
              result.indent = result.indent || htmlState.indented;
            }
          } else if (tok.string === '</' && htmlState.context.tagName === 'head'
              && tok.type === 'tag bracket') {
            // Leaving <head>, record the final tag position within <head> for
            // inserting after.
            result.lastTag = lastTag;
          }
        }
        j++;
      }
      i++;
    }
    return result;
  }

  _createAmpComponentElement(tagName, components) {
    const scriptType = AMP_SCRIPT_TYPE_MAP[tagName] || 'custom-element';
    const ver = components[tagName];
    return `<script async ${scriptType}="${tagName}" ` +
        `src="https://cdn.ampproject.org/v0/${tagName}-${ver}.js"></script>`;
  }

}
