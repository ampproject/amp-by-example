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

const (
	ACCESS_SAMPLE_PATH = "/components/amp-access/"
)

type AuthorizationResponse struct {
	User       string `json:"username"`
	Status     string `json:"status"`
	Freenights int    `json:"freenights"`
}

func InitAmpAccess() {
	http.HandleFunc(ACCESS_SAMPLE_PATH+"authorization", handleAuthorization)
	http.HandleFunc(ACCESS_SAMPLE_PATH+"pingback", handlePingback)
	http.HandleFunc(ACCESS_SAMPLE_PATH+"login", handleLogin)
}

func handleAuthorization(w http.ResponseWriter, r *http.Request) {

	authedUser := AuthorizationResponse{"test-user", "Gold", 2}
	js, err := json.Marshal(authedUser)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func handlePingback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
}
