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
	"encoding/json"
	"fmt"
	"net/http"
)

var discounts map[string]float32

func InitCheckout() {
	http.HandleFunc("/checkout/shopping-cart", handleShoppingCart)
	http.HandleFunc("/checkout/apply-code", handleApplyCode)
	discounts = make(map[string]float32)
}

func handleApplyCode(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	SetMaxAge(w, 0)
	if r.Method == "POST" {
		clientId := r.FormValue("clientId")
		discounts[clientId] = 0.8
		writeShoppingCart(w, r, clientId)
	}
}

func handleShoppingCart(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	SetContentTypeJson(w)
	SetMaxAge(w, 0)
	if r.Method == "GET" {
		clientId := r.URL.Query().Get("clientId")
		writeShoppingCart(w, r, clientId)
	}
}

func writeShoppingCart(w http.ResponseWriter, r *http.Request, clientId string) {
	w.Header().Set("Content-Type", "application/json")
	discount := discounts[clientId]
	if discount == 0 {
		discount = 1
	}
	total := 9.94 * discount
	cart := map[string]interface{}{
		"total": fmt.Sprintf("%.2f", total),
		"items": []interface{}{
			map[string]interface{}{
				"name":     "Item 1",
				"price":    "1.99",
				"quantity": "2",
			},
			map[string]interface{}{
				"name":     "Item 2",
				"price":    "2.99",
				"quantity": "1",
			},
			map[string]interface{}{
				"name":     "Item 3",
				"price":    "0.99",
				"quantity": "3",
			},
		},
	}
	if discount != 1 {
		cart["discount"] = "20%"
	}
	jsonString, _ := json.Marshal(cart)
	w.Write([]byte(jsonString))
}
