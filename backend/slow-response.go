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
	"io/ioutil"
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
	http.HandleFunc(SLOW_JSON_SAMPLE_PATH+"", slowJson)
	http.HandleFunc(SLOW_JSON_WITH_ITEMS_SAMPLE_PATH+"", slowJsonWithItems)
	http.HandleFunc(SLOW_IFRAME_SAMPLE_PATH+"", slowIframe)
}

func prepResponse(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	addDelay(r)
}

func createResponse(responseContent string, r *http.Request) string {
	return fmt.Sprintf(responseContent, getDelay(r))
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
	prepResponse(w, r)
	responseContent := "{\"items\":[{\"title\": \"This JSON response was delayed %v milliseconds. Hard-refresh the page (Ctrl/Cmd+Shift+R) if you didn't see the spinner.\"}]}"
	response := fmt.Sprintf(createResponse(responseContent, r))
	w.Write([]byte(response))
}

func slowJsonWithItems(w http.ResponseWriter, r *http.Request) {
	products := readProducts(DIST_FOLDER + "/json/examples.json")
	prepResponse(w, r)
	w.Write([]byte(products))
}

func readProducts(path string) string {
	productsFile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return string(productsFile)
}

func slowIframe(w http.ResponseWriter, r *http.Request) {
	prepResponse(w, r)
	responseContent := "This iframe was delayed %v milliseconds. Hard-refresh the page (Ctrl/Cmd+Shift+R) if you didn't see the spinner."
	response := fmt.Sprintf(createResponse(responseContent, r))
	w.Write([]byte(response))
}
