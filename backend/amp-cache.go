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
)

func InitAmpCache() {
	http.HandleFunc("/g", getParameterDemoHandler)
	http.HandleFunc("/error", returnCode500)
}

func getParameterDemoHandler(w http.ResponseWriter, r *http.Request) {
	value := r.URL.Query().Get("value")
	renderTemplate(w, "get-example", value)
}

func returnCode500(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte("Internal Server Error"))
}

func renderTemplate(w http.ResponseWriter, templateName string, value string) {
	t, _ := template.ParseFiles("templates/" + templateName + ".html")
	t.Execute(w, value)
}
