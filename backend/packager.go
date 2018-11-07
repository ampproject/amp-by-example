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

	"google.golang.org/appengine"
	"google.golang.org/appengine/urlfetch"
)

func InitPackager() {
	http.HandleFunc("/amppkg/", func(w http.ResponseWriter, r *http.Request) {
		u, err := url.Parse(PACKAGER_PREFIX)
		if err != nil {
			log.Fatal(err)
		}
		p := httputil.NewSingleHostReverseProxy(u)
		// Need to fiddle with Transport; on GAE this needs to change on every
		// request. Might not be necessary under Go 1.11:
		// https://cloud.google.com/blog/products/application-development/go-1-11-is-now-available-on-app-engine
		p.Transport = &urlfetch.Transport{
			Context: appengine.NewContext(r),
		}
		log.Printf("Proxying request for [%s] to [%s]", r.URL.String(), PACKAGER_PREFIX)
		p.ServeHTTP(w, r)
	})
	// Blocking /priv/doc is one of the "productionizing" steps:
	// https://github.com/ampproject/amppackager#productionizing
	http.HandleFunc("/priv/doc", http.NotFound)
}
