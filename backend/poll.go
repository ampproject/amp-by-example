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
	ERROR_CASE_POLL       = "error"
	POLL_SAMPLE_PATH      = "/" + CATEGORY_SAMPLE_TEMPLATES + "/poll/"
	POLL_ANSWER           = "PollAnswer"
	ALREADY_VOTED_MESSAGE = "You have already answered this poll. If you want to run this sample again, use an incognito window."
	THANKS_MESSAGE        = "Thanks for answering the poll!"
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

//holds stored Poll, PollAnswers is an array where index is the question and the value is the vote count
type Poll struct {
	PollAnswers []int
}

//holds a boolean value used for storing the ClientId
type ClientId struct {
	voted bool
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

func createPollResult(answers []int, message string) PollResult {
	results := make([]PollEntryResult, len(questions))
	for questionIndex, votes := range answers {
		results[questionIndex] = PollEntryResult{make([]int, votes), questions[questionIndex]}
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
	//get the poll
	pollKey := datastore.NewKey(ctx, "Poll", "poll", 0, nil)
	var poll Poll
	var pollExistingAnswers = make([]int, len(questions))
	err := datastore.Get(ctx, pollKey, &poll)
	//if there is an existing poll, get all the answers
	if err == nil && (len(poll.PollAnswers) == len(questions)) {
		pollExistingAnswers = poll.PollAnswers
	}
	//check if the user has already voted
	clientId := pollForm.ClientId
	clientIdKey := datastore.NewKey(ctx, "ClientId", clientId, 0, nil)
	var existingClientId ClientId
	err = datastore.Get(ctx, clientIdKey, &existingClientId)
	if err == nil {
		//return the existing poll answers and message to let the user know that has already voted
		return createPollResult(pollExistingAnswers, ALREADY_VOTED_MESSAGE), nil
	}

	//add the clientId
	answer := pollForm.Answer
	_, err = datastore.Put(ctx, clientIdKey, &ClientId{true})
	//increment the vote for the answer
	pollExistingAnswers[answer] = pollExistingAnswers[answer] + 1
	//persist the answer
	_, err = datastore.Put(ctx, pollKey, &Poll{pollExistingAnswers})

	if err != nil {
		return PollResult{}, err
	}
	return createPollResult(pollExistingAnswers, THANKS_MESSAGE), nil
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
