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
	"strings"
)

const NEW_ADDRESS = "https://ampbyexample.com"
const DEFAULT_MAX_AGE = 60

func RedirectToSecureVersion(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, NEW_ADDRESS+r.URL.Path, http.StatusMovedPermanently)
}

func IsInsecureRequest(r *http.Request) bool {
	return r.TLS == nil && !strings.HasPrefix(r.Host, "localhost")
}

func isFormPostRequest(method string, w http.ResponseWriter) bool {
	if method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return false
	}
	return true
}

func EnableCors(w http.ResponseWriter, r *http.Request) {
	origin := GetOrigin(r)
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	sourceOrigin := GetSourceOrigin(r)
	if sourceOrigin == "" {
		return
	}
	w.Header().Set("Access-Control-Expose-Headers", "AMP-Access-Control-Allow-Source-Origin")
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", sourceOrigin)
}

func GetOrigin(r *http.Request) string {
	origin := r.Header.Get("Origin")
	if origin != "" {
		return origin
	}
	if r.Header.Get("amp-same-origin") == "true" {
		return GetSourceOrigin(r)
	}
	return "*"
}

func GetSourceOrigin(r *http.Request) string {
	// TODO perform checks if source origin is allowed
	return r.URL.Query().Get("__amp_source_origin")
}

func GetHost(r *http.Request) string {
	if r.TLS == nil {
		return "http://" + r.Host
	}
	return "https://" + r.Host
}

func SetContentTypeJson(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
}

func SetDefaultMaxAge(w http.ResponseWriter) {
	SetMaxAge(w, DEFAULT_MAX_AGE)
}

func SetMaxAge(w http.ResponseWriter, age int) {
	w.Header().Set("cache-control", fmt.Sprintf("max-age=%d, public, must-revalidate", age))
}

func handlePost(w http.ResponseWriter, r *http.Request, postHandler func(http.ResponseWriter, *http.Request)) {
	if r.Method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return
	}
	postHandler(w, r)
}
