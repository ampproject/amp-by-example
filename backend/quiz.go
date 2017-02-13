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
	"net/http"
  "strconv"
  "golang.org/x/net/context"
  "google.golang.org/appengine"
)

const (
	QUIZ_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/quiz/"
)

//holds the questions
type QuizQuestions struct {
	Questions []string
}

//holds the answer chosen by the user used for storing data coming from the UI
type QuizForm struct {
	Answer   int
}

//holds the quiz results and a message, used for displaying
type QuizResult struct {
	QuizEntryResults []QuizEntryResult
	Message          string
}

//holds an answers and a percentage of right answers represented as an array, used for displaying
type QuizEntryResult struct {
	Votes      int
	Percentage []int
	Answer     string
}

var quizQuestions QuizQuestions

func InitQuizForm() {
  questions = []string{"2+2", "4/0", "8*2", "3-1"}
  quizQuestions = QuizQuestions{questions}
  http.HandleFunc(QUIZ_SAMPLE_PATH+"submit", submitQuiz)
  RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/quiz", handleQuiz)
}

func handleQuiz(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, quizQuestions)
}

func submitQuiz(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	context := appengine.NewContext(r)
	quizForm, error := parseQuizForm(w, r, context)
	if error != nil {
		handleError(error, w)
		return
	}
	quizResult, error := calculateQuizResults(w, r, context, quizForm)
	if error != nil {
		handleError(error, w)
		return
	}
	json.NewEncoder(w).Encode(quizResult)
}

func parseQuizForm(w http.ResponseWriter, r *http.Request, context context.Context) (QuizForm, error) {
	answer, _ := parseNotEmptyFormValue(r, "expression1")
	answerNumber, _ := strconv.Atoi(answer)

	quizForm := QuizForm{answerNumber}
	return quizForm, nil
}

func calculateQuizResults(w http.ResponseWriter, r *http.Request, ctx context.Context, quizForm QuizForm) (QuizResult, error) {

  quizEntryResult := QuizEntryResult{1, make([]int, 1), ""}
  quizEntryResults := make([]QuizEntryResult, 1)
  quizEntryResults[0] = quizEntryResult
	return QuizResult{quizEntryResults, ""}, nil
}
