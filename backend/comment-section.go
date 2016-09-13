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
	COMMENT_SAMPLE_PATH = "/samples_templates/comment_section/"
	MINUS_TEN_SECONDS   = -10
	COMMENT_COOKIE_NAME = "ABE_EMAIL"
)

type CommentAuthorizationResponse struct {
	User string `json:"user"`
}

func (h CommentAuthorizationResponse) CreateAuthorizationResponse() AuthorizationResponse {
	return CommentAuthorizationResponse{"test-user"}
}

type CommentSection struct {
	Comments []Comment
}

type Comment struct {
	Text     string
	Datetime string
}

type AccessData struct {
	ReaderID  string
	ReturnURL string
}

func InitCommentSection() {
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit-comment-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitCommentXHR)
	})
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit-comment", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitComment)
	})
	registerCommentSectionHandler("comment_section")
	registerCommentSectionHandler("comment_section/preview")
	http.HandleFunc(COMMENT_SAMPLE_PATH+"authorization", handleCommentAuthorization)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"pingback", handlePingback)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"login", handleCommentLogin)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"logout", handleCommentLogout)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit", handleCommentSubmit)
}

func registerCommentSectionHandler(sampleName string) {
	filePath := path.Join(DIST_FOLDER, SAMPLE_TEMPLATE_FOLDER, sampleName, "index.html")
	template, err := template.New("index.html").Delims("[[", "]]").ParseFiles(filePath)
	if err != nil {
		panic(err)
	}
	route := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName) + "/"
	http.HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
		renderComment(w, r, sampleName, *template)
	})
}

func renderComment(w http.ResponseWriter, r *http.Request, sampleName string, t template.Template) {
	commentSection := listComment(sampleName, r)
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	t.Execute(w, commentSection)
}

func listComment(sampleName string, r *http.Request) CommentSection {
	var comments []Comment
	lastComment := Comment{"This is the second comment", time.Now().Format("15:04:05")}
	firstComment := Comment{"This is the first comment", time.Now().Add(time.Duration(MINUS_TEN_SECONDS) * time.Second).Format("15:04:05")}
	comments = append(comments, lastComment)
	comments = append(comments, firstComment)
	return CommentSection{Comments: comments}
}

func submitCommentXHR(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
	w.Header().Set("Content-Type", "application/json")
	response := ""
	text := r.FormValue("text")
	if text != "" {
		newComment := Comment{
			Text:     text,
			Datetime: time.Now().Format("15:04:05"),
		}
		response = fmt.Sprintf("{\"Datetime\":\"%s\", \"Text\":\"%s\"}", newComment.Datetime, newComment.Text)
		w.Write([]byte(response))
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
}

func submitComment(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusBadRequest)
}

func handleCommentAuthorization(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(COMMENT_COOKIE_NAME)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	email := cookie.Value
	if email != "test-user@gmail.com" {
		return
	}

	handleAuthorization(w, r, new(CommentAuthorizationResponse).CreateAuthorizationResponse())
}

func handleCommentLogin(w http.ResponseWriter, r *http.Request) {
	returnURL := r.URL.Query().Get("return")
	filePath := path.Join(DIST_FOLDER, "login.html")
	t, _ := template.ParseFiles(filePath)
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	t.Execute(w, AccessData{ReaderID: "", ReturnURL: returnURL})
}

func handleCommentLogout(w http.ResponseWriter, r *http.Request) {
	//delete the cookie
	cookie := &http.Cookie{
		Name:   COMMENT_COOKIE_NAME,
		MaxAge: -1,
		Value:  "",
	}
	http.SetCookie(w, cookie)
	http.Redirect(w, r, fmt.Sprintf("%s%s", buildSourceOrigin(r.Host), COMMENT_SAMPLE_PATH), http.StatusSeeOther)
}

func handleCommentSubmit(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	cookie := &http.Cookie{
		Name:    COMMENT_COOKIE_NAME,
		Expires: expireInOneDay,
		Value:   email,
	}
	http.SetCookie(w, cookie)
	returnURL := r.FormValue("returnurl")
	http.Redirect(w, r, fmt.Sprintf("%s#success=true", returnURL), http.StatusSeeOther)
}
