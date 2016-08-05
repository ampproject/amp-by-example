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
	"bytes"
	"strings"
	"net/http"
)

func buildSourceOrigin(host string) string {
	var sourceOrigin bytes.Buffer
	if strings.HasPrefix(host, "localhost") {
		sourceOrigin.WriteString("http://")
	} else {
		sourceOrigin.WriteString("https://")
	}
	sourceOrigin.WriteString(host)
	return sourceOrigin.String()
}

func isFormPostRequest(method string, w http.ResponseWriter,) bool {
	if method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return false
	}
	return true
}

func handlePost(w http.ResponseWriter, r *http.Request, postHandler func(http.ResponseWriter, *http.Request)) {
    if r.Method != "POST" {
    http.Error(w, "post only", http.StatusMethodNotAllowed)
    return;
   }
  postHandler(w, r)
}
