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
	SAMPLE_NAME         = "/" + CATEGORY_COMPONENTS + "/amp-form/"
)

func InitAmpForm() {
	http.HandleFunc(SAMPLE_NAME+"submit-form-input-text-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitFormXHRInputText)
	})
	http.HandleFunc(SAMPLE_NAME+"verify-form-input-text-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, verifyFormXHRInputText)
	})
	http.HandleFunc(SAMPLE_NAME+"submit-form-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitFormXHR)
	})
	http.HandleFunc(SAMPLE_NAME+"submit-form", func(w http.ResponseWriter, r *http.Request) {
		submitForm(w, r)
	})

}

func submitFormXHRInputText(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := ""
	name := r.FormValue("name")
	if isUserTryingTheInputTextErrorDemo(name) {
		w.WriteHeader(http.StatusBadRequest)
	}
	email := r.FormValue("email")
	response = fmt.Sprintf("{\"name\":\"%s\", \"email\":\"%s\"}", name, email)
	w.Write([]byte(response))
}

func verifyFormXHRInputText(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := ""
	name := r.FormValue("username")
	if isUserTryingTheInputTextErrorDemo(name) {
		w.WriteHeader(http.StatusBadRequest)
		response = fmt.Sprintf("{\"verifyErrors\": [{ "+
			"\"name\": \"username\", "+
			"\"message\":\"The username \\\"%s\\\" is already taken\""+
			"}]}", name)
	} else {
		response = fmt.Sprintf("{\"username\":\"%s\"}", name)
	}
	w.Write([]byte(response))
}

func submitFormXHR(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := "{\"result\":\"ok\"}"
	w.Write([]byte(response))
}

func submitForm(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/amp-form-success/", http.StatusSeeOther)
}

func isUserTryingInpuTextDemo(name string) bool {
	return name != ""
}

func isUserTryingTheInputTextErrorDemo(name string) bool {
	return name == ERROR_CASE_AMP_FORM
}
