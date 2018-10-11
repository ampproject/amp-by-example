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

	"net/http"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/appengine"
)

const (
	CLIENT_SECRET_GOOGLE_FILENAME = "google_client_secret.json"
)

var (
	oauthGoogleScopes = []string{"openid", "profile"}
	oauthGoogleConfig *oauth2.Config
)

func GoogleLogin(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := fetchOauthGoogleConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	loginForConfig(w, r, config)
}

func GoogleCallback(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	config, err := fetchOauthGoogleConfig(ctx)
	if err != nil {
		http.Error(w, "Failed to get OAuth2 config", http.StatusInternalServerError)
		return
	}

	callbackForConfig(w, r, config, "google")
}

func fetchOauthGoogleConfig(ctx context.Context) (*oauth2.Config, error) {
	if oauthGoogleConfig != nil {
		return oauthGoogleConfig, nil
	}

	secret, err := datastore.ReadFile(ctx, CLIENT_SECRET_GOOGLE_FILENAME)
	if err != nil {
		return nil, err
	}

	oauthGoogleConfig, err = google.ConfigFromJSON(secret, oauthGoogleScopes...)
	if err != nil {
		return nil, err
	}

	return oauthGoogleConfig, nil
}
