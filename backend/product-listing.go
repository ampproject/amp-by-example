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
	"html"
	"html/template"
	"io/ioutil"
	"net/http"
	"path"
	"strings"
)

const (
	SEARCH                 = "search"
	ADD_TO_CART            = "add_to_cart"
	SHOPPING_CART          = "shopping_cart"
)

type ProductListingPage struct {
	Title        string
	Products     []Product
	SearchAction string
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

type ShoppingCartProduct struct {
	Img         string `json:"img"`
	Name        string `json:"name"`
	Price       string `json:"price"`
	Quantity    string `json:"quantity"`
}

func (p *Product) StarsAsHtml() template.HTML {
	return template.HTML(p.Stars)
}

type JsonRoot struct {
	Products []Product `json:"items"`
}

var products []Product
var productListingTemplate template.Template

func InitProductListing() {
	initProducts(DIST_FOLDER + "/json/related_products.json")
	registerProductListingHandler("product_listing")
	registerProductListingHandler("product_listing/preview")
	registerShoppingCartHandler(SHOPPING_CART)
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

func registerProductListingHandler(sampleName string) {
	filePath := path.Join(DIST_FOLDER, SAMPLE_TEMPLATE_FOLDER, sampleName, "index.html")
	template, err := template.New("index.html").Delims("[[", "]]").ParseFiles(filePath)
	if err != nil {
		panic(err)
	}
	route := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName) + "/"
	http.HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
		renderProductListing(w, r, sampleName, *template)
	})
	http.HandleFunc(route+SEARCH, func(w http.ResponseWriter, r *http.Request) {
		handleSearchRequest(w, r, sampleName)
	})

}

func registerShoppingCartHandler(sampleName string) {
	filePath := path.Join(DIST_FOLDER, sampleName, "index.html")
	t, err := template.ParseFiles(filePath)
	if err != nil {
		panic(err)
	}
	http.HandleFunc("/"+sampleName, func(w http.ResponseWriter, r *http.Request) {
		quantity := r.URL.Query().Get("quantity")
		price := r.URL.Query().Get("price")
		img := r.URL.Query().Get("img")
		name := r.URL.Query().Get("name")
		t.Execute(w, ShoppingCartProduct{html.UnescapeString(img), name, price, quantity})
	})
}

func renderProductListing(w http.ResponseWriter, r *http.Request, sampleName string, t template.Template) {
	productListing := searchProducts(sampleName, r.URL.Query().Get(SEARCH))
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	t.Execute(w, productListing)
}

func searchProducts(sampleName string, query string) ProductListingPage {
	var title string
	var result []Product
	if query == "" {
		title = "Fruits"
		result = products
	} else {
		title = "Search Results for '" + query + "'"
		query = strings.ToLower(query)
		for _, product := range products {
			productName := strings.ToLower(product.Name)
			if strings.Contains(productName, query) {
				result = append(result, product)
			}
		}
	}
	searchAction := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName, query)
	return ProductListingPage{Title: title, Products: result, SearchAction: searchAction}
}

func handleSearchRequest(w http.ResponseWriter, r *http.Request, sampleName string) {
	if !isFormPostRequest(r.Method, w) {
		return
	}
	route := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName, "?"+SEARCH+"=") + r.FormValue(SEARCH)
	http.Redirect(w, r, route, http.StatusSeeOther)
}
