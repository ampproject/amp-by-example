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
	"fmt"
	"net/http"
)

const (
	ERROR_CASE_AMP_FORM = "error"
	FORM_SAMPLE_PATH    = "/components/amp-form/"
)

func InitAmpForm() {
	http.HandleFunc(HOUSING_SAMPLE_PATH+"submit-form-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitFormXHR)
	})
	http.HandleFunc(HOUSING_SAMPLE_PATH+"submit-form", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitForm)
	})

}

func submitFormXHR(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
	w.Header().Set("Content-Type", "application/json")
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
	if isUserTryingTheErrorDemo(r.FormValue("name")) {
		http.Redirect(w, r, fmt.Sprintf("%s/amp-form-error/", buildSourceOrigin(r.Host)), http.StatusSeeOther)
	} else {
		http.Redirect(w, r, fmt.Sprintf("%s/amp-form-success/", buildSourceOrigin(r.Host)), http.StatusSeeOther)
	}
}

func isUserTryingTheErrorDemo(name string) bool {
	return name == ERROR_CASE_AMP_FORM
}


