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

