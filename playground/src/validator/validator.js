import events from '../events/events.js';
import lazyLoad from '../lazy-load/base.js';
import {runtimes, EVENT_SET_RUNTIME} from '../runtime/runtimes.js';

const validatorPromise = lazyLoad('https://cdn.ampproject.org/v0/validator.js');

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
    validatorPromise.then(() => {
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
