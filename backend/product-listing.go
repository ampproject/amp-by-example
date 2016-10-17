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
	"html"
	"html/template"
	"io/ioutil"
	"net/http"
	"path"
	"strings"
)

const (
	SEARCH        = "search"
	ADD_TO_CART   = "add_to_cart"
	SHOPPING_CART = "shopping_cart"
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

func (p *Product) StarsAsHtml() template.HTML {
	return template.HTML(p.Stars)
}

type JsonRoot struct {
	Products []Product `json:"items"`
}

var products []Product

func InitProductListing() {
	initProducts(DIST_FOLDER + "/json/related_products.json")
	RegisterSample(SHOPPING_CART, renderShoppingCart)
	RegisterSample("samples_templates/product_listing", renderProductListing)
	RegisterSample("samples_templates/product", renderProduct)
	RegisterSampleEndpoint("samples_templates/product_listing", SEARCH, handleSearchRequest)
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

func renderShoppingCart(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w,
		ShoppingCartItem{
			Img:      html.UnescapeString(r.URL.Query().Get("img")),
			Name:     r.URL.Query().Get("name"),
			Price:    r.URL.Query().Get("price"),
			Quantity: r.URL.Query().Get("quantity"),
		},
	)
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
