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
	"net/http"
	"os"
	"playground"
	"strings"
)

const (
	MAX_AGE_IN_SECONDS = 180 // three minutes
	OLD_ADDRESS        = "amp-by-example.appspot.com"
	DIST_DIR           = "dist"
)

func init() {
	backend.InitRedirects()
	backend.InitAmpLiveList()
	backend.InitAmpForm()
	backend.InitAmpCache()
	backend.InitProductBrowse()
	backend.InitHousingForm()
	backend.InitAmpAnalytics()
	backend.InitCommentSection()
	backend.InitHotelSample()
	backend.InitSlowResponseSample()
	backend.InitPollSample()
	backend.InitRatingSample()
	backend.InitAutosuggestSample()
	backend.InitPagedListSample()
	backend.InitAmpAccess()
	backend.InitFavoriteSample()
	backend.InitCheckout()
	playground.InitPlayground()
	http.Handle("/", ServeStaticFiles(HandleNotFound(http.FileServer(http.Dir(DIST_DIR)))))
}

func HandleNotFound(h http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") && !exists(DIST_DIR+r.URL.Path+"index.html") {
			http.NotFound(w, r)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func ServeStaticFiles(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == OLD_ADDRESS || backend.IsInsecureRequest(r) {
			backend.RedirectToSecureVersion(w, r)
			return
		}
		backend.EnableCors(w, r)
		backend.SetDefaultMaxAge(w)
		h.ServeHTTP(w, r)
	})
}

func exists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}
