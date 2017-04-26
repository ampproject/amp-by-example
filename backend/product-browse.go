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
	"io"
	"io/ioutil"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"
)

const (
	SEARCH           = "search"
	SHOPPING_CART    = "shopping_cart"
	ADD_TO_CART_PATH = "/samples_templates/product_page/add_to_cart"
	ABE_CLIENT_ID    = "ABE_CLIENT_ID"
)

type ProductBrowsePage struct {
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
	Name  string `json:"name"`
	Price string `json:"price"`
	Color string `json:"color"`
	Size  string `json:"size"`
}

func (p *Product) StarsAsHtml() template.HTML {
	return template.HTML(p.Stars)
}

type JsonRoot struct {
	Products []Product `json:"items"`
}

var products []Product
var cache *LRUCache

func InitProductBrowse() {
	initProducts(DIST_FOLDER + "/json/related_products.json")
	RegisterSample(SHOPPING_CART, gotToShoppingCart)
	RegisterSample("samples_templates/product_browse_page", renderProductBrowsePage)
	RegisterSample("samples_templates/product_page", renderProduct)
	RegisterSampleEndpoint("samples_templates/product_browse_page", SEARCH, handleSearchRequest)
	http.HandleFunc(ADD_TO_CART_PATH, func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, addToCart)
	})
	cache = NewLRUCache(100)
}

func addToCart(w http.ResponseWriter, r *http.Request) {
	EnableCors(w, r)
	clientId := r.FormValue("clientId")
	if clientId == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// configure post form redirect
	w.Header().Set("Access-Control-Expose-Headers", "AMP-Access-Control-Allow-Source-Origin,AMP-Redirect-To")
	w.Header().Set("AMP-Redirect-To", GetHost(r)+"/shopping_cart/?clientid="+clientId)

	// create a new shopping cart if one doesn't exist yet
	value, shoppingCartIsInCache := cache.Get(clientId)
	var shoppingCart map[ShoppingCartItem]int
	if shoppingCartIsInCache {
		shoppingCart, _ = value.(map[ShoppingCartItem]int)
	} else {
		shoppingCart = make(map[ShoppingCartItem]int)
		cache.Add(clientId, shoppingCart)
	}
	// extract item values (these are usually stored in your db)
	name := r.FormValue("name")
	color := r.FormValue("color")
	price := r.FormValue("price")
	size := r.FormValue("size")
	// update the quantity
	quantity, err := strconv.Atoi(r.FormValue("quantity"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	shoppingCartItem := ShoppingCartItem{name, price, color, size}
	shoppingCart[shoppingCartItem] = shoppingCart[shoppingCartItem] + quantity
	// amp-form requires a json result
	io.WriteString(w, "{}")
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
	// remove CLIENT_ID from URL
	route = strings.Split(route, "?")[0]

	http.Redirect(w, r, route, http.StatusFound)
}

func renderShoppingCart(w http.ResponseWriter, r *http.Request, page Page, clientId string) {
	cookie, err := r.Cookie(ABE_CLIENT_ID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		response := fmt.Sprintf("{\"error\":\"%s\"}", err)
		w.Write([]byte(response))
	}
	shoppingCart, exists := cache.Get(cookie.Value)
	if !exists {
		http.Error(w, http.StatusText(404), 404)
		return
	}
	page.Render(w, shoppingCart)
}

func gotToShoppingCart(w http.ResponseWriter, r *http.Request, page Page) {
	// remove the clientid from the URL to avoid accidental sharing
	clientId := r.URL.Query().Get("clientid")
	if clientId != "" {
		redirectToShoppingCart(w, r, page, clientId)
	} else {
		renderShoppingCart(w, r, page, clientId)
	}
}

func renderProduct(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, ProductPage{Mode: page.Mode})
}

func renderProductBrowsePage(w http.ResponseWriter, r *http.Request, page Page) {
	productBrowse := searchProducts(page, r.URL.Query().Get(SEARCH))
	page.Render(w, productBrowse)
}

func searchProducts(page Page, query string) ProductBrowsePage {
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
	return ProductBrowsePage{
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
