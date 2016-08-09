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

package main

import (
	"backend"
	"fmt"
	"net/http"
	"os"
	"strings"
)

const (
	MAX_AGE_IN_SECONDS = 180 // three minutes
	OLD_ADDRESS        = "amp-by-example.appspot.com"
	NEW_ADDRESS        = "https://ampbyexample.com"
	DIST_DIR           = "dist"
)

func init() {
	backend.InitRedirects()
	backend.InitAmpLiveList()
	backend.InitAmpForm()
	backend.InitAmpCache()
	backend.InitProductListing()
	backend.InitHousingForm()
	backend.InitAmpAccess()
	backend.InitAmpAnalytics()
	http.Handle("/", RedirectDomain(NoDirListing(http.FileServer(http.Dir(DIST_DIR)))))
}

func NoDirListing(h http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") && !exists(DIST_DIR+r.URL.Path+"index.html") {
			http.NotFound(w, r)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func RedirectDomain(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == OLD_ADDRESS ||
			(r.TLS == nil && !strings.HasPrefix(r.Host, "localhost")) {
			http.Redirect(w, r, NEW_ADDRESS+r.URL.Path, http.StatusMovedPermanently)
			return
		}
		w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public", MAX_AGE_IN_SECONDS))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		h.ServeHTTP(w, r)
	})
}

func exists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}
