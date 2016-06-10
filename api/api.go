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

package api

import (
	"bytes"
	"encoding/json"

	"golang.org/x/net/context"

	"google.golang.org/appengine/log"
	"google.golang.org/appengine/urlfetch"
	"io/ioutil"
	"net/http"
)

const (
	APIHeader = "X-Goog-Api-Key"

	// APIURLLimit is the limit of the number of URLs in API request.
	// Currently it is set as 10 as default.
	APIURLLimit = 10

	// APIEndpoint is AMP URL API (batchGet) endpoint.
	APIEndpoint = "https://acceleratedmobilepageurl.googleapis.com/v1/ampUrls:batchGet"
)

// APIHeader is required HTTP HEADER for AMP URL API.
// X-Goog-Api-Key header for authorization.
var UrlApiKey = getConfig().UrlApiKey

// TaskIDs is tentative struct to hold stringIDs, i.e. original URLs, for a single task.
type TaskIDs struct {
	IDs []string
}

// RequestBody is a struct for AMP URL API request body. On calling AMP URL batchGet API,
// its HTTP request body is marshaled instance of this struct.
type RequestBody struct {
	URLs []string `json:"urls"`
}

// ResponseBody is a struct for AMP URL API response body.
type ResponseBody struct {
	AmpURLs []URLData  `json:"ampUrls,omitempty"`
	Errors  []URLError `json:"urlErrors,omitempty"`
}

// URLData holds AMP URL and cached AMP URL of requested original URL.
type URLData struct {
	OriginalURL  string `json:"originalUrl,omitempty"`
	AmpURL       string `json:"ampUrl,omitempty"`
	CachedAmpURL string `json:"cdnAmpUrl,omitempty"`
}

// URLError holds error information that API returned.
type URLError struct {
	ErrorCode    string `json:"errorCode,omitempty"`
	ErrorMessage string `json:"errorMessage,omitempty"`
	OriginalURL  string `json:"originalUrl,omitempty"`
}

// NewRequestBody creates a instance for request body of single API call.
func NewRequestBody(urls []string) ([]byte, error) {
	b := RequestBody{
		URLs: urls,
	}
	return json.Marshal(b)
}

// AmpURLAPIRequest generates actual http.Request for API call to get
// cached AMP URLs of urls.
func AmpURLAPIRequest(requestBody RequestBody) (*http.Request, error) {
	b, err := json.Marshal(requestBody)
	body := bytes.NewBuffer(b)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", APIEndpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add(APIHeader, UrlApiKey)
	return req, nil
}

// Creates a request and sends it to the AMP URL API.
func Amplify(ctx context.Context, requestBody RequestBody) ([]byte, error) {
	log.Infof(ctx, "API Key %v", UrlApiKey)
	req, err := AmpURLAPIRequest(requestBody)
	if err != nil {
		return nil, err
	}
	client := urlfetch.Client(ctx)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return data, nil
}
