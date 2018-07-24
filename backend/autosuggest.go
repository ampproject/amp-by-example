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
	"strings"
)

const (
	AUTOSUGGEST_SAMPLE_PATH = "/" + CATEGORY_ADVANCED + "/autosuggest/"
)

func InitAutosuggestSample() {
	US_CAPITAL_CITIES := []string{
		"Montgomery, Alabama",
		"Juneau, Alaska",
		"Phoenix, Arizona",
		"Little Rock, Arkansas",
		"Sacramento, California",
		"Denver, Colorado",
		"Hartford, Connecticut",
		"Dover, Delaware",
		"Tallahassee, Florida",
		"Atlanta, Georgia",
		"Honolulu, Hawaii",
		"Boise, Idaho",
		"Springfield, Illinois",
		"Indianapolis, Indiana",
		"Des Moines, Iowa",
		"Topeka, Kansas",
		"Frankfort, Kentucky",
		"Baton Rouge, Louisiana",
		"Augusta, Maine",
		"Annapolis, Maryland",
		"Boston, Massachusetts",
		"Lansing, Michigan",
		"Saint Paul, Minnesota",
		"Jackson, Mississippi",
		"Jefferson City, Missouri",
		"Helena, Montana",
		"Lincoln, Nebraska",
		"Carson City, Nevada",
		"Concord, New Hampshire",
		"Trenton, New Jersey",
		"Santa Fe, New Mexico",
		"Albany, New York",
		"Raleigh, North Carolina",
		"Bismarck, North Dakota",
		"Columbus, Ohio",
		"Oklahoma City, Oklahoma",
		"Salem, Oregon",
		"Harrisburg, Pennsylvania",
		"Providence, Rhode Island",
		"Columbia, South Carolina",
		"Pierre, South Dakota",
		"Nashville, Tennessee",
		"Austin, Texas",
		"Salt Lake City, Utah",
		"Montpelier, Vermont",
		"Richmond, Virginia",
		"Olympia, Washington",
		"Charleston, West Virginia",
		"Madison, Wisconsin",
		"Cheyenne, Wyoming",
	}

	RegisterHandler(AUTOSUGGEST_SAMPLE_PATH+"search_list", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")

		filteredStrs := Filter(US_CAPITAL_CITIES, func(v string) bool {
			return CaseInsensitiveContains(v, query)
		})

		if len(filteredStrs) > 0 {
			results := Min(len(filteredStrs), 4)
			SendAmpListItems(w, map[string]interface{}{
				"query":   query,
				"results": filteredStrs[:results],
			})
		} else {
			SendAmpListItems(w, map[string]interface{}{
				"query": query,
			})
		}
	})

	RegisterHandler(AUTOSUGGEST_SAMPLE_PATH+"address", func(w http.ResponseWriter, r *http.Request) {
		city := r.FormValue("city")

		for i := range US_CAPITAL_CITIES {
			if US_CAPITAL_CITIES[i] == city {
				SendAmpListItems(w, map[string]interface{}{
					"result": fmt.Sprintf("Success! Your package is on it's way to %s.", city),
				})
				return
			}
		}

		SendJsonError(w, http.StatusBadRequest, map[string]interface{}{
			"result": fmt.Sprintf("Sorry! We don't ship to %s.", city),
		})
	})
}

func Filter(vs []string, f func(string) bool) []string {
	vsf := make([]string, 0)
	for _, v := range vs {
		if f(v) {
			vsf = append(vsf, v)
		}
	}
	return vsf
}

func CaseInsensitiveContains(s, substr string) bool {
	s, substr = strings.ToUpper(s), strings.ToUpper(substr)
	return strings.Contains(s, substr)
}

func Min(x, y int) int {
	if x < y {
		return x
	}
	return y
}
