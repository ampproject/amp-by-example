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
	RATING_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/rating/"
)

func InitRatingSample() {
	RegisterHandler(RATING_SAMPLE_PATH+"set", onlyPost(submitRatingXHR))
}

func submitRatingXHR(w http.ResponseWriter, r *http.Request) {
	rating := r.FormValue("rating")
	SendJsonResponse(w, map[string]string{
		"rating": rating,
	})
}
