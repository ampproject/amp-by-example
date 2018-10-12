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
	"encoding/json"
	"io/ioutil"
	"net/http"
)

const HOST = "https://ampbyexample.com"

func InitRedirects() {
	redirects, err := parseRedirects("backend/redirects.json")
	if err != nil {
		panic(err)
	}

	for source, target := range redirects {
		http.Handle(source, http.RedirectHandler(HOST+target, 301))
	}
}

func parseRedirects(configPath string) (map[string]string, error) {
	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		return nil, err
	}
	var redirects map[string]string
	err = json.Unmarshal(data, &redirects)
	if err != nil {
		return nil, err
	}
	return redirects, nil
}
