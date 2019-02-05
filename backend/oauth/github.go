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
	"backend/datastore"
	"encoding/json"

	"net/http"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"google.golang.org/appengine"
)

const (
	CLIENT_SECRET_GITHUB_FILENAME = "github_client_secret.json"
)

var (
	oauthGitHubScopes = []string{"openid", "profile"}
	oauthGitHubConfig *oauth2.Config
)

func GitHubLogin(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := fetchOauthGitHubConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	loginForConfig(w, r, config)
}

func GitHubCallback(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := fetchOauthGitHubConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	callbackForConfig(w, r, config, "github")
}

func fetchOauthGitHubConfig(ctx context.Context) (*oauth2.Config, error) {
	if oauthGitHubConfig != nil {
		return oauthGitHubConfig, nil
	}

	secretJSON, err := datastore.ReadFile(ctx, CLIENT_SECRET_GITHUB_FILENAME)
	if err != nil {
		return nil, err
	}

	var secret map[string]string
	err = json.Unmarshal(secretJSON, &secret)
	if err != nil {
		return nil, err
	}

	oauthGitHubConfig = &oauth2.Config{
		ClientID:     secret["client_id"],
		ClientSecret: secret["client_secret"],
		RedirectURL:  secret["redirect_uri"],
		Scopes:       oauthGitHubScopes,
		Endpoint:     github.Endpoint,
	}

	return oauthGitHubConfig, nil
}
