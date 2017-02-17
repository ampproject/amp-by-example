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
	//	"encoding/json"
	"fmt"
	//"golang.org/x/net/context"
	//"google.golang.org/appengine"
	"net/http"
	//"strconv"
)

const (
	ERROR_CASE_RATING     = "error"
	RATING_SAMPLE_PATH    = "/" + CATEGORY_SAMPLE_TEMPLATES + "/rating/"
	RATING_ANSWER         = "Average Rating: 4.5"
	ALREADY_RATED_MESSAGE = "You have already left a rating. If you want to run this sample again, use an incognito window."
	RATING_THANKS_MESSAGE = "Thanks for your rating!"
	RATING_COOKIE_NAME    = "RATING_USER_ID"
)

func InitRatingSample() {
	http.HandleFunc(RATING_SAMPLE_PATH+"submit", handleRating)
	//RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/rating", handleRating)
}

func handleRating(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	response := fmt.Sprintf("{\"items\":[{\"title\": \"This response was delayed 10 milliseconds. Reload the page if you didn't see the spinner.\"}]}")
	w.Write([]byte(response))
}

/*
func parseRatingForm(w http.ResponseWriter, r *http.Request, context context.Context) (PollForm, error) {
	answer, answerErr := parseNotEmptyFormValue(r, "answer")
	answerId, _ := strconv.Atoi(answer)
	clientId, clientIdErr := parseNotEmptyFormValue(r, "clientId")

	pollForm := PollForm{clientId, answerId}

	error := parseFormErrors([]error{answerErr, clientIdErr})
	return pollForm, error
}

*/
