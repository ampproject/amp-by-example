/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package playground

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/memcache"
	"google.golang.org/appengine/taskqueue"
	"google.golang.org/appengine/urlfetch"
)

const (
	COMPONENTS_URL                 = "https://api.github.com/repos/ampproject/amphtml/git/trees/master?recursive=1"
	COMPONENTS_MEMCACHE_KEY        = "amp-components-list"
	COMPONENTS_UPDATE_FREQ_SECONDS = 86400
	PLAYGROUND_PATH_PREFIX         = "/playground"
)

var componentRegex = regexp.MustCompile("extensions/(amp-[^/]+)/([0-9]+.[0-9]+)$")
var validRequestUrlOrigins map[string]bool

type GitHubBlob struct {
	Path     string `json:"path"`
	Mode     string `json:"mode"`
	BlobType string `json:"type"`
	Sha      string `json:"sha"`
	Size     int    `json:"size"`
	Url      string `json:"url"`
}

type GitHubApiResponse struct {
	Sha       string       `json:"sha"`
	Url       string       `json:"url"`
	Tree      []GitHubBlob `json:"tree"`
	Truncated bool         `json:"truncated"`
}

type AmpComponentsList struct {
	Timestamp  int
	Components []byte
}

func InitPlayground() {
	http.HandleFunc(PLAYGROUND_PATH_PREFIX+"/fetch", handler)
	http.HandleFunc(PLAYGROUND_PATH_PREFIX+"/amp-component-versions", components)
	http.HandleFunc(PLAYGROUND_PATH_PREFIX+"/amp-component-versions-task", componentsTask)
	validRequestUrlOrigins = map[string]bool{
		"ampbyexample.com":                     true,
		"ampstart.com":                         true,
		"ampstart-staging.firebaseapp.com":     true,
		"localhost:8080":                       true,
		"amp-by-example-staging.appspot.com":   true,
		"amp-by-example-sebastian.appspot.com": true,
		"0.1.0.1": true,
	}
}

func InitializeComponents(r *http.Request) {
	getComponentsAndUpdateIfStale(r)
}

func components(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "only GET request supported", http.StatusBadRequest)
		return
	}
	if r.Header.Get("x-requested-by") != "playground" {
		http.Error(w, "x-requested-by invalid", http.StatusBadRequest)
		return
	}
	components := getComponentsAndUpdateIfStale(r)
	if components == nil {
		http.Error(w, "Server error", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-type", "application/json")
	w.Write(components.Components)
}

func getComponentsAndUpdateIfStale(r *http.Request) *AmpComponentsList {
	curTime := int(time.Now().Unix())
	ctx := appengine.NewContext(r)
	latest, _ := fetchComponentsFromMemCache(ctx)
	// latest could be nil if not in memcache or datastore.
	var timestamp int
	if latest != nil {
		timestamp = latest.Timestamp
	}

	if curTime-timestamp > COMPONENTS_UPDATE_FREQ_SECONDS {
		createTaskQueueUpdate(ctx, timestamp)
	}
	return latest
}

func createTaskQueueUpdate(ctx context.Context, timestamp int) {
	t := taskqueue.NewPOSTTask(PLAYGROUND_PATH_PREFIX+"/amp-component-versions-task",
		url.Values{})
	// Setting the name explicitly means that only one task will ever
	// be in the queue, even if attempted by separate instances.
	// The name chosen includes the timestamp of the last known
	// components list (or 0 for the first attempt), which means
	// that only one update task can be created for each version
	// known.
	t.Name = fmt.Sprintf("amp-components-list-last-known-%d", timestamp)
	minBackoff, _ := time.ParseDuration("10s")
	t.RetryOptions = &taskqueue.RetryOptions{
		RetryLimit: 5,
		MinBackoff: minBackoff,
	}
	log.Infof(ctx, "Adding to taskqueue: %s", t.Name)
	taskqueue.Add(ctx, t, "")
}

func componentsTask(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	_, err := fetchAndUpdateComponents(ctx)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Write([]byte("Updated components"))
}

func fetchAndUpdateComponents(ctx context.Context) ([]byte, error) {
	log.Infof(ctx, "Fetching components list from GitHub")
	components, err := fetchComponents(ctx)
	if err != nil {
		return nil, err
	}
	addComponentsToStores(ctx, components)
	return components, nil
}

func fetchComponentsFromDataStore(ctx context.Context) (*AmpComponentsList, error) {
	log.Infof(ctx, "Retrieving components from datastore")
	var components AmpComponentsList
	key := datastore.NewKey(ctx, "AmpComponentsList", "ComponentsListKey", 0, nil)
	err := datastore.Get(ctx, key, &components)
	if err != nil {
		log.Infof(ctx, "Error retrieving components from datastore")
		rawComponents, err := fetchAndUpdateComponents(ctx)
		if err != nil {
			return nil, err
		}
		components.Components = rawComponents
		components.Timestamp = int(time.Now().Unix())
	}
	return &components, err
}

func fetchComponentsFromMemCache(ctx context.Context) (*AmpComponentsList, error) {
	log.Infof(ctx, "Retrieving components from memcache")
	var components AmpComponentsList
	_, err := memcache.Gob.Get(ctx, COMPONENTS_MEMCACHE_KEY, &components)
	if err == memcache.ErrCacheMiss {
		log.Infof(ctx, "Components not in memcache, retrieving from datastore")
		dsComponents, err := fetchComponentsFromDataStore(ctx)
		if err == nil {
			log.Infof(ctx, "Setting datastore components value to memcache")
			memcacheItem := &memcache.Item{
				Key:    COMPONENTS_MEMCACHE_KEY,
				Object: dsComponents,
			}
			memcache.Gob.Set(ctx, memcacheItem)
			return dsComponents, nil
		}
	}
	return &components, err
}

func addComponentsToStores(ctx context.Context, rawComponents []byte) {
	components := &AmpComponentsList{
		Components: rawComponents,
		Timestamp:  int(time.Now().Unix()),
	}
	key := datastore.NewKey(ctx, "AmpComponentsList", "ComponentsListKey", 0, nil)
	log.Infof(ctx, "Adding components to datastore")
	_, err := datastore.Put(ctx, key, components)
	if err != nil {
		log.Infof(ctx, "Adding components to memcache")
		item := &memcache.Item{
			Key:    COMPONENTS_MEMCACHE_KEY,
			Object: components,
		}
		memcache.Gob.Set(ctx, item)
	}
}

func extractComponents(g *GitHubApiResponse) ([]byte, error) {
	vers := make(map[string]string)
	tree := g.Tree
	for _, blob := range tree {
		parseAndAddComponent(blob, vers)
	}
	return json.Marshal(vers)
}

func parseAndAddComponent(blob GitHubBlob, componentsWithVersion map[string]string) {
	groups := componentRegex.FindStringSubmatch(blob.Path)
	if len(groups) != 3 {
		return
	}
	component := groups[1]
	if strings.HasSuffix(component, "-impl") {
		return
	}
	ver := groups[2]
	elem, ok := componentsWithVersion[component]
	if !ok || ver > elem {
		componentsWithVersion[component] = ver
	}
}

func fetchComponents(ctx context.Context) ([]byte, error) {
	client := urlfetch.Client(ctx)
	req, err := http.NewRequest("GET", COMPONENTS_URL, nil)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	g := new(GitHubApiResponse)
	err = json.NewDecoder(resp.Body).Decode(&g)
	if err != nil {
		return nil, err
	}
	return extractComponents(g)
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "only GET request supported", http.StatusBadRequest)
		return
	}
	if r.Header.Get("x-requested-by") != "playground" {
		http.Error(w, "x-requested-by invalid", http.StatusBadRequest)
		return
	}
	param, _ := r.URL.Query()["url"]
	if len(param) <= 0 {
		http.Error(w, "No URL provided via 'url' query parameter", http.StatusBadRequest)
		return
	}
	u, err := url.Parse(param[0])
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		http.Error(w, "Invalid URL scheme", http.StatusBadRequest)
		return
	}
	// only allow URLs from trusted domains
	if !validRequestUrlOrigins[u.Host] {
		http.Error(w, "Untrusted origin", http.StatusBadRequest)
		return
	}
	ctx := appengine.NewContext(r)
	client := urlfetch.Client(ctx)
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	req.Header.Add("User-Agent",
		"Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MTC19V) "+
			"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile "+
			"Safari/537.36 (compatible; validator.ampproject.org)")
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Bad gateway (%v)", err.Error()),
			http.StatusBadGateway)
		return
	}
	if err != nil {
		http.Error(w, fmt.Sprintf("Problem formatting json (%v)",
			err.Error()),
			http.StatusInternalServerError)
	}
	w.Header().Set("Content-type", "application/json")
	w.Write(data)
}
