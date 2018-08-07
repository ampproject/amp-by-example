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
)

const (
	EMAIL_BASE_PATH = "/amphtml-email/"
)

func InitAmpEmail() {
	RegisterHandler(EMAIL_BASE_PATH+"submit-form-friend-request", onlyPost(submitFormFriendRequest))
	RegisterHandler(EMAIL_BASE_PATH+"submit-form-bookmark", onlyPost(submitFormBookmark))
}

func submitFormFriendRequest(w http.ResponseWriter, r *http.Request) {
	action := r.FormValue("action")
	switch action {
	case "confirm":
		SendJsonResponse(w, map[string]string{
			"result": "Confirmed",
		})
	case "delete":
		SendJsonResponse(w, map[string]string{
			"result": "Deleted",
		})
	default:
		SendJsonError(w, http.StatusBadRequest, map[string]string{
			"result": "Invalid request",
		})
	}
}

func submitFormBookmark(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	SendJsonResponse(w, map[string]string{
		"result": fmt.Sprintf("Item with ID %q bookmarked.", id),
	})
}
