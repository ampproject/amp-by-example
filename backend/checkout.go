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
	"fmt"
	"net/http"
)

const SHOPPING_CART_TOTAL = 9.94

var discounts map[string]float32

func InitCheckout() {
	RegisterHandler("/checkout/shopping-cart", handleShoppingCart)
	RegisterHandler("/checkout/apply-code", handleApplyCode)
	discounts = make(map[string]float32)
}

func handleApplyCode(w http.ResponseWriter, r *http.Request) {
	SetMaxAge(w, 0)
	if r.Method == "POST" {
		clientId := r.FormValue("clientId")
		discounts[clientId] = 0.2
		writeShoppingCart(w, r, clientId)
	}
}

func handleShoppingCart(w http.ResponseWriter, r *http.Request) {
	SetMaxAge(w, 0)
	if r.Method == "GET" {
		clientId := r.URL.Query().Get("clientId")
		writeShoppingCart(w, r, clientId)
	}
}

func writeShoppingCart(w http.ResponseWriter, r *http.Request, clientId string) {
	discount := discounts[clientId]
	total := SHOPPING_CART_TOTAL - SHOPPING_CART_TOTAL*discount
	cart := createShoppingCart()
	cart["total"] = fmt.Sprintf("%.2f", total)
	if discount > 0 {
		cart["discount"] = fmt.Sprintf("%g%%", (discount * 100))
	}
	SendJsonResponse(w, cart)
}

func createShoppingCart() map[string]interface{} {
	return map[string]interface{}{
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
}
