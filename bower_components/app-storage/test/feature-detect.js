(function(){

  onmessage = function(e) {
    if (e.data != 'featureDetect') {
      return;
    }

    if (self.indexedDB == null || self.indexedDB === undefined ||
        self.Promise === undefined) {
      self.postMessage('fail');
      return;
    }

    var timeout = self.setTimeout(function() { self.postMessage('fail'); },
        1000);

    self.addEventListener('testWorkerEvents', function() {
      self.postMessage('pass');
      self.clearTimeout(timeout);
    });

    try {
      var EventConstructor =
          self.CustomEvent ||
          self.Event ||
          // NOTE(cdata): Have mercy on my soul..
          event.__proto__.__proto__.constructor;

      var testWorkerEvents = new EventConstructor('testWorkerEvents');
      self.dispatchEvent(testWorkerEvents);
      return;

    } catch(e) {
      self.postMessage('fail');
    }
  }
}())