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

// Provide a simple JSON response with a customizable delay
package backend

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
)

const (
	SLOW_JSON_SAMPLE_PATH            = "/" + CATEGORY_SAMPLE_TEMPLATES + "/slow-json/"
	SLOW_JSON_WITH_ITEMS_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/slow-json-with-items/"
	SLOW_IFRAME_SAMPLE_PATH          = "/" + CATEGORY_SAMPLE_TEMPLATES + "/slow-iframe/"
)

func InitSlowResponseSample() {
	RegisterHandler(SLOW_JSON_SAMPLE_PATH+"", slowJson)
	RegisterHandler(SLOW_JSON_WITH_ITEMS_SAMPLE_PATH+"", slowJsonWithItems)
	RegisterHandler(SLOW_IFRAME_SAMPLE_PATH+"", slowIframe)
}

func addDelay(r *http.Request) {
	delay := getDelay(r)
	duration := time.Duration(delay) * time.Millisecond
	time.Sleep(duration)
}

func getDelay(r *http.Request) uint64 {
	delay, _ := strconv.ParseUint(r.URL.Query().Get("delay"), 0, 64)
	return delay
}

func slowJson(w http.ResponseWriter, r *http.Request) {
	addDelay(r)
	SendAmpListItems(w, map[string]string{
		"title": fmt.Sprintf("This JSON response was delayed %v milliseconds. Hard-refresh the page (Ctrl/Cmd+Shift+R) if you didn't see the spinner.", getDelay(r)),
	})
}

func slowJsonWithItems(w http.ResponseWriter, r *http.Request) {
	addDelay(r)
	SendJsonFile(w, DIST_FOLDER+"/json/related_products.json")
}

func slowIframe(w http.ResponseWriter, r *http.Request) {
	addDelay(r)
	fmt.Fprintf(w, "This iframe was delayed %v milliseconds. Hard-refresh the page (Ctrl/Cmd+Shift+R) if you didn't see the spinner.", getDelay(r))
}
