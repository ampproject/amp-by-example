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

package hello

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"strings"
)

const (
	MAX_AGE_IN_SECONDS = 60 * 60 * 24 // 1 day
	OLD_ADDRESS        = "amp-by-example.appspot.com"
	NEW_ADDRESS        = "https://ampbyexample.com"
	DIST_DIR           = "dist"
)

var REDIRECTS [18][2]string = [18][2]string{
	{"/amp-accordion.html", "/components/amp-accordion"},
	{"/amp-ad.html", "/components/amp-ad"},
	{"/amp-anim.html", "/components/amp-anim"},
	{"/amp-audio.html", "/components/amp-audio"},
	{"/amp-brightcove.html", "/components/amp-brightcove"},
	{"/amp-carousel.html", "/components/amp-carousel"},
	{"/amp-facebook.html", "/components/amp-facebook"},
	{"/amp-iframe.html", "/components/amp-iframe"},
	{"/amp-image-lightbox.html", "/components/amp-image-lightbox"},
	{"/amp-img.html", "/components/amp-img"},
	{"/amp-instagram.html", "/components/amp-instagram"},
	{"/amp-lightbox.html", "/components/amp-lightbox"},
	{"/amp-twitter.html", "/components/amp-twitter"},
	{"/amp-user-notification_with_local_storage.html", "/components/amp-user-notification"},
	{"/amp-user-notification_with_server_endpoint.html", "/Advanced/amp-user-notification_with_server_endpoint"},
	{"/amp-video.html", "/components/amp-video"},
	{"/amp-youtube.html", "/components/amp-youtube"},
	{"/Hello_World.html", "/components/Hello_World.html"},
}

func init() {
	RedirectLegacyExamples()
	http.HandleFunc("/g", getParameterDemoHandler)
	http.HandleFunc("/error", returnCode500)
	http.Handle("/", RedirectDomain(NoDirListing(http.FileServer(http.Dir(DIST_DIR)))))
}

func NoDirListing(h http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") && !exists(DIST_DIR+r.URL.Path+"index.html") {
			http.NotFound(w, r)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func getParameterDemoHandler(w http.ResponseWriter, r *http.Request) {
	value := r.URL.Query().Get("value")
	renderTemplate(w, "get-example", value)
}

func renderTemplate(w http.ResponseWriter, templateName string, value string) {
	t, _ := template.ParseFiles("templates/" + templateName + ".html")
	t.Execute(w, value)
}

func RedirectLegacyExamples() {
	for i := range REDIRECTS {
		source := REDIRECTS[i][0]
		target := "https://ampbyexample.com" + REDIRECTS[i][1]
		http.Handle(source, http.RedirectHandler(target, 301))
	}
}

func RedirectDomain(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == OLD_ADDRESS ||
			(r.TLS == nil && !strings.HasPrefix(r.Host, "localhost")) {
			http.Redirect(w, r, NEW_ADDRESS+r.URL.Path, http.StatusMovedPermanently)
			return
		}
		w.Header().Add("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate, proxy-revalidate", MAX_AGE_IN_SECONDS))
		// make content accessible via the Google AMP CDN
		w.Header().Add("Access-Control-Allow-Origin", "*")
		h.ServeHTTP(w, r)
	})
}

func returnCode500(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte("Internal Server Error"))
}

func exists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}
