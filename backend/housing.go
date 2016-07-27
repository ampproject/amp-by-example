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
	"math"
	"net/http"
	"strconv"
	"strings"
)

const (
	ERROR_CASE_HOUSING  = "error"
	HOUSING_SAMPLE_PATH = "/samples_templates/housing/"
)

type MortgageForm struct {
	Price    int
	Deposit  int
	Interest float64
	Period   int
}

func InitHousingForm() {
	http.HandleFunc(HOUSING_SAMPLE_PATH+"calculate-mortgage-xhr", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, calculateMortgageXHR)
	})
	http.HandleFunc(HOUSING_SAMPLE_PATH+"calculate-mortgage", func(w http.ResponseWriter, r *http.Request) {
		handlePost(w, r, calculateMortgage)
	})
}

func calculateMonthlyPayment(mortgageForm MortgageForm) float64 {

	monthlyInterestRateDecimal := (mortgageForm.Interest / 12) / 100
	numberOfMonthlyPayments := float64(mortgageForm.Period * 12)
	amountBorrowed := float64(mortgageForm.Price - mortgageForm.Deposit)
	monthlyPayment := (monthlyInterestRateDecimal * amountBorrowed * math.Pow((1+monthlyInterestRateDecimal), numberOfMonthlyPayments)) / (math.Pow((1+monthlyInterestRateDecimal), numberOfMonthlyPayments) - 1)

	return monthlyPayment
}

func parseForm(r *http.Request) (MortgageForm, error) {

	price, priceErr := strconv.Atoi(r.FormValue("price"))
	deposit, depositErr := strconv.Atoi(r.FormValue("deposit"))
	interest, interestErr := strconv.ParseFloat(r.FormValue("annual_interest"), 64)
	period, periodErr := strconv.Atoi(r.FormValue("repayment_period"))

	// can't return nil in place of a struct, so creating one in case there are errors
	mortgageForm := MortgageForm{price, deposit, interest, period}

	err := parseFormErrors(priceErr, depositErr, interestErr, periodErr)
	if err != nil {
		return mortgageForm, err
	}

	return mortgageForm, nil
}

func parseFormErrors(priceErr error, depositErr error, interestErr error, periodErr error) error {
	var errors []string
	appendError(priceErr, errors)
	appendError(depositErr, errors)
	appendError(interestErr, errors)
	appendError(periodErr, errors)

	if errors != nil {
		return fmt.Errorf(strings.Join(errors, "\n"))
	}
	return nil
}

func appendError(anError error, errors []string) {
	if anError != nil {
		errors = append(errors, anError.Error())
	}
}

func calculateMortgageXHR(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("AMP-Access-Control-Allow-Source-Origin", buildSourceOrigin(r.Host))
	w.Header().Set("Content-Type", "application/json")
	response := ""
	mortgageForm, err := parseForm(r)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		response = fmt.Sprintf("{\"err\":\"%s\"}", err)
		w.Write([]byte(response))
	}
	monthlyPayment := calculateMonthlyPayment(mortgageForm)
	response = fmt.Sprintf("{\"monthly_repayment\":\"£%.2f\"}", monthlyPayment)
	w.Write([]byte(response))
}

func calculateMortgage(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusBadRequest)
}
