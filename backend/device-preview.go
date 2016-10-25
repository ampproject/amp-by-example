// Copyright Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package backend

import (
	"html/template"
	"net/http"
	"net/url"
	"strings"
)

const (
	AmpCache   = "https://cdn.ampproject.org/c/"
	DefaultUrl = "https://ampbyexample.com"
)

type AmpUrls struct {
	Host      string
	Url       string
	CachedUrl string
}

func InitDevicePreview() {
	http.HandleFunc("/amp-viewer-device-preview", ampViewerDevicePreviewHandler)
}

func ampViewerDevicePreviewHandler(w http.ResponseWriter, r *http.Request) {
	urlString, err := url.QueryUnescape(r.URL.Query().Get("url"))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
		return
	}
	if urlString == "" {
		urlString = DefaultUrl
	} else if !strings.HasPrefix(urlString, "http") {
		urlString = "http://" + urlString
	}
	amp := AmpUrls{Url: urlString}
	u, err := url.Parse(urlString)
	if err != nil {
		amp.Host = "error"
		amp.CachedUrl = ""
	} else {
		amp.Host = u.Host
		if u.Scheme == "https" {
			amp.CachedUrl = AmpCache + "s/" + amp.Host + u.Path
		} else {
			amp.CachedUrl = AmpCache + amp.Host + u.Path
		}
	}
	renderDeviceTemplate(w, "amp-viewer-device-preview", amp)
}

func renderDeviceTemplate(w http.ResponseWriter, templateName string, data interface{}) {
	t, _ := template.ParseFiles("templates/" + templateName + ".html")
	t.Execute(w, data)
}
