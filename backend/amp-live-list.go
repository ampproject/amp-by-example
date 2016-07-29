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
	"strconv"
	"time"
)

const (
	AMP_LIVE_LIST_COOKIE_NAME = "ABE_AMP_LIVE_LIST_STATUS"
	MAX_AGE_IN_SECONDS        = 1
	DIST_FOLDER               = "dist"
	SAMPLE_AMPS_FOLDER        = "samples_templates"
	COMPONENTS_FOLDER         = "components"
	MINUS_FIFTEEN_SECONDS     = -15
)

type BlogItem struct {
	Text              string
	Image             string
	Timestamp         string
	Date              string
	ID                string
	Heading           string
	MetadataTimestamp string
}

func (blogItem BlogItem) cloneWith(id int, timestamp time.Time) BlogItem {
	return createBlogEntry(blogItem.Heading, blogItem.Text, blogItem.Image, timestamp, id)
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
		createBlogEntryWithTimeNow("Green landscape", "A green landscape with a house and trees.", "/img/landscape_hills_1280x853.jpg", 1),
		createBlogEntryWithTimeNow("Mountains", "Mountains reflecting on a lake.", "/img/landscape_mountains_1280x853.jpg", 2),
		createBlogEntryWithTimeNow("Road leading to a lake", "A road leading to a lake with mountains on the back.", "/img/landscape_lake_1280x853.jpg", 3),
		createBlogEntryWithTimeNow("Forested hills", "Forested hills with a blue sky in the background.", "/img/landscape_trees_1280x823.jpg", 4),
		createBlogEntryWithTimeNow("Scattered houses", "Scattered houses in a mountain village.", "/img/landscape_village_1280x720.jpg", 5),
		createBlogEntryWithTimeNow("Canyon", "A deep canyon at sunset.", "/img/landscape_canyon_1280x853.jpg", 6),
		createBlogEntryWithTimeNow("Desert", "A desert with mountains in the background.", "/img/landscape_desert_1280x606.jpg", 7),
		createBlogEntryWithTimeNow("Houses", "Colorful one floor houses on a street.", "/img/landscape_houses_1280x858.jpg", 8),
		createBlogEntryWithTimeNow("Blue sea", "Blue sea surrounding a cave.", "/img/landscape_sea_1280x853.jpg", 9),
		createBlogEntryWithTimeNow("Sailing ship", "A ship sailing the sea at sunset.", "/img/landscape_ship_1280x853.jpg", 10))

	registerHandler(SAMPLE_AMPS_FOLDER, "live_blog")
	registerHandler(SAMPLE_AMPS_FOLDER, "live_blog/preview")
	registerHandler(COMPONENTS_FOLDER, "amp-live-list")

}

func registerHandler(sampleType string, sampleName string) {

	url := path.Join("/", sampleType, sampleName) + "/"
	filePath := path.Join(DIST_FOLDER, sampleType, sampleName, "index.html")

	http.HandleFunc(url, func(w http.ResponseWriter, r *http.Request) {
		renderSample(w, r, filePath)
	})
}

func createBlogEntryWithTimeNow(heading string, text string, imagePath string, id int) BlogItem {
	var now = time.Now()
	return createBlogEntry(heading, text, imagePath, now, id)
}

func createBlogEntry(heading string, text string, imagePath string, time time.Time, id int) BlogItem {
	return BlogItem{Text: text,
		Image:             imagePath,
		Timestamp:         time.Format("20060102150405"),
		Date:              time.Format("15:04:05"),
		ID:                "post" + strconv.Itoa(id),
		Heading:           heading,
		MetadataTimestamp: time.Format("2006-01-02T15:04:05.999999-07:00")}
}

func updateStatus(w http.ResponseWriter, r *http.Request) int {
	newStatus := readStatus(r) + 1
	writeStatus(w, newStatus)
	return newStatus
}

func readStatus(r *http.Request) int {
	cookie, err := r.Cookie(AMP_LIVE_LIST_COOKIE_NAME)
	if err != nil {
		return 0
	}
	result, _ := strconv.Atoi(cookie.Value)
	return result
}

func createPage(newStatus int, timestamp time.Time) Page {
	if newStatus > len(blogs) {
		newStatus = len(blogs)
	}
	blogItems := getBlogEntries(newStatus, timestamp)
	score := createScore(newStatus, 0)
	return Page{BlogItems: blogItems, FootballScore: score}
}

func renderSample(w http.ResponseWriter, r *http.Request, filePath string) {
	t, _ := template.ParseFiles(filePath)
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	newStatus := updateStatus(w, r)
	t.Execute(w, createPage(newStatus, time.Now()))
}

func getBlogEntries(size int, timestamp time.Time) []BlogItem {
	result := make([]BlogItem, 0)
	for i := 0; i < size; i++ {
		result = append(result, blogs[i].cloneWith(i+1, timestamp.Add(time.Duration(MINUS_FIFTEEN_SECONDS*(size-i))*time.Second)))
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
