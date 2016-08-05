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
	"html/template"
	"net/http"
	"path"
	"strings"
)

const (
	SAMPLE_TEMPLATE_FOLDER = "/samples_templates"
	SEARCH                 = "search"
)

type ProductListingPage struct {
	Products     []Product
	SearchAction string
}

type Product struct {
	Name  string
	Image string
	URL   string
	Stars string
}

var products []Product

func InitProductListing() {
	products = make([]Product, 0)
	products = append(products,
		Product{"Nexus 5x",
			"/img/silver_nexus.png",
			"/samples_templates/product/preview/",
			"★★★★★"},
		Product{"Nexus 5x Case",
			"https://lh3.googleusercontent.com/O00xttgXZHWYdpiWi7K0y7J2kvBMRXwlumBQNLV1853AMtf7MBBMSJ_ug9MDyUxMNjyo",
			"#",
			"★★★★★"},
		Product{"Nexus 5x Folio",
			"https://lh3.googleusercontent.com/ttVsejKSBY5OLLDj38d1YddiBjkvK9BXqIOzIwa7thdWpMoAJzyhdfYixsl0G2Rx_W8",
			"#",
			"★"},
		Product{"Nexus 6P",
			"https://lh3.googleusercontent.com/meAtjplzh2B6G9n8kipX7vZ9cti4cUlk48ggRsWiCge1_b_6Ni2U9PFEs6l0RQSlvqGH",
			"#",
			"★★★★"},
		Product{"Speck CandyShell Grip Case for Nexus 6P",
			"https://lh3.googleusercontent.com/a_JFyb2hYBMd-NVaGZWq2piD6txa6cG3DV2KI2i3k59HRuYDZ8lXYe5m9zrACtFFIA_K",
			"#",
			"★★"},
		Product{"Chromecast Audio",
			"https://lh3.googleusercontent.com/ysmhjWszkLsyiWRJ97JZyL0oXL0HUzKXfhOgYC8wvLHhQUwr_dRADE1tBvUNzXPGrA",
			"#",
			"★★★★★"},
	)
	registerProductListingHandler("product_listing")
	registerProductListingHandler("product_listing/preview")
}

func registerProductListingHandler(sampleName string) {
	route := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName) + "/"
	http.HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
		renderProductListing(w, r, sampleName)
	})
	http.HandleFunc(route+SEARCH, func(w http.ResponseWriter, r *http.Request) {
		handleSearchRequest(w, r, sampleName)
	})
}

func renderProductListing(w http.ResponseWriter, r *http.Request, sampleName string) {
	productsToShow := searchProducts(r.URL.Query().Get(SEARCH))
	filePath := path.Join(DIST_FOLDER, SAMPLE_TEMPLATE_FOLDER, sampleName, "index.html")
	t, _ := template.ParseFiles(filePath)
	w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate", MAX_AGE_IN_SECONDS))
	t.Execute(w, ProductListingPage{Products: productsToShow, SearchAction: path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName, SEARCH)})
}

func searchProducts(query string) []Product {
	if query == "" {
		return products
	}
	query = strings.ToLower(query)
	var searchResultProducts []Product
	for _, product := range products {
		productName := strings.ToLower(product.Name)
		if strings.Contains(productName, query) {
			searchResultProducts = append(searchResultProducts, product)
		}
	}
	return searchResultProducts
}

func handleSearchRequest(w http.ResponseWriter, r *http.Request, sampleName string) {
	if r.Method != "POST" {
		http.Error(w, "post only", http.StatusMethodNotAllowed)
		return
	}
	route := path.Join(SAMPLE_TEMPLATE_FOLDER, sampleName, "?"+SEARCH+"=")
	http.Redirect(w, r, route+r.FormValue(SEARCH), http.StatusSeeOther)

}
