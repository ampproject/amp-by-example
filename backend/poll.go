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
)

type PollForm struct {
	ClientId string
	Answer   string
}

type Result struct {
	Percentage []int
	Answer     string
}

type Answer struct {
	AnswerText string
	Votes      int
}

func InitPollSample() {
	http.HandleFunc(POLL_SAMPLE_PATH+"submit-xhr", submitXHR)
}

func getAnswersFromDatastore(context context.Context) ([]Answer, error) {
	query := datastore.NewQuery("Answer")
	answers := make([]Answer, 0, 4)
	if _, err := query.GetAll(context, &answers); err != nil {
		return answers, err
	}
	return answers, nil
}

func saveAnswerIntoDatastore(context context.Context, answerText string, voteCount int) error {
	answer := &Answer{
		AnswerText: answerText,
		Votes:      voteCount,
	}
	answerKey := datastore.NewKey(context, "Answer", answerText, 0, nil)
	_, error := datastore.Put(context, answerKey, answer)
	if error != nil {
		return error
	}
	return nil
}

func updateAnswerCount(answers []Answer, answerText string) int {
	voteCount := 1
	found := false
	for i := 0; i < len(answers); i++ {
		if answers[i].AnswerText == answerText {
			voteCount = answers[i].Votes + 1
			answers[i].Votes = voteCount
			found = true
			break
		}
	}
	if !found {
		answers = append(answers, Answer{
			AnswerText: answerText,
			Votes:      voteCount,
		})
	}
	return voteCount
}

func calculatePollResults(w http.ResponseWriter, ctx context.Context, pollForm PollForm) ([]Result, error) {
	var results []Result
	err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
		//create keys
		clientIdKey := datastore.NewKey(ctx, "PollForm", pollForm.ClientId, 0, nil)
		answerKey := datastore.NewKey(ctx, "Answer", pollForm.Answer, 0, nil)
		//check if the user has already answered
		var existingPollForm PollForm
		err := datastore.Get(ctx, clientIdKey, &existingPollForm)
		//error is nil if the user has answered
		if err == nil {
			//decrement the vote for the existing answer
			var answer Answer
			existingPollFormKey := datastore.NewKey(ctx, "Answer", existingPollForm.Answer, 0, nil)
			err = datastore.Get(ctx, existingPollFormKey, &answer)
			//decrement the vote for the answer
			answer.Votes--
			//update the existing answer
			_, err = datastore.Put(ctx, existingPollFormKey, &answer)
		}
		//persist association between clientId and answer
		_, err = datastore.Put(ctx, clientIdKey, &pollForm)
		//get the lastest vote count for the answer
		var answer Answer
		err = datastore.Get(ctx, answerKey, &answer)
		answer.AnswerText = pollForm.Answer
		//increment the vote for the answer
		answer.Votes++
		//persist the answer
		_, err = datastore.Put(ctx, answerKey, &answer)
		return err
	}, &datastore.TransactionOptions{XG: true})
	if err != nil {
		http.Error(w, err.Error(), 500)
		return results, err
	}

	answers, error := getAnswersFromDatastore(ctx)
	if error != nil {
		return results, error
	}
	for _, value := range answers {
		results = append(results, Result{Answer: value.AnswerText, Percentage: make([]int, value.Votes)})
	}
	return results, nil
}

func parsePollForm(w http.ResponseWriter, r *http.Request, context context.Context) (PollForm, error) {
	answerText, answerErr := parseNotEmptyFormValue(r, "answer")
	clientId, clientIdErr := parseNotEmptyFormValue(r, "clientId")

	pollForm := PollForm{clientId, answerText}

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

func submitXHR(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := ""
	context := appengine.NewContext(r)
	pollForm, error := parsePollForm(w, r, context)

	if error != nil {
		handleError(error, w)
	}
	result, error := calculatePollResults(w, context, pollForm)
	if error != nil {
		handleError(error, w)
	}
	pollResult, _ := json.Marshal(result)
	response = fmt.Sprintf("{\"result\":%s}", pollResult)
	w.Write([]byte(response))
}

func handleError(error error, w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	response := fmt.Sprintf("{\"err\":\"%s\"}", error)
	w.Write([]byte(response))
}
