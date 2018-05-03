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
	"io/ioutil"
	"log"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/urlfetch"
)

// Proxy requests for /.well-known/acme-challenge/* to a completely separate
// domain. This enables the separate domain (where the webpackaging services are
// run) to obtain a certificate for https://ampbyexample.com via letsencrypt.
// See https://certbot.eff.org/docs/using.html#manual for more about how this
// process works, as well as the webpackage directory in this repository.

const ACME_CHALLENGE_PREFIX = "https://abe-packager.appspot.com"

func InitLetsEncrypt() {
	http.HandleFunc("/.well-known/acme-challenge/", func(w http.ResponseWriter, r *http.Request) {
		// Can't use http.Get on appengine, see
		// https://cloud.google.com/appengine/docs/standard/go/issue-requests
		ctx := appengine.NewContext(r)
		client := urlfetch.Client(ctx)
		url := ACME_CHALLENGE_PREFIX + r.URL.Path
		log.Printf("Proxying request for [%s] to [%s]", r.URL.Path, url)
		res, err := client.Get(url)
		if err != nil {
			log.Fatal(err)
		}
		defer res.Body.Close()
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			log.Fatal(err)
		}
		if res.StatusCode != 200 {
			log.Fatalf("Fatal error: GET %s returned status code %d", url, res.StatusCode)
		}
		w.WriteHeader(res.StatusCode)
		w.Header().Set("content-type", res.Header.Get("content-type"))
		w.Write(body)
	})
}
