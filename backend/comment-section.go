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
	"html/template"
	"net/http"
	"path"
	"time"
)

const (
	COMMENT_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/comment_section/"
	COMMENT_COOKIE_NAME = "ABE_LOGGED_IN"
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

type AccessData struct {
	ReturnURL string
}

func InitCommentSection() {
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit-comment-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitCommentXHR)
	})

	http.HandleFunc(COMMENT_SAMPLE_PATH+"authorization", handleCommentAuthorization)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"login", handleCommentLogin)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"logout", handleCommentLogout)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit", handleCommentSubmit)
}

func submitCommentXHR(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
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
	_, err := r.Cookie(COMMENT_COOKIE_NAME)
	if err != nil {
		handleAuthorization(w, r, new(CommentAuthorizationResponse).CreateInvalidAuthorizationResponse())
		return
	}
	handleAuthorization(w, r, new(CommentAuthorizationResponse).CreateAuthorizationResponse())
}

func handleCommentLogin(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	returnURL := r.URL.Query().Get("return")
	filePath := path.Join(DIST_FOLDER, "login.html")
	t, _ := template.ParseFiles(filePath)
	t.Execute(w, AccessData{ReturnURL: returnURL})
}

func handleCommentLogout(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	//delete the cookie
	cookie := &http.Cookie{
		Name:   COMMENT_COOKIE_NAME,
		MaxAge: -1,
	}
	http.SetCookie(w, cookie)
	returnURL := r.URL.Query().Get("return")
	http.Redirect(w, r, fmt.Sprintf("%s#success=true", returnURL), http.StatusSeeOther)
}

func handleCommentSubmit(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	cookie := &http.Cookie{
		Name:    COMMENT_COOKIE_NAME,
		Expires: expireInOneDay,
		Value:   "true",
	}
	http.SetCookie(w, cookie)
	returnURL := r.FormValue("returnurl")
	http.Redirect(w, r, fmt.Sprintf("%s#success=true", returnURL), http.StatusSeeOther)
}
