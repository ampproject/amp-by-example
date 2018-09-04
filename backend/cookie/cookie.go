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

package cookie

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
)

func Set(w http.ResponseWriter, name string, value interface{}) error {
	dataJson, err := json.Marshal(value)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    base64.RawStdEncoding.EncodeToString(dataJson),
		Path:     "/",
		HttpOnly: true,
	})
	return nil
}

func Get(r *http.Request, name string, out interface{}) error {
	cookie, err := r.Cookie(name)
	if err != nil {
		return err
	}
	data, err := base64.RawStdEncoding.DecodeString(cookie.Value)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, out); err != nil {
		return err
	}
	return nil
}

func Clear(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}
