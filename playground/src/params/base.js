import URLSearchParams from 'url-search-params';

class Params {

  constructor(win) {
    this.win = win;
  }

  get(key, alt) {
    const params = new URLSearchParams(this.win.location.hash.slice(1));
    let result = params.get(key);
    if (!result) {
      result = alt;
    }
    return result;
  }

  replace(key, value) {
    this.win.history.replaceState(null, null, this._newLocation(key, value));
  }

  push(key, value) {
    this.win.history.pushState(null, null, this._newLocation(key, value));
  }

  _newLocation(key, value) {
    const params = new URLSearchParams(this.win.location.hash.slice(1));
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    let paramsString = params.toString();
    if (paramsString) {
      paramsString = '#' + params.toString();
    }
    return this.win.location.pathname + paramsString;
  }
}

export default new Params(window);
