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
	"io"
	"net/http"
	"strconv"
)

const (
	QUIZ_SAMPLE_NAME = "/" + CATEGORY_SAMPLE_TEMPLATES + "/quiz/"
)

var correctAnswers [4]int

func InitQuiz() {
	correctAnswers = [4]int{4, 2, 16, 1}
	http.HandleFunc(QUIZ_SAMPLE_NAME+"submit", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitQuiz)
	})

}

func submitQuiz(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	actualAnswers := [4]int{
		intValue("expression1", r),
		intValue("expression2", r),
		intValue("expression3", r),
		intValue("expression4", r),
	}
	if actualAnswers == correctAnswers {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
	io.WriteString(w, "{}")
}

func intValue(stringValue string, r *http.Request) int {
	intValue, _ := strconv.Atoi(r.FormValue(stringValue))
	return intValue
}
