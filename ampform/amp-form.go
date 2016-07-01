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

package ampform

import (
	"bytes"
	"fmt"
	"net/http"
	"strings"
)

const (
	ERROR_CASE_AMP_FORM = "error"
)

func Init() {
	http.HandleFunc("/components/amp-form/submit-form-xhr", submitFormXHR)
	http.HandleFunc("/components/amp-form/submit-form", submitForm)
}

func submitFormXHR(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
	w.Header().Set("Content-Type", "application/json")
	if r.Method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return
	}
	response := ""
	name := r.FormValue("name")
	if isUserTryingTheErrorDemo(name) {
		w.WriteHeader(http.StatusBadRequest)
	}
	email := r.FormValue("email")
	response = fmt.Sprintf("{\"name\":\"%s\", \"email\":\"%s\"}", name, email)
	w.Write([]byte(response))
}

func submitForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return
	}
	if isUserTryingTheErrorDemo(r.FormValue("name")) {
		http.Redirect(w, r, fmt.Sprintf("%s/amp-form-error/", buildSourceOrigin(r.Host)), http.StatusSeeOther)
	} else {
		http.Redirect(w, r, fmt.Sprintf("%s/amp-form-success/", buildSourceOrigin(r.Host)), http.StatusSeeOther)
	}
}

func isUserTryingTheErrorDemo(name string) bool {
	return name == ERROR_CASE_AMP_FORM
}

func buildSourceOrigin(host string) string {
	var sourceOrigin bytes.Buffer
	if strings.HasPrefix(host, "localhost") {
		sourceOrigin.WriteString("http://")
	} else {
		sourceOrigin.WriteString("https://")
	}
	sourceOrigin.WriteString(host)
	return sourceOrigin.String()
}
