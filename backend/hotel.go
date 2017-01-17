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
	"net/http"
)

type HotelAuthorizationResponse struct {
	User       string `json:"username"`
	Status     string `json:"status"`
	Freenights int    `json:"freenights"`
}

const (
	HOTEL_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/hotel/"
)

func InitHotelSample() {
	http.HandleFunc(HOTEL_SAMPLE_PATH+"authorization", handleHotelAuthorization)
	http.HandleFunc(HOTEL_SAMPLE_PATH+"pingback", handlePingback)
	http.HandleFunc(HOTEL_SAMPLE_PATH+"login", handleLogin)
	http.HandleFunc(HOTEL_SAMPLE_PATH+"book", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, book)
	})
	http.HandleFunc(HOTEL_SAMPLE_PATH+"check-available", checkAvailability)
}

func (h HotelAuthorizationResponse) CreateAuthorizationResponse() AuthorizationResponse {
	return HotelAuthorizationResponse{"test-user", "Gold", 2}
}

func handleHotelAuthorization(w http.ResponseWriter, r *http.Request) {
	handleAuthorization(w, r, new(HotelAuthorizationResponse).CreateAuthorizationResponse())
}

func checkAvailability(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := "{\"result\":\"Available\"}"
	w.Write([]byte(response))
}

func book(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := "{\"result\":\"OK\"}"
	w.Write([]byte(response))
}
