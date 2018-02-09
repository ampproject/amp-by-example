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
//
// source: https://github.com/WICG/EventListenerOptions/blob/gh-pages/EventListenerOptions.polyfill.js

(function() {
  var supportsPassive = false;
  document.createElement("div").addEventListener("test", function() {}, {
    get passive() {
      supportsPassive = true;
      return false;
    }
  });

  if (!supportsPassive) {
    var super_add_event_listener = EventTarget.prototype.addEventListener;
    var super_remove_event_listener = EventTarget.prototype.removeEventListener;
    var super_prevent_default = Event.prototype.preventDefault;

    function parseOptions(type, listener, options, action) {
      var needsWrapping = false;
      var useCapture = false;
      var passive = false;
      var fieldId;
      if (options) {
        if (typeof(options) === 'object') {
          passive = options.passive ? true : false;
          useCapture = options.useCapture ? true : false;
        } else {
          useCapture = options;
        }
      }
      if (passive)
        needsWrapping = true;
      if (needsWrapping) {
        fieldId = useCapture.toString();
        fieldId += passive.toString();
      }
      action(needsWrapping, fieldId, useCapture, passive);
    }

    Event.prototype.preventDefault = function() {
      if (this.__passive) {
        console.warn("Ignored attempt to preventDefault an event from a passive listener");
        return;
      }
      super_prevent_default.apply(this);
    }

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      var super_this = this;
      parseOptions(type, listener, options,
        function(needsWrapping, fieldId, useCapture, passive) {
          if (needsWrapping) {
            var fieldId = useCapture.toString();
            fieldId += passive.toString();

            if (!this.__event_listeners_options)
              this.__event_listeners_options = {};
            if (!this.__event_listeners_options[type])
              this.__event_listeners_options[type] = {};
            if (!this.__event_listeners_options[type][listener])
              this.__event_listeners_options[type][listener] = [];
            if (this.__event_listeners_options[type][listener][fieldId])
              return;
            var wrapped = {
              handleEvent: function (e) {
                e.__passive = passive;
                if (typeof(listener) === 'function') {
                  listener(e);
                } else {
                  listener.handleEvent(e);
                }
                e.__passive = false;
              }
            };
            this.__event_listeners_options[type][listener][fieldId] = wrapped;
            super_add_event_listener.call(super_this, type, wrapped, useCapture);
          } else {
            super_add_event_listener.call(super_this, type, listener, useCapture);
          }
        });
    }

    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      var super_this = this;
      parseOptions(type, listener, options,
        function(needsWrapping, fieldId, useCapture, passive) {
          if (needsWrapping &&
              this.__event_listeners_options &&
              this.__event_listeners_options[type] &&
              this.__event_listeners_options[type][listener] &&
              this.__event_listeners_options[type][listener][fieldId]) {
            super_remove_event_listener.call(super_this, type, this.__event_listeners_options[type][listener][fieldId], false);
            delete this.__event_listeners_options[type][listener][fieldId];
            if (this.__event_listeners_options[type][listener].length == 0)
              delete this.__event_listeners_options[type][listener];
          } else {
            super_remove_event_listener.call(super_this, type, listener, useCapture);
          }
        });
    }
  }
})();
