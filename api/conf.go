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

package api

import (
	"encoding/json"
	"os"
)

type Config struct {
	UrlApiKey string `json:"url-api-key"`
}

// Returns the app config
func getConfig() Config {
	file, err := os.Open("conf.json")
	if err != nil {
		panic("Could not read config file " + err.Error())
	}
	decoder := json.NewDecoder(file)
	config := Config{}
	err = decoder.Decode(&config)
	if err != nil {
		panic("Could not read config" + config.UrlApiKey)
	}
	return config
}
