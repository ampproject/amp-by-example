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
	"bytes"
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

func buildSourceOrigin(host string) string {
	var sourceOrigin bytes.Buffer
	if strings.HasPrefix(host, "localhost") {
		sourceOrigin.WriteString("http://")
	} else {
		sourceOrigin.WriteString("https://")
	}
	sourceOrigin.WriteString(host)
	return sourceOrigin.String()
}

func isFormPostRequest(method string, w http.ResponseWriter) bool {
	if method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return false
	}
	return true
}

func EnableCors(w http.ResponseWriter, r *http.Request) {
	sourceOrigin := buildSourceOrigin(r.Host)
	w.Header().Set("Access-Control-Allow-Origin", sourceOrigin)
	w.Header().Set("Access-Control-Expose-Headers", "AMP-Access-Control-Allow-Source-Origin")
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", sourceOrigin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
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
