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
	"github.com/patrickmn/go-cache"
	"log"
	"net/http"
	"time"
)

const (
	COMMENT_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/comment_section/"
	USER                = "Mark"
)

type Comment struct {
	Text     string
	User     string
	Datetime string
}

var commentsCache *cache.Cache

var defaultComments = []Comment{
	Comment{
		Text:     "This is the first comment",
		User:     "Alice",
		Datetime: time.Now().Format("2006-01-02 15:04"),
	},
	Comment{
		Text:     "This is the second comment",
		User:     "Bob",
		Datetime: time.Now().Format("2006-01-02 15:34"),
	},
}

func InitCommentSection() {
	commentsCache = cache.New(5*time.Minute, 10*time.Minute)
	RegisterHandler(COMMENT_SAMPLE_PATH+"comments/new", onlyPost(submitCommentXHR))
	RegisterHandler(COMMENT_SAMPLE_PATH+"comments", handleComments)
	RegisterHandler(COMMENT_SAMPLE_PATH+"submit", handleSubmit)
}

func handleComments(w http.ResponseWriter, r *http.Request) {
	SendJsonResponse(w, loadComments(r))
}

func loadComments(r *http.Request) []Comment {
	cookie, err := r.Cookie("amp-access")
	if err != nil {
		return defaultComments
	}
	if x, found := commentsCache.Get(cookie.Value); found {
		return x.([]Comment)
	}
	return defaultComments
}

func submitCommentXHR(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("amp-access")
	if err != nil {
		log.Printf("Could not read amp-access cookie, underlying err: %#v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	comments := loadComments(r)
	text := r.FormValue("text")
	if text != "" {
		newComment := Comment{
			Text:     text,
			User:     USER,
			Datetime: time.Now().Format("15:04:05"),
		}
		comments = append(comments, newComment)
		commentsCache.Set(cookie.Value, comments, cache.DefaultExpiration)
	}
	SendJsonResponse(w, comments)
}
