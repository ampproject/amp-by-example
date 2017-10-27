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
	"net/http"
	"strconv"
	"time"
)

const (
	AMP_FAVORITE_COOKIE = "amp_favorite_sample"
)

func InitFavoriteSample() {
	http.HandleFunc("/favorite", handleFavorite)
}

func handleFavorite(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	w.Header().Set("Cache-Control", "max-age=0")
	if r.Method == "POST" {
		setFavorite(w, r)
	} else if r.Method == "GET" {
		getFavorite(w, r)
	}
}

func getFavorite(w http.ResponseWriter, r *http.Request) {
	favorite := readFavoriteFromCookie(r)
	writeFavorite(w, favorite)
}

func setFavorite(w http.ResponseWriter, r *http.Request) {
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	favorite := !readFavoriteFromCookie(r)
	cookie := &http.Cookie{
		Name:    AMP_FAVORITE_COOKIE,
		Expires: expireInOneDay,
		Path:    "/",
		Value:   strconv.FormatBool(favorite),
		MaxAge:  36000,
	}
	http.SetCookie(w, cookie)
	writeFavorite(w, favorite)
}

func writeFavorite(w http.ResponseWriter, favorite bool) {
	response := fmt.Sprintf("%t", favorite)
	w.Write([]byte(response))
}

func readFavoriteFromCookie(r *http.Request) bool {
	cookie, err := r.Cookie(AMP_FAVORITE_COOKIE)
	if err != nil {
		return false
	}
	favorite, err := strconv.ParseBool(cookie.Value)
	if err != nil {
		return false
	}
	return favorite
}
