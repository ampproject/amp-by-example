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

package main

import (
	"backend"
	"net/http"
	"playground"
)

func init() {
	backend.InitRedirects()
	backend.InitAmpLiveList()
	backend.InitAmpEmail()
	backend.InitAmpForm()
	backend.InitAmpCache()
	backend.InitProductBrowse()
	backend.InitHousingForm()
	backend.InitAmpAnalytics()
	backend.InitCommentSection()
	backend.InitHotelSample()
	backend.InitSlowResponseSample()
	backend.InitPollSample()
	backend.InitRatingSample()
	backend.InitAutosuggestSample()
	backend.InitPagedListSample()
	backend.InitAmpAccess()
	backend.InitFavoriteSample()
	backend.InitCheckout()
	backend.InitAmpConsent()
	backend.InitAmpStoryAutoAds()
	backend.InitLetsEncrypt()
	backend.InitSeatmapPage()
	playground.InitPlayground()
	backend.InitStatic()
	http.HandleFunc("/_ah/warmup", warmup)
}

func warmup(w http.ResponseWriter, r *http.Request) {
	playground.InitializeComponents(r)
	w.Write([]byte("Warmup request"))
}
