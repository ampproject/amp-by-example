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

import runtimes from './runtimes.js';

const STORY_REGEX = /<amp-story\s+standalone\s*>/i;
const AMPHTML_AD_REGEX = /amp4ads-boilerplate/i;
const EMAIL_REGEX = /amp4email-boilerplate/i;

const detectRuntime = string => {
  if (string.match(STORY_REGEX)) {
    return runtimes.get('amp4stories');
  }
  if (string.match(AMPHTML_AD_REGEX)) {
    return runtimes.get('amp4ads');
  }
  if (string.match(EMAIL_REGEX)) {
    return runtimes.get('amp4email');
  }
  return runtimes.get('amphtml');
};

export default detectRuntime;
