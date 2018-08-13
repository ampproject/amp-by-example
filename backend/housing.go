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
)

const (
	ERROR_CASE_HOUSING  = "error"
	HOUSING_SAMPLE_PATH = "/" + CATEGORY_SAMPLE_TEMPLATES + "/housing/"
)

type MortgageForm struct {
	Price    int
	Deposit  int
	Interest float64
	Period   int
}

func InitHousingForm() {
	RegisterHandler(HOUSING_SAMPLE_PATH+"calculate-mortgage-xhr", calculateMortgageXHR)
	RegisterHandler(HOUSING_SAMPLE_PATH+"calculate-mortgage", calculateMortgage)
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
	err := parseFormErrors([]error{priceErr, depositErr, interestErr, periodErr})
	return mortgageForm, err
}

func calculateMortgageXHR(w http.ResponseWriter, r *http.Request) {
	mortgageForm, err := parseForm(r)
	if err != nil {
		SendJsonError(w, http.StatusBadRequest, map[string]string{
			"err": err.Error(),
		})
		return
	}
	monthlyPayment := calculateMonthlyPayment(mortgageForm)
	SendJsonResponse(w, map[string]string{
		"monthly_repayment": fmt.Sprintf("£%.2f", monthlyPayment),
	})
}

func calculateMortgage(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusBadRequest)
}
