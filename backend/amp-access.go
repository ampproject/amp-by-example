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
	"net/url"
	"path"
	"strings"
	"time"
)

type AccessData struct {
	ReturnURL string
}

type AuthorizationResponse interface {
	CreateAuthorizationResponse() AuthorizationResponse
}

const (
	AMP_ACCESS_SAMPLE_PATH = "/" + CATEGORY_COMPONENTS + "/amp-access/"
	AMP_ACCESS_COOKIE      = "ABE_LOGGED_IN"
)

var validUsers = map[string]bool{
	"mark@gmail.com": true,
	"jane@gmail.com": true,
}

var powerUsers = map[string]bool{
	"Jane@gmail.com": true,
}

func InitAmpAccess() {
	RegisterHandler(AMP_ACCESS_SAMPLE_PATH+"authorization", handleAuthorization)
	RegisterHandler(AMP_ACCESS_SAMPLE_PATH+"login", handleLogin)
	RegisterHandler(AMP_ACCESS_SAMPLE_PATH+"logout", handleLogout)
	RegisterHandler(AMP_ACCESS_SAMPLE_PATH+"pingback", handlePingback)
	RegisterHandler(AMP_ACCESS_SAMPLE_PATH+"submit", handleSubmit)
}

func handlePingback(w http.ResponseWriter, r *http.Request) {
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	returnURL := r.URL.Query().Get("return")
	if !isValidURL(returnURL) {
		http.Error(w, "Invalid return URL", http.StatusInternalServerError)
		return
	}
	filePath := path.Join(DIST_FOLDER, "login.html")
	t, _ := template.ParseFiles(filePath)
	t.Execute(w, AccessData{ReturnURL: returnURL})
}

func handleAuthorization(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(AMP_ACCESS_COOKIE)
	if err != nil {
		SendJsonResponse(w, map[string]interface{}{
			"loggedIn":  false,
			"powerUser": false,
			"email":     "",
			"name":      "",
		})
		return
	}

	email := strings.ToLower(c.Value)
	isPowerUser := powerUsers[email]
	SendJsonResponse(w, map[string]interface{}{
		"loggedIn":  true,
		"powerUser": isPowerUser,
		"email":     email,
		"name":      strings.Split(email, "@")[0],
	})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	//delete the cookie
	cookie := &http.Cookie{
		Name:   AMP_ACCESS_COOKIE,
		MaxAge: -1,
	}
	http.SetCookie(w, cookie)
	returnURL := r.URL.Query().Get("return")
	if !isValidURL(returnURL) {
		http.Error(w, "Invalid return URL", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("%s#success=true", returnURL), http.StatusSeeOther)
}

func handleSubmit(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	if !validUsers[email] {
		http.Error(w, "Invalid email", http.StatusUnauthorized)
		return
	}

	expireInOneDay := time.Now().AddDate(0, 0, 1)
	cookie := &http.Cookie{
		Name:    AMP_ACCESS_COOKIE,
		Expires: expireInOneDay,
		Value:   email,
	}
	http.SetCookie(w, cookie)
	returnURL := r.FormValue("returnurl")
	if !isValidURL(returnURL) {
		http.Error(w, "Invalid return URL", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("%s#success=true", returnURL), http.StatusSeeOther)
}

func isValidURL(urlString string) bool {
	u, err := url.Parse(urlString)
	if err != nil {
		return false
	} else if u.Scheme == "" || u.Host == "" {
		return false
	} else if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	return true
}
