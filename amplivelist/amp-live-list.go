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

package amplivelist

import (
	"html/template"
	"net/http"
	"strconv"
	"time"
)

const (
	AMP_LIVE_LIST_COOKIE_NAME = "ABE_AMP_LIVE_LIST_STATUS"
)

type BlogItem struct {
	Text      string
	Image     string
	Timestamp string
}

func (blogItem BlogItem) clone() BlogItem {
	return createBlogEntry(blogItem.Text, blogItem.Image)
}

type Score struct {
	Timestamp  string
	ScoreTeam1 int
	ScoreTeam2 int
}

type Page struct {
	BlogItems     []BlogItem
	FootballScore Score
}

var blogs []BlogItem

func InitBlogs() {
	blogs = make([]BlogItem, 0)
	blogs = append(blogs,
		createBlogEntry("A green landscape", "/img/landscape5.jpg"),
		createBlogEntry("A mountain landscape", "/img/landscape6.jpg"),
		createBlogEntry("A lake landscape", "/img/landscape1.jpg"),
		createBlogEntry("A trees landscape", "/img/landscape2.jpg"),
		createBlogEntry("A village landscape", "/img/landscape3.jpg"),
		createBlogEntry("A canyon", "/img/landscape4.jpg"),
		createBlogEntry("A beach", "/img/beach.jpg"),
		createBlogEntry("Houses on the street", "/img/houses.jpg"),
		createBlogEntry("Blue sea", "/img/sea.jpg"),
		createBlogEntry("A ship", "/img/ship.jpg"))
}

func createBlogEntry(text string, imagePath string) BlogItem {
	return BlogItem{Text: text, Image: imagePath, Timestamp: currentTimestamp()}
}

func RenderLiveBlog(w http.ResponseWriter, r *http.Request) {
	newStatus := readStatus(r) + 1
	page := createPage(newStatus)
	writeStatus(w, newStatus)
	renderAmpLiveListSample(w, page)
}

func readStatus(r *http.Request) int {
	cookie, err := r.Cookie(AMP_LIVE_LIST_COOKIE_NAME)
	if err != nil {
		return 0
	}
	result, _ := strconv.Atoi(cookie.Value)
	return result
}

func createPage(newStatus int) Page {
	blogItems := getBlogEntries(newStatus)
	score := createScore(newStatus, 0)
	return Page{BlogItems: blogItems, FootballScore: score}
}

func renderAmpLiveListSample(w http.ResponseWriter, page Page) {
	t, _ := template.ParseFiles("dist/components/amp-live-list/index.html")
	t.Execute(w, page)
}

func getBlogEntries(size int) []BlogItem {
	result := make([]BlogItem, 0)
	if size > len(blogs) {
		size = len(blogs)
	}
	for i := 0; i < size; i++ {
		result = append(result, blogs[i].clone())
	}
	return result
}

func createScore(scoreTeam1 int, scoreTeam2 int) Score {
	return Score{Timestamp: currentTimestamp(), ScoreTeam1: scoreTeam1, ScoreTeam2: scoreTeam2}
}

func currentTimestamp() string {
	return time.Now().Format("20060102150405")
}

func writeStatus(w http.ResponseWriter, newValue int) {
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	cookie := &http.Cookie{
		Name:    AMP_LIVE_LIST_COOKIE_NAME,
		Expires: expireInOneDay,
		Value:   strconv.Itoa(newValue),
	}
	http.SetCookie(w, cookie)
}
