// install serviceWorker
if ('requestIdleCallback' in window && navigator.serviceWorker) {
  window.onload = () => {
    window.requestIdleCallback(() => {
      console.log('registering service worker');
      navigator.serviceWorker.register('/sw.js')
        .catch(err => {
          console.error('Unable to register service worker.', err);
        });
    });
  };
}

