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
	"backend/oauth"

	"net/http"
)

const (
	OAUTH_BASE = "/oauth/"
)

func InitOAuth() {
	RegisterHandler(OAUTH_BASE+"login/google", oauth.GoogleLogin)
	RegisterHandler(OAUTH_BASE+"callback/google", oauth.GoogleCallback)
	RegisterHandler(OAUTH_BASE+"login/github", oauth.GitHubLogin)
	RegisterHandler(OAUTH_BASE+"callback/github", oauth.GitHubCallback)
	RegisterHandler(OAUTH_BASE+"login/facebook", oauth.FacebookLogin)
	RegisterHandler(OAUTH_BASE+"callback/facebook", oauth.FacebookCallback)
	RegisterHandler(OAUTH_BASE+"status", oauthStatus)
	RegisterHandler(OAUTH_BASE+"logout", oauth.Logout)
}

func oauthStatus(w http.ResponseWriter, r *http.Request) {
	name := oauth.GetUserName(r)
	SendJsonResponse(w, map[string]interface{}{
		"loggedIn": name != "",
		"name":     name,
	})
}
