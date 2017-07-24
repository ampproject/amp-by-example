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
	"io/ioutil"
	"sort"
	"encoding/json"
	"strconv"
)

const (
	COMMENT_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/comment_section/"
	USER                = "Charlie"
	ABE_COMMENT_SORT    = "ABE_COMMENT_SORT"
	ABE_COMMENT_NUMBER  = "ABE_COMMENT_NUMBER"
	COMMENT_DATE_NEW_FIRST = "comment-date-new-first"
)

type CommentAuthorizationResponse struct {
	User 							bool `json:"loggedIn"`
	NumberOfComments 	int  `json:"numberOfComments"`
	Sort							string `json:"sort"`
}

type Comment struct {
	Text     string
	User     string
	Datetime string
	UserImg  string
}

type CommentJsonRoot struct {
	Comments []Comment `json:"items"`
}

var comments []Comment
var commentsRoot CommentJsonRoot

func (h CommentAuthorizationResponse) CreateAuthorizationResponse(r *http.Request) AuthorizationResponse {
	numberOfCommentsCookie, _ := r.Cookie(ABE_COMMENT_NUMBER)
	numberOfCommentsCookieInt, _ := strconv.Atoi(numberOfCommentsCookie.Value)

	sortingCookie, _:= r.Cookie(ABE_COMMENT_SORT)
	sortStrategy := sortingCookie.Value
	return CommentAuthorizationResponse{true, numberOfCommentsCookieInt, sortStrategy}
}

func (h CommentAuthorizationResponse) CreateInvalidAuthorizationResponse() AuthorizationResponse {
	return CommentAuthorizationResponse{false, -1, COMMENT_DATE_NEW_FIRST}
}

func InitCommentSection() {
	initComments(DIST_FOLDER + "/json/comments.json")
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit-comment-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, submitCommentXHR)
	})
	http.HandleFunc(COMMENT_SAMPLE_PATH+"authorization", handleCommentAuthorization)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"login", handleLogin)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit-logout", handleLogout)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"logout", handleLogoutButton)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"submit", handleSubmit)
	http.HandleFunc(COMMENT_SAMPLE_PATH+"update-preferences", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, updatePreferences)
	})
	http.HandleFunc("/samples_templates/comment_section/comments", handleCommentsRequest)

}

func submitCommentXHR(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	response := ""
	text := r.FormValue("text")
	if text != "" {
		newComment := Comment{
			Text:     text,
			User:     USER,
			Datetime: time.Now().Format("2006-01-02T15:04:05.000Z"),
			UserImg:  "/img/ic_account_box_black_48dp_1x.png",
		}
		response = fmt.Sprintf("{\"Datetime\":\"%s\", \"User\":\"%s\", \"Text\":\"%s\", \"UserImg\":\"%s\"}",
			newComment.Datetime, newComment.User, newComment.Text, newComment.UserImg)
		w.Write([]byte(response))
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
}

func updatePreferences(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	numberOfComments, _ := strconv.Atoi(r.FormValue("numberOfComments"))
	sort := r.FormValue("sort")
	sortingCookie := createSortingCookie(sort)
	numberOfCommentsCookie := createNumberOfCommentsCookie(numberOfComments)
	http.SetCookie(w, numberOfCommentsCookie)
	http.SetCookie(w, sortingCookie)
	SetContentTypeJson(w)
	response := "{\"result\":\"ok\"}"
	w.Write([]byte(response))
}

func handleCommentsRequest(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	var responseComments []Comment
	responseComments = make([]Comment, len(comments))
	responseComments = comments
	numberOfCommentsCookie, errNumberOfComments := r.Cookie(ABE_COMMENT_NUMBER)
	//cookie is not set yet
	if errNumberOfComments != nil {
		numberOfCommentsCookie = createNumberOfCommentsCookieDefault()
		http.SetCookie(w, numberOfCommentsCookie)
	}
	sortingCookie, errSortingCookie := r.Cookie(ABE_COMMENT_SORT)
	//cookie is not set yet
	if errSortingCookie != nil {
		sortingCookie = createSortingCookieDefault()
		http.SetCookie(w, sortingCookie)
	}
	sortQuery := sortingCookie.Value
	if sortQuery != "" {
		if sortQuery == COMMENT_DATE_NEW_FIRST {
			sort.Sort(ByDateDesc(responseComments))
		} else {
			sort.Sort(ByDateAsc(responseComments))
		}
	}
	numberOfCommentsQuery := numberOfCommentsCookie.Value
	numberOfComments, numberOfCommentsError := strconv.Atoi(numberOfCommentsQuery)
	if numberOfCommentsError != nil {
		http.Error(w, "Parsing number of comments error", http.StatusInternalServerError)
		return
	}

	responseComments = responseComments[:numberOfComments]

	w.Header().Set("Content-Type", "application/json")
	var responseCommentsRoot CommentJsonRoot = commentsRoot
	responseCommentsRoot.Comments = responseComments
	jsonComments, jsonError := json.Marshal(responseCommentsRoot)
	if jsonError != nil {
		http.Error(w, "Comments marshal error", http.StatusInternalServerError)
		return
	}
	w.Write(jsonComments)
}

func createNumberOfCommentsCookie(numberOfComments int) *http.Cookie {
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	return &http.Cookie{
		Name:    ABE_COMMENT_NUMBER,
		Expires: expireInOneDay,
		Value:   strconv.Itoa(numberOfComments),
	}
}

func createNumberOfCommentsCookieDefault() *http.Cookie {
	return createNumberOfCommentsCookie(len(comments))
}

func createSortingCookieDefault() *http.Cookie {
	return createSortingCookie(COMMENT_DATE_NEW_FIRST)
}

func createSortingCookie(sort string) *http.Cookie {
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	return &http.Cookie {
		Name:    ABE_COMMENT_SORT,
		Expires: expireInOneDay,
		Value:   sort,
	}
}

type ByDateAsc []Comment

func (a ByDateAsc) Len() int      { return len(a) }
func (a ByDateAsc) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a ByDateAsc) Less(i, j int) bool {
	layout := "2006-01-02T15:04:05.000Z"
	date1String := a[i].Datetime
	date2String := a[j].Datetime
	date1, err1 := time.Parse(layout, date1String)
	date2, err2 := time.Parse(layout, date2String)
	if err1 != nil || err2 != nil {
		return false
	}
	return date1.Before(date2)
}

type ByDateDesc []Comment

func (a ByDateDesc) Len() int      { return len(a) }
func (a ByDateDesc) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a ByDateDesc) Less(i, j int) bool {
	layout := "2006-01-02T15:04:05.000Z"
	date1String := a[i].Datetime
	date2String := a[j].Datetime
	date1, err1 := time.Parse(layout, date1String)
	date2, err2 := time.Parse(layout, date2String)
	if err1 != nil || err2 != nil {
		return false
	}
	return date2.Before(date1)
}

func handleCommentAuthorization(w http.ResponseWriter, r *http.Request) {
	_, err := r.Cookie(AMP_ACCESS_COOKIE)
	if err != nil {
		handleAuthorization(w, r, new(CommentAuthorizationResponse).CreateInvalidAuthorizationResponse())
		return
	}
	handleAuthorization(w, r, new(CommentAuthorizationResponse).CreateAuthorizationResponse(r))
}

func initComments(path string) {
	commentsFile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	var root CommentJsonRoot
	err = json.Unmarshal(commentsFile, &root)
	if err != nil {
		panic(err)
	}
	commentsRoot = root
	comments = root.Comments
}
