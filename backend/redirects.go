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
	"net/http"
	"os"
)

const HOST = "https://ampbyexample.com"

type Redirect struct {
	Source string
	Target string
}

func InitRedirects() {
	redirects, err := parseRedirects("backend/redirects.json")
	if err != nil {
		panic(err)
	}

	for _, redirect := range redirects {
		http.Handle(redirect.Source, http.RedirectHandler(HOST+redirect.Target, 301))
	}
}

func parseRedirects(configPath string) ([]Redirect, error) {
	file, err := os.Open(configPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var redirects []Redirect
	if err := json.NewDecoder(file).Decode(&redirects); err != nil {
		return nil, err
	}
	return redirects, nil
}
