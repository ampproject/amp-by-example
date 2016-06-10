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

package api

import (
	"encoding/json"
	"google.golang.org/appengine"
	"net/http"
)

// init the handlers
func init() {
	http.HandleFunc("/url", apiHandler)
}

// URL API handler routing calls the actual AMP URL API
// which doesn't support CORS access.
func apiHandler(w http.ResponseWriter, r *http.Request) {
	if r.Host != "amp-by-example-api.appspot.com" {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	ctx := appengine.NewContext(r)
	decoder := json.NewDecoder(r.Body)
	var requestBody RequestBody
	err := decoder.Decode(&requestBody)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Could not parse json request: " + err.Error()))
	}
	res, err := Amplify(ctx, requestBody)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Could not amplify: " + err.Error()))
	}
	w.Write(res)
}
