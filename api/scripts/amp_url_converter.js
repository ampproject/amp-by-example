/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const DEFAULT_URL = "https://www.example.com/amp?param=value";
const AMP_CACHE_PREFIX = "https://cdn.ampproject.org/c/";

class AmpUrlConverter {

  constructor(root, ampUrlFactory) {
    this.inputView = root.getElementById('input');
    this.resultView = root.getElementById('result');
    this.ampUrlFactory = ampUrlFactory;
    root.getElementById('execute')
      .addEventListener("click", this.onClick.bind(this));
  }

  setInput(urlString) {
    this.inputView.value = urlString;
    this.convert(urlString);
  }

  convert(urlString) {
    urlString = urlString.trim();
    if (!urlString) {
      this.showError('Empty input');
      return;
    }
    if (!/^http[s]?\:\/\//i.test(urlString)) {
      urlString = 'http://' + urlString;
      this.inputView.value = urlString;
    }
    try {
      const ampUrl = this.ampUrlFactory.createAmpUrl(urlString);
      const proxyUrl = ampUrl.getProxyUrl();
      this.showResult('<a href="' + proxyUrl + '" target="_parent">' + proxyUrl + '</a>');
    }catch(e) {
      this.showError('Invalid URL');
    }
  }

  showError(message) {
    this.resultView.className = 'error';
    this.resultView.innerHTML = message;
  }

  showResult(result) {
    this.resultView.className = '';
    this.resultView.innerHTML = result;
  }

  onClick() {
    this.convert(this.inputView.value);
  }

}

function getParameterByName(name, defaultValue) {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) { return defaultValue; }
  if (!results[2]) { return defaultValue; }
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const proxyUrlPrefix = 'https://cdn.ampproject.org';
const javascriptVersion = '5';
const useCurlsEncoding = true;
const ampUrlFactory = 
  new AmpUrlFactory(proxyUrlPrefix, javascriptVersion, useCurlsEncoding);

const converter = new AmpUrlConverter(document, ampUrlFactory);
const initialUrl = getParameterByName('url', 'https://www.example.com/amp?param=1');

converter.setInput(initialUrl);
