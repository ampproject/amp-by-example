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
	POLL_ANSWER = "PollAnswer"
)

type PollForm struct {
	ClientId string
	Answer   string
}

type PollResult struct {
	Percentage []int
	Answer     string
}
type PollResultNew struct {
	PollResults []PollResult
	Message			string
}
type PollAnswer struct {
	Answer string
	Votes      int
}

type PollSample struct {
	Questions     []string
}

type User struct {
	ClientId string
}

var questions []string

func InitPollSample() {
	questions = []string{"Penguins", "Ostriches", "Kiwis", "Wekas"}
	http.HandleFunc(POLL_SAMPLE_PATH+"submit", submitPoll)
	RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/poll", handlePoll)
}

func handlePoll(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, PollSample{questions})
}

func getAnswersFromDatastore(context context.Context) ([]PollAnswer, error) {
	query := datastore.NewQuery(POLL_ANSWER)
	answers := make([]PollAnswer, 0, len(questions))
	if _, err := query.GetAll(context, &answers); err != nil {
		return nil, err
	}
	return answers, nil
}

func saveAnswerIntoDatastore(context context.Context, answer string, voteCount int) error {
	pollAnswer := &PollAnswer{
		Answer: answer,
		Votes:      voteCount,
	}
	answerKey := datastore.NewKey(context, POLL_ANSWER, answer, 0, nil)
	_, error := datastore.Put(context, answerKey, pollAnswer)
	return error
}

func updateAnswerCount(answers []PollAnswer, answer string) int {
	voteCount := 1
	found := false
	for i := 0; i < len(answers); i++ {
		if answers[i].Answer == answer {
			voteCount = answers[i].Votes + 1
			answers[i].Votes = voteCount
			found = true
			break
		}
	}
	if !found {
		answers = append(answers, PollAnswer{
			Answer: answer,
			Votes:      voteCount,
		})
	}
	return voteCount
}

func calculatePollResults(w http.ResponseWriter, ctx context.Context, pollForm PollForm) (PollResultNew, error) {
	var results []PollResult
	var message string
	clientId := pollForm.ClientId
	user := User{clientId}
	err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
		//create keys
		answerKey := datastore.NewKey(ctx, POLL_ANSWER, pollForm.Answer, 0, nil)
		//check if the user has already answered
		var users []User
		var query = datastore.NewQuery("User").Filter("ClientId = ", clientId)
		_, err := query.GetAll(ctx, &users)
		panic(err)
		//error is nil if the user has answered
		if err == nil {
			//return an error to let the user know that has already voted
			message = "You have already answered this poll. If you want to run this sample again, use an incognito window."
		} else {
			message = "Thanks for answering the poll!"
			//persist the clientId and answer
			userKey := datastore.NewIncompleteKey(ctx, "User", nil)
			_, err = datastore.Put(ctx, userKey, &user)
		}
		//get the lastest vote count for the answer
		var answer PollAnswer
		err = datastore.Get(ctx, answerKey, &answer)
		answer.Answer = pollForm.Answer
		//increment the vote for the answer
		answer.Votes++
		//persist the answer
		_, err = datastore.Put(ctx, answerKey, &answer)
		return err
	}, &datastore.TransactionOptions{XG: true})
	if err != nil {
		return PollResultNew{}, err
	}

	answers, error := getAnswersFromDatastore(ctx)
	if error != nil {
		return PollResultNew{results, message}, error
	}
	for _, value := range answers {
		results = append(results, PollResult{make([]int, value.Votes), value.Answer})
	}
	return PollResultNew{results, message}, nil
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
	pollResultNew, error := calculatePollResults(w, context, pollForm)
	if error != nil {
		handleError(error, w)
	}
	json.NewEncoder(w).Encode(pollResultNew)
}

func handleError(error error, w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	response := fmt.Sprintf("{\"err\":\"%s\"}", error)
	w.Write([]byte(response))
}
