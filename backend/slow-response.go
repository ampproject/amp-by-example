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
	SLOW_RESPONSE_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/slow-response/"
)

func InitSlowResponseSample() {
	http.HandleFunc(SLOW_RESPONSE_SAMPLE_PATH+"", sleep)
}

func sleep(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	delay, _ := strconv.ParseUint(r.URL.Query().Get("delay"), 0, 64)
	response := fmt.Sprintf("{\"items\":[{\"title\": \"This response was delayed %v milliseconds. Reload the page if you didn't see the spinner.\"}]}", delay)
	duration := time.Duration(delay) * time.Millisecond
	time.Sleep(duration)
	w.Write([]byte(response))
}
