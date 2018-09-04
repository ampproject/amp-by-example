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

package oauth

import (
	"backend/cookie"
	"backend/util"

	"net/http"
	"strconv"

	"golang.org/x/oauth2"
	"google.golang.org/appengine"
)

const (
	OAUTH_COOKIE = "oauth2_cookie"
)

func loginForConfig(w http.ResponseWriter, r *http.Request, config *oauth2.Config) {
	returnURL := r.URL.Query().Get("return")
	if returnURL == "" {
		http.Error(w, "Missing return URL", http.StatusBadRequest)
		return
	}

	state := util.RandomString(8)
	url := config.AuthCodeURL(state)

	cookieData := &oauthCookie{
		State:     state,
		ReturnURL: returnURL,
	}
	if err := cookie.Set(w, OAUTH_COOKIE, cookieData); err != nil {
		http.Error(w, "Failed to set cookie", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, url, http.StatusFound)
}

func callbackForConfig(w http.ResponseWriter, r *http.Request, config *oauth2.Config, provider string) {
	query := r.URL.Query()

	var cookieData oauthCookie
	if err := cookie.Get(r, OAUTH_COOKIE, &cookieData); err != nil {
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
		cookie.Clear(w, OAUTH_COOKIE)
		http.Redirect(w, r, cookieData.generateReturnURL(false), http.StatusFound)
		return
	}
	if !token.Valid() {
		cookie.Clear(w, OAUTH_COOKIE)
		http.Redirect(w, r, cookieData.generateReturnURL(false), http.StatusFound)
		return
	}

	url := cookieData.generateReturnURL(true)
	cookieData = oauthCookie{
		LoggedInWith: provider,
		Token:        token,
	}
	if err := cookie.Set(w, OAUTH_COOKIE, &cookieData); err != nil {
		http.Error(w, "Failed to set cookie", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, url, http.StatusFound)
}

func GetToken(r *http.Request) *oauth2.Token {
	var cookieData oauthCookie
	if err := cookie.Get(r, OAUTH_COOKIE, &cookieData); err != nil {
		return nil
	}
	if !cookieData.Token.Valid() {
		return nil
	}
	return cookieData.Token
}

func Logout(w http.ResponseWriter, r *http.Request) {
	returnURL := r.URL.Query().Get("return")
	if returnURL == "" {
		http.Error(w, "Missing return URL", http.StatusBadRequest)
		return
	}
	returnURL += "#success=true"

	cookie.Clear(w, OAUTH_COOKIE)
	http.Redirect(w, r, returnURL, http.StatusFound)
}

type oauthCookie struct {
	State        string
	ReturnURL    string
	LoggedInWith string
	Token        *oauth2.Token
}

func (c *oauthCookie) generateReturnURL(success bool) string {
	return c.ReturnURL + "#success=" + strconv.FormatBool(success)
}
