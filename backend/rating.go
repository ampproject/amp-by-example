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
	RATING_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/rating/"
)

func InitRatingSample() {
	http.HandleFunc(RATING_SAMPLE_PATH+"set", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitRatingXHR)
	})
}

func submitRatingXHR(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	rating := r.FormValue("rating")
	response := fmt.Sprintf("{\"rating\":\"%s\"}", rating)
	w.Write([]byte(response))
}
