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
	"time"
)

const (
	COMMENT_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/comment_section/"
	USER                = "Charlie"
)

type CommentAuthorizationResponse struct {
	User bool `json:"loggedIn"`
}

func (h CommentAuthorizationResponse) CreateAuthorizationResponse() AuthorizationResponse {
	return CommentAuthorizationResponse{true}
}

func (h CommentAuthorizationResponse) CreateInvalidAuthorizationResponse() AuthorizationResponse {
	return CommentAuthorizationResponse{false}
}

type Comment struct {
	Text     string
	User     string
	Datetime string
	UserImg  string
}

func InitCommentSection() {
	RegisterHandler(COMMENT_SAMPLE_PATH+"submit-comment-xhr", onlyPost(submitCommentXHR))
	RegisterHandler(COMMENT_SAMPLE_PATH+"authorization", handleCommentAuthorization)
	RegisterHandler(COMMENT_SAMPLE_PATH+"login", handleLogin)
	RegisterHandler(COMMENT_SAMPLE_PATH+"submit-logout", handleLogout)
	RegisterHandler(COMMENT_SAMPLE_PATH+"logout", handleLogoutButton)
	RegisterHandler(COMMENT_SAMPLE_PATH+"submit", handleSubmit)
}

func submitCommentXHR(w http.ResponseWriter, r *http.Request) {
	response := ""
	text := r.FormValue("text")
	if text != "" {
		newComment := Comment{
			Text:     text,
			User:     USER,
			Datetime: time.Now().Format("15:04:05"),
			UserImg:  "/img/ic_account_box_black_48dp_1x.png",
		}
		response = fmt.Sprintf("{\"Datetime\":\"%s\", \"User\":\"%s\", \"Text\":\"%s\", \"UserImg\":\"%s\"}",
			newComment.Datetime, newComment.User, newComment.Text, newComment.UserImg)
		w.Write([]byte(response))
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
}

func handleCommentAuthorization(w http.ResponseWriter, r *http.Request) {
	_, err := r.Cookie(AMP_ACCESS_COOKIE)
	if err != nil {
		SendJsonResponse(w, new(CommentAuthorizationResponse).CreateInvalidAuthorizationResponse())
		return
	}
	SendJsonResponse(w, new(CommentAuthorizationResponse).CreateAuthorizationResponse())
}
