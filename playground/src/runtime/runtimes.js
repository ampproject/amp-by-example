import amphtmlTemplate from './templates/amphtml.template.html';
import a4aTemplate from './templates/a4a.template.html';
import storyTemplate from './templates/story.template.html';
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
