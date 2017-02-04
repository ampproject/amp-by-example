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


// Provide a simple JSON response with a noticeable delay
package backend

import (
	"net/http"
	"time"
)

const (
	SLOW_RESPONSE_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/slow-response/"
)

func InitSlowResponseSample() {
	http.HandleFunc(SLOW_RESPONSE_SAMPLE_PATH +"rates", roomRates)
}

func roomRates(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := "{\"items\":[{\"title\": \"This response was delayed. Reload the page if you didn't see the spinner.\"}]}"
	duration := time.Duration(10)*time.Second
	time.Sleep(duration)
	w.Write([]byte(response))
}
