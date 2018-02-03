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

import events from './events.js';

describe(events, () => {

  it('notifies channel observers', () => { const observer = jasmine.createSpy('observer');
    const anEvent = 'an event';
    const anotherEvent = 'another event';
    events.subscribe('channel 1', observer);
    events.subscribe('channel 2', observer);
    events.publish('channel 1', anEvent);
    events.publish('channel 2', anEvent);
    expect(observer).toHaveBeenCalledWith(anEvent);
    expect(observer).not.toHaveBeenCalledWith(anotherEvent);
  });

  it('ignores other observers', () => {
    const observer = jasmine.createSpy('observer');
    const anEvent = 'an event';
    events.subscribe('a channel', observer);
    events.publish('another channel', anEvent);
    expect(observer).not.toHaveBeenCalled();
  });

  it('one observer can register for multiple events', () => {
    const observer = jasmine.createSpy('observer');
    const anEvent = 'an event';
    const anotherEvent = 'another event';
    events.subscribe(['channel 1', 'channel 2'], observer);
    events.publish('channel 1', anEvent);
    events.publish('channel 2', anotherEvent);
    expect(observer).toHaveBeenCalledWith(anEvent);
    expect(observer).toHaveBeenCalledWith(anotherEvent);
  });

});
