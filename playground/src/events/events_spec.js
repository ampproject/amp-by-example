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
