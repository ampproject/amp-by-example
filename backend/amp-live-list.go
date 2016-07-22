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
	"strconv"
	"time"
)

const (
	AMP_LIVE_LIST_COOKIE_NAME = "ABE_AMP_LIVE_LIST_STATUS"
	MAX_AGE_IN_SECONDS        = 1
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

func InitAmpLiveList() {
	blogs = make([]BlogItem, 0)
	blogs = append(blogs,
		createBlogEntry("A green landscape", "/img/landscape_hills_300x200.jpg"),
		createBlogEntry("Mountains", "/img/landscape_mountains_300x200.jpg"),
		createBlogEntry("Road leading to a lake", "/img/landscape_lake_300x200.jpg"),
		createBlogEntry("Forested hills", "/img/landscape_trees_300x193.jpg"),
		createBlogEntry("Scattered houses", "/img/landscape_village_300x169.jpg"),
		createBlogEntry("A canyon", "/img/landscape_canyon_300x200.jpg"),
		createBlogEntry("Desert", "/img/landscape_desert_300x142.jpg"),
		createBlogEntry("Houses on the street", "/img/landscape_houses_300x201.jpg"),
		createBlogEntry("Blue sea", "/img/landscape_sea_300x200.jpg"),
		createBlogEntry("A sailing ship", "/img/landscape_ship_300x200.jpg"))
	http.HandleFunc("/dynamic_content_personalization/amp-live-list/", RenderLiveBlog)
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
	if newStatus > len(blogs) {
		newStatus = len(blogs)
	}
	blogItems := getBlogEntries(newStatus)
	score := createScore(newStatus, 0)
	return Page{BlogItems: blogItems, FootballScore: score}
}

func renderAmpLiveListSample(w http.ResponseWriter, page Page) {
	t, _ := template.ParseFiles("dist/dynamic_content_personalization/amp-live-list/index.html")
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	t.Execute(w, page)
}

func getBlogEntries(size int) []BlogItem {
	result := make([]BlogItem, 0)
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
