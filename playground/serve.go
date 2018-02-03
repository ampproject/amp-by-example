/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package playground

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"appengine"
	"appengine/urlfetch"
)

var validRequestUrlOrigins map[string]bool

func InitPlayground() {
	http.HandleFunc("/playground/fetch", handler)
	validRequestUrlOrigins = map[string]bool{
		"ampbyexample.com":                     true,
		"ampstart.com":                         true,
		"ampstart-staging.firebaseapp.com":     true,
		"localhost:8080":                       true,
		"amp-by-example-staging.appspot.com":   true,
		"amp-by-example-sebastian.appspot.com": true,
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "only GET request supported", http.StatusBadRequest)
		return
	}
	if r.Header.Get("x-requested-by") != "playground" {
		http.Error(w, "x-requested-by invalid", http.StatusBadRequest)
		return
	}
	param, _ := r.URL.Query()["url"]
	if len(param) <= 0 {
		http.Error(w, "No URL provided via 'url' query parameter", http.StatusBadRequest)
		return
	}
	u, err := url.Parse(param[0])
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		http.Error(w, "Invalid URL scheme", http.StatusBadRequest)
		return
	}
	// only allow URLs from trusted domains
	if !validRequestUrlOrigins[u.Host] {
		http.Error(w, "Untrusted origin", http.StatusBadRequest)
		return
	}
	ctx := appengine.NewContext(r)
	client := urlfetch.Client(ctx)
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	req.Header.Add("User-Agent",
		"Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MTC19V) "+
			"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile "+
			"Safari/537.36 (compatible; validator.ampproject.org)")
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	if err != nil {
		http.Error(w, fmt.Sprintf("Problem formatting json (%v)",
			err.Error()),
			http.StatusInternalServerError)
	}
	w.Header().Set("Content-type", "application/json")
	w.Write(data)
}
