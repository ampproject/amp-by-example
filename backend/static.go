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
	"os"
	"strings"
)

const (
	MAX_AGE_IN_SECONDS = 180 // three minutes
	OLD_ADDRESS        = "amp-by-example.appspot.com"
	DIST_DIR           = "dist"
)

func InitStatic() {
	fileserver := http.FileServer(http.Dir(DIST_DIR))
	http.Handle("/", serveStaticFiles(handleNotFound(fileserver)))
}

func handleNotFound(h http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") && !exists(DIST_DIR+r.URL.Path+"index.html") {
			http.NotFound(w, r)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func serveStaticFiles(h http.Handler) http.Handler {
	return EnableCors(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == OLD_ADDRESS || IsInsecureRequest(r) {
			RedirectToSecureVersion(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, ".json") {
			w.Header().Set("Content-Type", "application/json")
		}
		SetDefaultMaxAge(w)
		h.ServeHTTP(w, r)
	})
}

func exists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}
