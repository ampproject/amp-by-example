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
	"math/rand"
	"net/http"
	"path"
)

const NUMBER_OF_CONFIGS = 5

func InitAmpStoryAutoAds() {
	RegisterHandler("/json/amp-story-auto-ads/", serveRandomAdConfig)
}

func getConfigNumber() int {
	return rand.Intn(NUMBER_OF_CONFIGS)
}

func serveRandomAdConfig(w http.ResponseWriter, r *http.Request) {
	configNumber := getConfigNumber()
	configName := fmt.Sprintf("amp-story-auto-ads-%v.json", configNumber)
	filePath := path.Join(DIST_FOLDER, "json", configName)

	SendJsonFile(w, filePath)
}
