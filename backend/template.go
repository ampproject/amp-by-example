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
	"io"
	"net/http"
	"os"
	"path"
)

type Page struct {
	Mode     string
	Route    string
	template *template.Template
}

func (self Page) Render(wr io.Writer, data interface{}) {
	self.template.Execute(wr, data)
}

var MODES = [...]string{"", "/embed", "/source", "/preview", "/preview/embed"}

// RegisterSample adds routes for different sample modes, e.g. (my_sample/embed, my_sample/preview,..).
// Use it whenever a sample requires a custom backend logic.
func RegisterSample(samplePath string, handler func(http.ResponseWriter, *http.Request, Page)) {
	for _, mode := range MODES {
		registerSampleHandler(samplePath, mode, handler)
	}
}

// RegisterSampleEndpoint adds routes for different sample modes ((my_sample/search/embed,
// my_sample/search/preview,..)). Use this for samples requiring additional mode specific endpoints.
func RegisterSampleEndpoint(samplePath string, name string,
	handler func(http.ResponseWriter, *http.Request, Page)) {
	for _, mode := range MODES {
		registerSampleEndpointHandler(samplePath, mode, name, handler)
	}
}

// RegisterTemplate configures a handler for requests rendering a template.
func RegisterTemplate(route string, mode string, templatePath string,
	handler func(http.ResponseWriter, *http.Request, Page)) {
	page := Page{
		Mode:     mode,
		template: parseTemplate(templatePath),
		Route:    route,
	}
	RegisterHandler(route, func(w http.ResponseWriter, r *http.Request) {
		if IsInsecureRequest(r) {
			RedirectToSecureVersion(w, r)
			return
		}
		handler(w, r, page)
	})
}

func registerSampleEndpointHandler(samplePath string, mode string, endpoint string,
	handler func(http.ResponseWriter, *http.Request, Page)) {
	route := path.Join(samplePath, mode, endpoint)
	page := Page{
		Route: route,
		Mode:  mode,
	}
	RegisterHandler(route, func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, page)
	})
}

func registerSampleHandler(samplePath string, mode string, handler func(http.ResponseWriter, *http.Request, Page)) {
	templatePath := path.Join(DIST_FOLDER, samplePath, mode, "index.html")
	if _, err := os.Stat(templatePath); err != nil {
		return
	}
	route := path.Join("/", samplePath, mode) + "/"
	RegisterTemplate(route, mode, templatePath, handler)
}

func parseTemplate(filePath string) *template.Template {
	template, err := template.New(path.Base(filePath)).Delims("[[", "]]").ParseFiles(filePath)
	if err != nil {
		panic(err)
	}
	return template
}
