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

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/appengine"
)

const (
	OAUTH_BASE = "/oauth/"

	OAUTH_COOKIE_RETURN = "oauth2_return"
	OAUTH_COOKIE_STATE  = "oauth2_state"
)

var oauthGoogleConfig = &oauth2.Config{
	ClientID:     "942246668199-hsrojq1smecb0srckt3dk86orr3u1c9r.apps.googleusercontent.com",
	ClientSecret: "agmDbkxD-mW4Lqk0kGtiEsvi",
	Scopes:       []string{"openid", "profile"},
	Endpoint:     google.Endpoint,
	RedirectURL:  "https://abe-staging.appspot.com/oauth/google/callback",
}

func InitOAuth() {
	RegisterHandler(OAUTH_BASE+"google/login", oauthGoogleLogin)
	RegisterHandler(OAUTH_BASE+"google/callback", oauthGoogleCallback)
}

func oauthGoogleLogin(w http.ResponseWriter, r *http.Request) {
	returnURL := r.URL.Query().Get("return")
	if returnURL == "" {
		http.Error(w, "Missing return URL", http.StatusBadRequest)
		return
	}

	state := RandomString(8)
	url := oauthGoogleConfig.AuthCodeURL(state)

	oauthCookieToResponse(w, &oauthCookie{
		State:     state,
		returnURL: returnURL,
	})

	http.Redirect(w, r, url, http.StatusSeeOther)
}

func oauthGoogleCallback(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	cookie, err := oauthCookieFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	oauthCookieDelete(w)

	state := cookie.State
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
	token, err := oauthGoogleConfig.Exchange(ctx, code)
	if err != nil {
		http.Redirect(w, r, cookie.ReturnURL(false), http.StatusSeeOther)
		return
	}
	if !token.Valid() {
		http.Redirect(w, r, cookie.ReturnURL(false), http.StatusSeeOther)
		return
	}

	http.Redirect(w, r, cookie.ReturnURL(true), http.StatusSeeOther)
}

type oauthCookie struct {
	State     string
	returnURL string
}

func (c *oauthCookie) ReturnURL(success bool) string {
	if !success {
		return c.returnURL + "#success=false"
	}
	return c.returnURL + "#success=true"
}

func oauthCookieToResponse(w http.ResponseWriter, cookie *oauthCookie) {
	http.SetCookie(w, &http.Cookie{
		Name:  OAUTH_COOKIE_STATE,
		Value: cookie.State,
	})
	http.SetCookie(w, &http.Cookie{
		Name:  OAUTH_COOKIE_RETURN,
		Value: cookie.returnURL,
	})
}

func oauthCookieFromRequest(r *http.Request) (*oauthCookie, error) {
	var cookieData oauthCookie

	cookie, err := r.Cookie(OAUTH_COOKIE_STATE)
	if err != nil {
		return nil, err
	}
	cookieData.State = cookie.Value

	cookie, err = r.Cookie(OAUTH_COOKIE_RETURN)
	if err != nil {
		return nil, err
	}
	cookieData.returnURL = cookie.Value

	return &cookieData, nil
}

func oauthCookieDelete(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   OAUTH_COOKIE_STATE,
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:   OAUTH_COOKIE_RETURN,
		MaxAge: -1,
	})
}
