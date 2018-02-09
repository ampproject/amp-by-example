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

class EventBus {

  constructor() {
    this._observers = new Map();
  }

  subscribe(channel, observer) {
    if (!channel) throw new Error('empty channel');
    const channels = Array.isArray(channel) ? channel : [channel];
    channels.forEach(c => {
      this._observersForChannel(c).push(observer);
    });
  }

  publish(channel, data) {
    if (!channel) throw new Error('empty channel');
    this._observersForChannel(channel).forEach(o => {
      o(data)
    });
  }

  _observersForChannel(channel) {
    let channelObservers = this._observers.get(channel);
    if (!channelObservers) {
      channelObservers = [];
      this._observers.set(channel, channelObservers);
    }
    return channelObservers;
  }
}

export default new EventBus();

