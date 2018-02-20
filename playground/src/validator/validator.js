// Copyright 2018 The AMPHTML Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import events from '../events/events.js';
import lazyLoad from '../lazy-load/base.js';
import {runtimes, EVENT_SET_RUNTIME} from '../runtime/runtimes.js';

const DEFAULT_VALIDATOR_URL = 'https://cdn.ampproject.org/v0/validator.js';

export const NO_ERRORS = {
  errors: [],
  status: 'PASS'
};

export const NO_VALIDATOR = {
  errors: [],
  status: 'NO_VALIDATOR'
};

export const EVENT_NEW_VALIDATION_RESULT = 'event-validator-new-validation-result';

export function createValidator() {
  return new Validator();
}

class Validator {

  constructor() {
    events.subscribe(EVENT_SET_RUNTIME, this._setRuntime.bind(this));
  }

  validate(string) {
    if (!string || !this.validatorPromise) {
      return;
    }
    this.validatorPromise.then(() => {
      if (!this.runtime.validator) {
        events.publish(EVENT_NEW_VALIDATION_RESULT, NO_VALIDATOR);
        return;
      }
      const validationResult = amp.validator.validateString(string, this.runtime.validator);
      this.processErrors(validationResult);
      events.publish(EVENT_NEW_VALIDATION_RESULT, validationResult);
    });
  }

  _setRuntime(runtime) {
    this.runtime = runtime;
    events.publish(EVENT_NEW_VALIDATION_RESULT, NO_ERRORS);
    const validatorUrl = runtime.validatorUrl || DEFAULT_VALIDATOR_URL;
    this.validatorPromise = lazyLoad(validatorUrl);
  }

  processErrors(validationResult) {
    validationResult.errors.forEach(error => {
      error.message = amp.validator.renderErrorMessage(error);
      error.category = amp.validator.categorizeError(error);
      error.icon = error.severity.toLowerCase();
      error.isError = error.severity === 'ERROR';
      error.isWarning = error.severity === 'WARNING';
    });
  }
}
