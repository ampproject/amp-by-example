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
	"strconv"
	"time"
)

const (
	AMP_FAVORITE_COOKIE       = "amp-favorite"
	AMP_FAVORITE_COUNT_COOKIE = "amp-favorite-with-count"
)

func InitFavoriteSample() {
	RegisterHandler("/favorite", handleFavorite)
	RegisterHandler("/favorite-with-count", handleFavoriteWithCount)
}

func handleFavorite(w http.ResponseWriter, r *http.Request) {
	SetMaxAge(w, 0)
	if r.Method == "POST" {
		setFavorite(w, r)
	} else if r.Method == "GET" {
		getFavorite(w, r)
	}
}

func getFavorite(w http.ResponseWriter, r *http.Request) {
	favorite := readFavoriteFromCookie(r, AMP_FAVORITE_COOKIE)
	SendJsonResponse(w, favorite)
}

func setFavorite(w http.ResponseWriter, r *http.Request) {
	favorite := !readFavoriteFromCookie(r, AMP_FAVORITE_COOKIE)
	writeFavoriteCookie(w, r, AMP_FAVORITE_COOKIE, favorite)
	SendJsonResponse(w, favorite)
}

func handleFavoriteWithCount(w http.ResponseWriter, r *http.Request) {
	SetMaxAge(w, 0)
	if r.Method == "POST" {
		setFavoriteWithCount(w, r)
	} else if r.Method == "GET" {
		getFavoriteWithCount(w, r)
	}
}

func getFavoriteWithCount(w http.ResponseWriter, r *http.Request) {
	favorite := readFavoriteFromCookie(r, AMP_FAVORITE_COUNT_COOKIE)
	writeFavoriteWithCount(w, favorite)
}

func setFavoriteWithCount(w http.ResponseWriter, r *http.Request) {
	favorite := !readFavoriteFromCookie(r, AMP_FAVORITE_COUNT_COOKIE)
	writeFavoriteCookie(w, r, AMP_FAVORITE_COUNT_COOKIE, favorite)
	writeFavoriteWithCount(w, favorite)
}

func writeFavoriteWithCount(w http.ResponseWriter, favorite bool) {
	var count int
	if favorite {
		count = 124
	} else {
		count = 123
	}
	SendJsonResponse(w, map[string]interface{}{
		"value": favorite,
		"count": count,
	})
}

func writeFavoriteCookie(w http.ResponseWriter, r *http.Request, name string, value bool) {
	expireInOneYear := time.Now().AddDate(1, 0, 0)
	cookie := &http.Cookie{
		Name:    name,
		Expires: expireInOneYear,
		Value:   strconv.FormatBool(value),
	}
	http.SetCookie(w, cookie)
}

func readFavoriteFromCookie(r *http.Request, name string) bool {
	cookie, err := r.Cookie(name)
	if err != nil {
		return false
	}
	favorite, err := strconv.ParseBool(cookie.Value)
	if err != nil {
		return false
	}
	return favorite
}
