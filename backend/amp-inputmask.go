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
	"net/http"
)

const (
	AMP_INPUTMASK_SAMPLE_NAME = "/" + CATEGORY_COMPONENTS + "/amp-inputmask/"
)

func InitAmpInputmask() {
	RegisterHandler(AMP_INPUTMASK_SAMPLE_NAME+"default", onlyPost(submitPostalFormXHRInputMask))
	RegisterHandler(AMP_INPUTMASK_SAMPLE_NAME+"postal", onlyPost(submitDefaultFormXHRInputMask))
	RegisterHandler(AMP_INPUTMASK_SAMPLE_NAME+"phone", onlyPost(submitPhoneFormXHRInputMask))
}

func submitDefaultFormXHRInputMask(w http.ResponseWriter, r *http.Request) {
	SendJsonResponse(w, map[string]interface{}{})
}

func submitPostalFormXHRInputMask(w http.ResponseWriter, r *http.Request) {
	code := r.FormValue("code")
	codeUnmasked := r.FormValue("code-unmasked")

	SendJsonResponse(w, map[string]interface{}{
		"code":          code,
		"code-unmasked": codeUnmasked,
	})
}

func submitPhoneFormXHRInputMask(w http.ResponseWriter, r *http.Request) {
	code := r.FormValue("phone")
	codeUnmasked := r.FormValue("phone-unmasked")

	SendJsonResponse(w, map[string]interface{}{
		"phone":          code,
		"phone-unmasked": codeUnmasked,
	})
}
