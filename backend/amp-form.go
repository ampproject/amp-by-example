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
	RegisterHandler(SAMPLE_NAME+"submit-form-input-text-xhr", onlyPost(submitFormXHRInputText))
	RegisterHandler(SAMPLE_NAME+"verify-form-input-text-xhr", onlyPost(verifyFormXHRInputText))
	RegisterHandler(SAMPLE_NAME+"submit-form-xhr", onlyPost(submitFormXHR))
	RegisterHandler(SAMPLE_NAME+"submit-form", submitForm)
}

func submitFormXHRInputText(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	name := r.FormValue("name")
	if isUserTryingTheInputTextErrorDemo(name) {
		SendJsonError(w, http.StatusBadRequest, map[string]string{
			"name":  name,
			"email": email,
		})
		return
	}

	SendJsonResponse(w, map[string]string{
		"name":  name,
		"email": email,
	})
}

func verifyFormXHRInputText(w http.ResponseWriter, r *http.Request) {
	name := r.FormValue("username")
	if isUserTryingTheInputTextErrorDemo(name) {
		SendJsonError(w, http.StatusBadRequest, map[string]interface{}{
			"verifyErrors": []interface{}{
				map[string]string{
					"name":    "username",
					"message": fmt.Sprintf("The username %q is already taken", name),
				},
			},
		})
		return
	}
	SendJsonResponse(w, map[string]string{
		"username": name,
	})
}

func submitFormXHR(w http.ResponseWriter, r *http.Request) {
	SendJsonResponse(w, map[string]string{
		"result": "ok",
	})
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
