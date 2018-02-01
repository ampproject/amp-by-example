// https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/
export const init = () => {
  // Initialize the command queue in case analytics.js hasn't loaded yet.
  window.ga = window.ga || ((...args) => (ga.q = ga.q || []).push(args));

  ga('create', 'UA-73836974-1', 'auto');
  ga('set', 'transport', 'beacon');
  ga('send', 'pageview');
};
