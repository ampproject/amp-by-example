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
	"encoding/base64"
	"encoding/json"
	"net/http"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/appengine"
)

const (
	OAUTH_BASE = "/oauth/"

	OAUTH_COOKIE = "oauth2_cookie"

	CLIENT_SECRET_GOOGLE_FILENAME = "google_client_secret.json"
)

var (
	oauthScopes       = []string{"openid", "profile"}
	oauthGoogleConfig *oauth2.Config
)

func InitOAuth() {
	RegisterHandler(OAUTH_BASE+"google/login", oauthGoogleLogin)
	RegisterHandler(OAUTH_BASE+"google/callback", oauthGoogleCallback)
	RegisterHandler(OAUTH_BASE+"status", oauthStatus)
	RegisterHandler(OAUTH_BASE+"logout", oauthLogout)
}

func oauthLoginForConfig(w http.ResponseWriter, r *http.Request, config *oauth2.Config) {
	returnURL := r.URL.Query().Get("return")
	if returnURL == "" {
		http.Error(w, "Missing return URL", http.StatusBadRequest)
		return
	}

	state := RandomString(8)
	url := config.AuthCodeURL(state)

	cookieData := &oauthCookie{
		State:     state,
		ReturnURL: returnURL,
	}
	cookie, err := cookieData.ToCookie()
	if err != nil {
		http.Error(w, "Failed to create cookie", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, cookie)
	http.Redirect(w, r, url, http.StatusFound)
}

func oauthGoogleLogin(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := getOauthGoogleConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	oauthLoginForConfig(w, r, config)
}

func oauthCallbackForConfig(w http.ResponseWriter, r *http.Request, config *oauth2.Config, provider string) {
	query := r.URL.Query()

	cookieData, err := oauthCookieFromRequest(r)
	if err != nil {
		http.Error(w, "Invalid cookie", http.StatusInternalServerError)
		return
	}

	state := cookieData.State
	if query.Get("state") != state {
		http.Error(w, "Invalid OAuth2 state", http.StatusBadRequest)
		return
	}

	code := query.Get("code")
	if code == "" {
		http.Error(w, "Missing OAuth2 code", http.StatusBadRequest)
		return
	}

	ctx := appengine.NewContext(r)
	token, err := config.Exchange(ctx, code)
	if err != nil {
		oauthCookieClear(w)
		http.Redirect(w, r, cookieData.GenerateReturnURL(false), http.StatusFound)
		return
	}
	if !token.Valid() {
		oauthCookieClear(w)
		http.Redirect(w, r, cookieData.GenerateReturnURL(false), http.StatusFound)
		return
	}

	url := cookieData.GenerateReturnURL(true)
	cookieData = &oauthCookie{
		LoggedInWith: provider,
		Token:        token,
	}
	cookie, err := cookieData.ToCookie()
	if err != nil {
		http.Error(w, "Failed to create cookie", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, cookie)
	http.Redirect(w, r, url, http.StatusFound)
}

func oauthGoogleCallback(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := getOauthGoogleConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	oauthCallbackForConfig(w, r, config, "google")
}

func oauthStatus(w http.ResponseWriter, r *http.Request) {
	loggedIn := false
	cookie, err := oauthCookieFromRequest(r)
	if err == nil {
		loggedIn = cookie.LoggedInWith != ""
	}

	SendJsonResponse(w, map[string]interface{}{
		"loggedIn": loggedIn,
	})
}

func oauthLogout(w http.ResponseWriter, r *http.Request) {
	returnURL := r.URL.Query().Get("return")
	if returnURL == "" {
		http.Error(w, "Missing return URL", http.StatusBadRequest)
		return
	}
	returnURL += "#success=true"

	oauthCookieClear(w)
	http.Redirect(w, r, returnURL, http.StatusFound)
}

type oauthCookie struct {
	State        string
	ReturnURL    string
	LoggedInWith string
	Token        *oauth2.Token
}

func (c *oauthCookie) GenerateReturnURL(success bool) string {
	if !success {
		return c.ReturnURL + "#success=false"
	}
	return c.ReturnURL + "#success=true"
}

func (c *oauthCookie) ToCookie() (*http.Cookie, error) {
	dataJson, err := json.Marshal(c)
	if err != nil {
		return nil, err
	}
	return &http.Cookie{
		Name:     OAUTH_COOKIE,
		Value:    base64.RawStdEncoding.EncodeToString(dataJson),
		Path:     OAUTH_BASE,
		HttpOnly: true,
	}, nil
}

func oauthCookieFromRequest(r *http.Request) (*oauthCookie, error) {
	cookie, err := r.Cookie(OAUTH_COOKIE)
	if err != nil {
		return nil, err
	}
	data, err := base64.RawStdEncoding.DecodeString(cookie.Value)
	if err != nil {
		return nil, err
	}

	var out oauthCookie
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func oauthCookieClear(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     OAUTH_COOKIE,
		Path:     OAUTH_BASE,
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func getOauthGoogleConfig(ctx context.Context) (*oauth2.Config, error) {
	if oauthGoogleConfig != nil {
		return oauthGoogleConfig, nil
	}

	secret, err := readFileFromDatastore(ctx, CLIENT_SECRET_GOOGLE_FILENAME)
	if err != nil {
		return nil, err
	}

	oauthGoogleConfig, err = google.ConfigFromJSON(secret, oauthScopes...)
	if err != nil {
		return nil, err
	}

	return oauthGoogleConfig, nil
}
