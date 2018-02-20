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

import amphtmlTemplate from './templates/amphtml.template.html';
import a4aTemplate from './templates/a4a.template.html';
import storyTemplate from './templates/story.template.html';
import emailTemplate from './templates/email.template.html';
import events from '../events/events.js';
import params from '../params/base.js';


export const EVENT_SET_RUNTIME = 'event-set-runtime';

class Runtimes {
  constructor() {
    this.values = [{
      id: 'amphtml',
      name: 'AMPHTML',
      template: amphtmlTemplate,
      preview: {
        mode: 'devices',
        default: 'iPhone 7'
      },
      validator: 'AMP'
    },
    {
      id: 'amp4ads',
      name: 'AMP for Ads',
      template: a4aTemplate,
      preview: {
        mode: 'ads',
        default: 'Custom'
      },
      validator: 'AMP4ADS'
    },
    {
      id: 'amp4stories',
      name: 'AMP for Stories',
      preview: {
        mode: 'devices',
        default: 'iPhone 7'
      },
      validator: 'AMP',
      template: storyTemplate
    },
    {
      id: 'amp4email',
      name: 'AMP for Email',
      preview: {
        mode: 'devices',
        default: 'Responsive'
      },
      validator: 'AMP4EMAIL',
      template: emailTemplate
    }];
    events.subscribe(EVENT_SET_RUNTIME, runtime => this.activeRuntime = runtime);
  }

  init(id) {
    this.activeRuntime = this.get(params.get('runtime', 'amphtml'));
    events.publish(EVENT_SET_RUNTIME, this.activeRuntime);
  }

  get(id) {
    id = id.toLowerCase();
    const result = this.values.find(r => r.id === id);
    return result || this.values[0];
  }
}

export const runtimes = new Runtimes();
export default runtimes;
