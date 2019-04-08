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
	"log"
	"net/http"
	"strings"
)

const HOST = "https://ampbyexample.com"

type Redirect struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

func InitRedirects() {
	redirects, err := parseRedirects("backend/redirects-amp.dev.json")
	if err != nil {
		panic(err)
	}

	log.Printf("Setting up redirects")
	for _, redirect := range redirects {
		source := redirect.Source
		target := redirect.Target
		if !strings.HasPrefix(target, "http") {
			target = HOST + target
		}

		//log.Printf("Redirect %s -> %s", source, target)
		http.Handle(source, http.RedirectHandler(target, 301))
	}
}

func parseRedirects(configPath string) ([]Redirect, error) {
	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		return nil, err
	}
	var redirects []Redirect
	err = json.Unmarshal(data, &redirects)
	if err != nil {
		return nil, err
	}
	return redirects, nil
}
