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

func InitAmpAnalytics() {
	RegisterSample(CATEGORY_COMPONENTS+"/amp-analytics", renderAnalyticsSample)
}

func renderAnalyticsSample(w http.ResponseWriter, r *http.Request, page Page) {
	SetDefaultMaxAge(w)
	page.Render(w, clientId(r))
}

func clientId(r *http.Request) string {
	cookie, err := r.Cookie(AMP_CLIENT_ID_COOKIE)
	if err != nil {
		return RandomString(8)
	} else {
		return cookie.Value
	}
}
