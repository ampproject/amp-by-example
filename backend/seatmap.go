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
	"io/ioutil"
	"net/http"
)

type Seat struct {
	Id           string  `json:"id"`
	Standard     bool    `json:"standard"`
	X            float64 `json:"x"`
	Y            float64 `json:"y"`
	Rx           string  `json:"rx"`
	Ry           string  `json:"ry"`
	Height       float64 `json:"height"`
	Width        float64 `json:"width"`
	Wheelchair   bool    `json:"wheelchair"`
	Availability bool    `json:"availability"`
}

type SeatJsonRoot struct {
	Seats  []Seat  `json:"seats"`
	Height float64 `json:"height"`
	Width  float64 `json:"width"`
}

var seats []Seat
var seatsRoot SeatJsonRoot

func InitSeatmapPage() {
	initSeatmap(DIST_FOLDER + "/json/seats.json")
	RegisterSample("advanced/seatmap", renderSeatmap)
}

func renderSeatmap(w http.ResponseWriter, r *http.Request, page Page) {
	page.Render(w, SeatJsonRoot{
		Seats:  seatsRoot.Seats,
		Height: seatsRoot.Height,
		Width:  seatsRoot.Width,
	})
}

func initSeatmap(path string) {
	seatmapFile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}
	var root SeatJsonRoot
	err = json.Unmarshal(seatmapFile, &root)
	if err != nil {
		panic(err)
	}
	seatsRoot = root
	seats = root.Seats
}
