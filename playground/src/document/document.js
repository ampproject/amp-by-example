import events from '../events/events.js';

const ROOT = '/document/';
export const EVENT_DOCUMENT_STATE_CHANGED = 'playground-document-state-changed';

export const DIRTY = 'dirty';
export const SAVED = 'saved';
export const READ_ONLY = 'readOnly';

export function createDocument() {
  return new PlaygroundDocument(window);
}

class PlaygroundDocument {
  constructor(win) {
    this.win = win;
    this.state = SAVED;
    this.docId = '';
  }

  fetchUrl(url) {
    return fetch(url, {
      mode: 'cors',
    }).then(response => {
      if (!response.ok) {
        throw new Exception('Failed fetching document');
      }
      this._changeState(READ_ONLY);
      return response.text();
    });
  }

  fetchDocument(docId) {
    this.docId = docId;
    return fetch(ROOT + docId, {
      mode: 'cors',
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Exception('Failed fetching document');
        }
        return response.json();
      })
      .then(jsonDocument => {
        if (jsonDocument.readOnly) {
          this._changeState(READ_ONLY);
          this.docId = '';
        } else {
          this.docId = jsonDocument.id;
        }
        return jsonDocument.content;
      });
  }

  update() {
    this._changeState(DIRTY);
  }

  fork(snippet) {
    return this._saveSnippet(snippet, '');
  }

  save(snippet) {
    return this._saveSnippet(snippet, this.docId);
  }

  _saveSnippet(snippet, snippetId) {
    const url = ROOT + snippetId;
    return fetch(url, {
      method: 'POST',
      body: snippet,
      credentials: 'include',
    }).then(response => response.json())
      .then(data => {
        this._changeState(SAVED);
        return data.id;
      });
  }

  _changeState(newState) {
    if (this.state === newState) {
      return;
    }
    if (this.state === READ_ONLY && newState === DIRTY) {
      return;
    }
    this.state = newState;
    events.publish(EVENT_DOCUMENT_STATE_CHANGED, this.state);
  }
}
