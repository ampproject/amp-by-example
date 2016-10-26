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
	"encoding/json"
	"net/http"
)

type AuthorizationResponse interface {
	CreateAuthorizationResponse() AuthorizationResponse
}

func handleAuthorization(w http.ResponseWriter, r *http.Request, authedUser AuthorizationResponse) {
	js, err := json.Marshal(authedUser)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	EnableCors(w, r)
	SetContentTypeJson(w)
	w.Write(js)
}

func handlePingback(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	// nothing to do
}
