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
	"html/template"
	"math/rand"
	"net/http"
	"path"
	"time"
)

const (
	AMP_CLIENT_ID_COOKIE = "AMP_ECID_GOOGLE"
	SAMPLE_FOLDER        = "/components/amp-analytics/"
)

var sampleTemplate *template.Template

func InitAmpAnalytics() {
	rand.Seed(time.Now().UTC().UnixNano())
	sampleFile := path.Join(DIST_FOLDER, SAMPLE_FOLDER, "index.html")
	var err error
	sampleTemplate, err = template.ParseFiles(sampleFile)
	if err != nil {
		panic(err)
	}
	http.HandleFunc(SAMPLE_FOLDER, renderAnalyticsSample)
}

func renderAnalyticsSample(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("cache-control", fmt.Sprintf("max-age=%d, public, must-revalidate", 60))
	sampleTemplate.Execute(w, clientId(r))
}

func clientId(r *http.Request) string {
	cookie, err := r.Cookie(AMP_CLIENT_ID_COOKIE)
	if err != nil {
		return RandomString(8)
	} else {
		return cookie.Value
	}
}

func RandomString(strlen int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, strlen)
	for i := 0; i < strlen; i++ {
		result[i] = chars[rand.Intn(len(chars))]
	}
	return string(result)
}
