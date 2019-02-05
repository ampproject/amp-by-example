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
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"google.golang.org/appengine"
	"google.golang.org/appengine/urlfetch"
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
	return SetVary(EnableCors(
		func(w http.ResponseWriter, r *http.Request) {
			if r.Host == OLD_ADDRESS || IsInsecureRequest(r) {
				RedirectToSecureVersion(w, r)
				return
			}
			if isAMP(r) && shouldProxy(r) {
				p := proxyGAE(PACKAGER_PREFIX, r)
				t := r.URL.String()
				r.URL.RawQuery = "sign=" + url.QueryEscape(NEW_ADDRESS+r.URL.Path)
				r.URL.Path = "/priv/doc"
				log.Printf("Proxying request for [%s] to [%s]", t, r.URL.String())
				p.ServeHTTP(w, r)
			} else {
				if strings.HasSuffix(r.URL.Path, ".json") {
					w.Header().Set("Content-Type", "application/json")
				}
				SetDefaultMaxAge(w)
				h.ServeHTTP(w, r)
			}
		}))
}

func proxyGAE(prefix string, r *http.Request) *httputil.ReverseProxy {
	u, err := url.Parse(prefix)
	if err != nil {
		log.Fatal(err)
	}
	p := httputil.NewSingleHostReverseProxy(u)
	// Fiddling with the transport might not be necessary with the Go 1.11 runtime:
	// https://cloud.google.com/blog/products/application-development/go-1-11-is-now-available-on-app-engine
	p.Transport = &urlfetch.Transport{
		Context: appengine.NewContext(r),
	}
	return p
}

func shouldProxy(r *http.Request) bool {
	return r.Header.Get("amp-cache-transform") != ""
}

func isAMP(r *http.Request) bool {
	// TODO Improve heuristics...
	return !strings.HasSuffix(r.URL.Path, ".json")
}

func exists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}
