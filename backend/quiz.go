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
)

const (
	QUIZ_SAMPLE_NAME = "/" + CATEGORY_SAMPLE_TEMPLATES + "/quiz/"
)

var rightAnswers []int

func InitQuiz() {
	rightAnswers = make([]int, 0)
	rightAnswers = append(rightAnswers, 4, 2, 16, 1)
	http.HandleFunc(QUIZ_SAMPLE_NAME+"submit", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitQuiz)
	})

}

func submitQuiz(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := ""
	answer1, _ := strconv.Atoi(r.FormValue("expression1"))
	answer2, _ := strconv.Atoi(r.FormValue("expression2"))
	answer3, _ := strconv.Atoi(r.FormValue("expression3"))
	answer4, _ := strconv.Atoi(r.FormValue("expression4"))
	quizAnswers := []int{answer1, answer2, answer3, answer4}
	for i := 0; i < len(quizAnswers); i++ {
		if rightAnswers[i] != quizAnswers[i] {
			w.WriteHeader(http.StatusBadRequest)
		}
	}
	response = fmt.Sprintf("{\"result\":\"ok\"}")
	w.Write([]byte(response))
}
