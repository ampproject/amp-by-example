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
	"net/http"
	"strconv"
	"time"
	"errors"

)

const (
	AMP_LIVE_LIST_COOKIE_NAME = "ABE_AMP_LIVE_LIST_STATUS"
<<<<<<< HEAD
	FIFTEEN_SECONDS           = 15
=======
	MAX_AGE_IN_SECONDS        = 1
	DIST_FOLDER               = "dist"
	SAMPLE_AMPS_FOLDER        = "samples_templates"
	COMPONENTS_FOLDER         = "components"
	MINUS_FIFTEEN_SECONDS     = -15
	MAX_BLOG_NUMBER						= 5
>>>>>>> Add pagination
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

type BlogPosting struct {
	Type            string      `json:"@type"`
	Headline        string      `json:"headline"`
	URL             string      `json:"url"`
	DatePublished   string      `json:"datePublished"`
	BlogArticleBody ArticleBody `json:"articleBody"`
	BlogPublisher   Publisher   `json:"publisher"`
	BlogImage       Image       `json:"image"`
}

type ArticleBody struct {
	Type string `json:"@type"`
}

type Publisher struct {
	Type             string `json:"@type"`
	Name             string `json:"name"`
	BlogPostingImage Image  `json:"logo"`
}

type Image struct {
	Type   string `json:"@type"`
	URL    string `json:"url"`
	Width  string `json:"width"`
	Height string `json:"height"`
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
		MetadataTimestamp: time.Format("2006-01-02T15:04:05.999999-07:00"),
	}
}

func (blogItem BlogItem) cloneWith(id int, timestamp time.Time) BlogItem {
	return createBlogEntry(blogItem.Heading, blogItem.Text, blogItem.Image, timestamp, id)
}

type Score struct {
	Timestamp  string
	ScoreTeam1 int
	ScoreTeam2 int
}

func createScore(scoreTeam1 int, scoreTeam2 int) Score {
	return Score{Timestamp: currentTimestamp(), ScoreTeam1: scoreTeam1, ScoreTeam2: scoreTeam2}
}

type LiveBlogSample struct {
	BlogItems     []BlogItem
	FootballScore Score
	BlogMetadata  []BlogPosting
	NextPageURL string
	PageNumber int
}

var blogs []BlogItem

func InitAmpLiveList() {
	initBlogPosts()
	RegisterSample(CATEGORY_SAMPLE_TEMPLATES+"/live_blog", handleLiveList)
	RegisterSample(CATEGORY_COMPONENTS+"/amp-live-list", handleLiveList)
}

func initBlogPosts() {
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
}


func handleLiveList(w http.ResponseWriter, r *http.Request, page Page) {
	newStatus := updateStatus(w, r)
	page.Render(w, createLiveBlogSample(newStatus, time.Now(), r))
}
/**
func registerHandler(sampleType string, sampleName string) {

	url := path.Join("/", sampleType, sampleName) + "/"
	filePath := path.Join(DIST_FOLDER, sampleType, sampleName, "index.html")
	t, error := template.ParseFiles(filePath)
	if error != nil {
		panic(error)
	}
	http.HandleFunc(url, func(w http.ResponseWriter, r *http.Request) {
		renderSample(w, r, url, t)
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
		**/

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

func createMetadata(r *http.Request) []BlogPosting {
	result := make([]BlogPosting, 0)
	for i := 0; i < len(blogs); i++ {
		result = append(result, BlogPosting{"BlogPosting",
			blogs[i].Heading,
			buildSourceOrigin(r.Host) + "/" + CATEGORY_SAMPLE_TEMPLATES + "/live_blog/#" + blogs[i].ID,
			blogs[i].MetadataTimestamp,
			ArticleBody{"Text"},
			Publisher{"Organization", "AMP By Example",
				Image{"ImageObject", buildSourceOrigin(r.Host) + "/img/favicon.png", "512", "512"}},
			Image{"ImageObject", blogs[i].Image, "853", "1280"},
		})
	}
	return result
}


func createLiveBlogSample(newStatus int, timestamp time.Time, r *http.Request, firstBlogID string, url string) LiveBlogSample {

	if newStatus > len(blogs) {
		newStatus = len(blogs)
	}
	blogItems := getBlogEntries(newStatus, timestamp)
	score := createScore(newStatus, 0)
	firstItemIndex, _ := getProductIndexFromID(firstBlogID)
	nextPageURL := ""
	if firstItemIndex+MAX_BLOG_NUMBER < len(blogs) {
			nextPageFirstItemID := blogItems[firstItemIndex+MAX_BLOG_NUMBER].ID
			nextPageURL = buildSourceOrigin(r.Host) +url+"?from=" + nextPageFirstItemID
	}

	return LiveBlogSample{BlogItems: blogItems[firstItemIndex:firstItemIndex+MAX_BLOG_NUMBER], 
		FootballScore: score, 
		BlogMetadata: createMetadata(r), 
		NextPageURL: nextPageURL, 
		PageNumber: getPageNumberFromProductIndex(firstItemIndex)}
}

func getPageNumberFromProductIndex(index int) int{
	return (index / MAX_BLOG_NUMBER ) + 1
}

func getProductIndexFromID(id string) (int, error){
	for i := 0; i < len(blogs); i++ {
		if blogs[i].ID == id {
			return i, nil
		}		
	}
	return 0, errors.New("ID not found")
}

func getBlogEntries(size int, timestamp time.Time) []BlogItem {
	result := make([]BlogItem, 0)
	for i := 0; i < size; i++ {
		newTimeStamp := timestamp.Add(time.Duration(-FIFTEEN_SECONDS*(size-i)) * time.Second)
		newBlogEntry := blogs[i].cloneWith(i+1, newTimeStamp)
		result = append(result, newBlogEntry)
	}
	return result
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
