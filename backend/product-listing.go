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
	"html/template"
	"io/ioutil"
	"net/http"
	"path"
	"strings"
	"time"
)

const (
	SEARCH           = "search"
	SHOPPING_CART    = "shopping_cart"
	ADD_TO_CART_PATH = "/samples_templates/product/add_to_cart"
	ABE_CLIENT_ID    = "ABE_CLIENT_ID"
)

type ProductListingPage struct {
	Title        string
	Products     []Product
	SearchAction string
	Mode         string
}

type ProductPage struct {
	Mode string
}

type Product struct {
	Id          int    `json:"id"`
	Img         string `json:"img"`
	Name        string `json:"name"`
	Price       string `json:"price"`
	Stars       string `json:"stars"`
	Attribution string `json:"attribution"`
	Url         string `json:"url"`
}

type ShoppingCartItem struct {
	Img      string `json:"img"`
	Name     string `json:"name"`
	Price    string `json:"price"`
	Quantity string `json:"quantity"`
}

type ShoppingCart struct {
	ShoppingCart []ShoppingCartItem
}

func (p *Product) StarsAsHtml() template.HTML {
	return template.HTML(p.Stars)
}

type JsonRoot struct {
	Products []Product `json:"items"`
}

var products []Product
var cache *ShoppingCartCache

func InitProductListing() {
	initProducts(DIST_FOLDER + "/json/related_products.json")
	RegisterSample(SHOPPING_CART, gotToShoppingCart)
	RegisterSample("samples_templates/product_listing", renderProductListing)
	RegisterSample("samples_templates/product", renderProduct)
	RegisterSampleEndpoint("samples_templates/product_listing", SEARCH, handleSearchRequest)
	http.HandleFunc(ADD_TO_CART_PATH, func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, addToCart)
	})
	cache = NewShoppingCartCache(100)
}

func addToCart(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	response := ""
	name := r.FormValue("name")
	quantity := r.FormValue("quantity")
	clientId := r.FormValue("clientId")
	img := r.FormValue("img")
	price := r.FormValue("price")

	shoppingCartItem := ShoppingCartItem{
		Img:      img,
		Name:     name,
		Price:    price,
		Quantity: quantity,
	}

	shoppingCartItems := []ShoppingCartItem{shoppingCartItem}
	cache.Add(clientId, ShoppingCart{ShoppingCart: shoppingCartItems})

	if clientId != "" {
		response = fmt.Sprintf("{\"ClientId\":\"%s\"}", clientId)
		w.Write([]byte(response))
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
}

func initProducts(path string) {
	productsFile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	var root JsonRoot
	err = json.Unmarshal(productsFile, &root)
	if err != nil {
		panic(err)
	}
	products = root.Products
}

func redirectToShoppingCart(w http.ResponseWriter, r *http.Request, page Page, clientId string) {
	expireInOneDay := time.Now().AddDate(0, 0, 1)
	cookie := &http.Cookie{
		Name:    ABE_CLIENT_ID,
		Expires: expireInOneDay,
		Value:   clientId,
	}
	http.SetCookie(w, cookie)
	route := page.Route
	route = strings.Split(route, "?")[0]

	http.Redirect(w, r, avoidCacheForRoute(route), http.StatusFound)
}

func renderShoppingCart(w http.ResponseWriter, r *http.Request, page Page, clientId string) {
	cookie, err := r.Cookie(ABE_CLIENT_ID)
	if err != nil {
		return
	}
	shoppingCart, _ := cache.Get(cookie.Value)
	shoppingCartItem := shoppingCart.ShoppingCart[0]
	page.Render(w, shoppingCartItem)
}

func gotToShoppingCart(w http.ResponseWriter, r *http.Request, page Page) {
	clientId := r.FormValue("clientId")
	if clientId != "" {
		redirectToShoppingCart(w, r, page, clientId)
	} else {
		renderShoppingCart(w, r, page, clientId)
	}
}

func renderProduct(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, ProductPage{Mode: page.Mode})
}

func renderProductListing(w http.ResponseWriter, r *http.Request, page Page) {
	productListing := searchProducts(page, r.URL.Query().Get(SEARCH))
	page.Render(w, productListing)
}

func searchProducts(page Page, query string) ProductListingPage {
	var title string
	var result []Product
	if query == "" {
		title = "Fruits"
		result = products
	} else {
		title = "Search Results for '" + query + "'"
		result = findProducts(query)
	}
	searchAction := path.Join(page.Route, query)
	return ProductListingPage{
		Title:        title,
		Products:     result,
		SearchAction: searchAction,
		Mode:         page.Mode,
	}
}

func findProducts(query string) []Product {
	query = strings.ToLower(query)
	var result []Product
	for _, product := range products {
		productName := strings.ToLower(product.Name)
		if strings.Contains(productName, query) {
			result = append(result, product)
		}
	}
	return result
}

func handleSearchRequest(w http.ResponseWriter, r *http.Request, page Page) {
	route := page.Route + "?" + SEARCH + "=" + r.FormValue(SEARCH)
	http.Redirect(w, r, route, http.StatusSeeOther)
}
