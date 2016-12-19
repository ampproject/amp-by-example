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
	"strconv"
)

const (
	ERROR_CASE_POLL  = "error"
	POLL_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/poll/"
	POLL_ANSWER      = "PollAnswer"
)

//holds the answer chosen by the user and the client id, used for storing data coming from the UI
type PollForm struct {
	ClientId string
	Answer   int
}

//holds an answers and votes represented as an array, used for displaying
type PollEntryResult struct {
	Percentage []int
	Answer     string
}

//holds the poll results and a message, used for displaying
type PollResult struct {
	PollEntryResults []PollEntryResult
	Message          string
}

//holds an answer and votes, used for storing
type PollAnswer struct {
	Answer int
	Votes  int
}

//holds the questions
type PollQuestions struct {
	Questions []string
}

//holds stored Poll
type Poll struct {
	ClientIds   []string
	PollAnswers []PollAnswer
}

var questions []string
var pollQuestions PollQuestions

func InitPollSample() {
	questions = []string{"Penguins", "Ostriches", "Kiwis", "Wekas"}
	pollQuestions = PollQuestions{questions}
	http.HandleFunc(POLL_SAMPLE_PATH+"submit", submitPoll)
	RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/poll", handlePoll)
}

func handlePoll(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, pollQuestions)
}

func createPollResult(answers []PollAnswer, message string) PollResult {
	results := make([]PollEntryResult, 0)
	for _, value := range answers {
		results = append(results, PollEntryResult{make([]int, value.Votes), questions[value.Answer]})
	}
	return PollResult{results, message}
}

func submitPoll(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	context := appengine.NewContext(r)
	pollForm, error := parsePollForm(w, r, context)
	if error != nil {
		handleError(error, w)
		return
	}
	pollResult, error := calculatePollResults(w, context, pollForm)
	if error != nil {
		handleError(error, w)
		return
	}
	json.NewEncoder(w).Encode(pollResult)
}

func parsePollForm(w http.ResponseWriter, r *http.Request, context context.Context) (PollForm, error) {
	answer, answerErr := parseNotEmptyFormValue(r, "answer")
	answerId, _ := strconv.Atoi(answer)
	clientId, clientIdErr := parseNotEmptyFormValue(r, "clientId")

	pollForm := PollForm{clientId, answerId}

	error := parseFormErrors([]error{answerErr, clientIdErr})
	return pollForm, error
}

func calculatePollResults(w http.ResponseWriter, ctx context.Context, pollForm PollForm) (PollResult, error) {
	var message string
	clientId := pollForm.ClientId

	//get the poll
	pollKey := datastore.NewKey(ctx, "Poll", "poll", 0, nil)
	var poll Poll
	//if it's the first time executing, there will be no poll yet
	datastore.Get(ctx, pollKey, &poll)

	//check if the user has already voted
	existingClientIds := poll.ClientIds
	for _, existingClientId := range existingClientIds {
		if existingClientId == clientId {
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
	for _, pollExistingAnswer := range pollExistingAnswers {
		if pollExistingAnswer.Answer == pollForm.Answer {
			//increment the vote for the answer
			pollExistingAnswer.Votes = pollExistingAnswer.Votes + 1
			answerFound = true
		}
	}
	if !answerFound {
		pollExistingAnswers = append(pollExistingAnswers, PollAnswer{pollForm.Answer, 1})
		poll.PollAnswers = pollExistingAnswers
	}
	//persist the answer
	_, err := datastore.Put(ctx, pollKey, &poll)

	if err != nil {
		return PollResult{}, err
	}
	return createPollResult(pollExistingAnswers, message), nil
}

func parseNotEmptyFormValue(r *http.Request, input string) (string, error) {
	value := r.FormValue(input)
	if value == "" {
		return "", errors.New(input + "has empty value")
	}
	return value, nil
}

func handleError(error error, w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	response := fmt.Sprintf("{\"err\":\"%s\"}", error)
	w.Write([]byte(response))
}
