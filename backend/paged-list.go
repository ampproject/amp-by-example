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
	"strconv"
)

const (
	PAGED_LIST_SAMPLE_PATH = "/" + CATEGORY_ADVANCED + "/paged_list/"
	MAX_PAGE_COUNT         = 5
	ITEMS_PER_PAGE         = 4
)

type ProductListing struct {
	Title string `json:"title"`
	Image string `json:"image"`
	Copy  string `json:"copy"`
}

type PagedResponse struct {
	CurrentPage int              `json:"currentPage"`
	PageCount   int              `json:"pageCount"`
	Products    []ProductListing `json:"products"`
}

type AmpListResponse struct {
	Items PagedResponse `json:"items"`
}

func GeneratePagedResponse(page int) AmpListResponse {
	IMAGES := []string{
		"/img/product1_640x426.jpg",
		"/img/product2_640x426.jpg",
		"/img/product3_640x426.jpg",
		"/img/product4_640x426.jpg",
		"/img/product5_640x408.jpg",
		"/img/product6_640x424.jpg",
	}

	response := PagedResponse{}
	response.CurrentPage = page
	response.PageCount = MAX_PAGE_COUNT
	response.Products = make([]ProductListing, 0)

	for i := 0; i < ITEMS_PER_PAGE; i++ {
		itemIndex := ITEMS_PER_PAGE*(page-1) + i + 1
		item := ProductListing{
			Image: IMAGES[itemIndex%len(IMAGES)],
			Title: fmt.Sprintf("Food %d", itemIndex),
			Copy:  fmt.Sprintf("Lorem ipsum dolor sit %d amet consequitur sine nice fun", itemIndex),
		}
		response.Products = append(response.Products, item)
	}

	ampListResponse := AmpListResponse{
		Items: response,
	}

	return ampListResponse
}

func InitPagedListSample() {
	RegisterHandler(PAGED_LIST_SAMPLE_PATH+"search", func(w http.ResponseWriter, r *http.Request) {
		pageString := r.URL.Query().Get("page")
		if pageString == "" {
			pageString = "1"
		}
		page, _ := strconv.Atoi(pageString)

		if page <= MAX_PAGE_COUNT && page > 0 {
			response := GeneratePagedResponse(page)
			SendJsonResponse(w, &response)
		} else {
			SendJsonResponse(w, map[string]string{
				"error": "Invalid page",
			})
		}
	})
}
