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
	"errors"
	"fmt"
	"golang.org/x/net/context"
	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"net/http"
)

const (
	ERROR_CASE_POLL  = "error"
	POLL_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/poll/"
	POLL_ANSWER      = "PollAnswer"
)

//holds the answer chosen by the user and the client id, used for storing data coming from the UI
type PollForm struct {
	ClientId string
	Answer   string
}

//holds an answers and votes represented as an array, used for displaying
type PollEntryResult struct {
	Percentage []int
	Answer     string
}

//holds the poll results and a message, used for displaying
type PollResult struct {
	PollResults []PollEntryResult
	Message     string
}

//holds an answer and votes, used for storing
type PollAnswer struct {
	Answer string
	Votes  int
}

//holds the questions
type PollQuestions struct {
	Questions  map[string]string
}

//holds stored data
type Poll struct {
	ClientIds   []string
	PollAnswers []PollAnswer
}

var questions map[string]string

func InitPollSample() {
	questions = make(map[string]string)
	questions["question1"] = "Penguins"
	questions["question2"] = "Ostriches"
	questions["question3"] = "Kiwis"
	questions["question4"] = "Wekas"
	http.HandleFunc(POLL_SAMPLE_PATH+"submit", submitPoll)
	RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/poll", handlePoll)
}

func handlePoll(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, PollQuestions{questions})
}

func createPollResult(answers []PollAnswer, message string) PollResult {
	results := make([]PollEntryResult, 0)
	for _, value := range answers {
		results = append(results, PollEntryResult{make([]int, value.Votes), questions[value.Answer]})
	}
	return PollResult{results, message}
}

func calculatePollResults(w http.ResponseWriter, ctx context.Context, pollForm PollForm) (PollResult, error) {
	var message string
	clientId := pollForm.ClientId

	//get the poll
	pollKey := datastore.NewKey(ctx, "Poll", "poll", 0, nil)
	var poll Poll
	err := datastore.Get(ctx, pollKey, &poll)

	if err != nil {
		return PollResult{}, err
	}

	//check if the user has already voted
	existingClientIds := poll.ClientIds
	for i := 0; i < len(existingClientIds); i++ {
		if existingClientIds[i] == clientId {
			//return a message to let the user know that has already voted
			message = "You have already answered this poll. If you want to run this sample again, use an incognito window."
			//return the existing poll answers and a message
			return createPollResult(poll.PollAnswers, message), nil
		}
	}

	//if the user hasn't already voted, return a welcome message
	message = "Thanks for answering the poll!"
	//add the clientId
	poll.ClientIds = append(existingClientIds, clientId)

	pollExistingAnswers := poll.PollAnswers
	//get the lastest vote count for the answer
	answerFound := false
	for i := 0; i < len(pollExistingAnswers); i++ {
		if pollExistingAnswers[i].Answer == pollForm.Answer {
			//increment the vote for the answer
			pollExistingAnswers[i].Votes = pollExistingAnswers[i].Votes + 1
			answerFound = true
		}
	}
	if !answerFound {
		pollExistingAnswers = append(pollExistingAnswers, PollAnswer{pollForm.Answer, 1})
		poll.PollAnswers = pollExistingAnswers
	}

	//persist the answer
	_, err = datastore.Put(ctx, pollKey, &poll)

	if err != nil {
		return PollResult{}, err
	}
	return createPollResult(pollExistingAnswers, message), nil
}

func parsePollForm(w http.ResponseWriter, r *http.Request, context context.Context) (PollForm, error) {
	answer, answerErr := parseNotEmptyFormValue(r, "answer")
	clientId, clientIdErr := parseNotEmptyFormValue(r, "clientId")

	pollForm := PollForm{clientId, answer}

	error := parseFormErrors([]error{answerErr, clientIdErr})
	if error != nil {
		return pollForm, error
	}
	return pollForm, nil
}

func parseNotEmptyFormValue(r *http.Request, input string) (string, error) {
	value := r.FormValue(input)
	if value == "" {
		return "", errors.New(input + "has empty value")
	}
	return value, nil
}

func submitPoll(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	context := appengine.NewContext(r)
	pollForm, error := parsePollForm(w, r, context)

	if error != nil {
		handleError(error, w)
	}
	pollResult, error := calculatePollResults(w, context, pollForm)
	if error != nil {
		handleError(error, w)
	}
	json.NewEncoder(w).Encode(pollResult)
}

func handleError(error error, w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	response := fmt.Sprintf("{\"err\":\"%s\"}", error)
	w.Write([]byte(response))
}
