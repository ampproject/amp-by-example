export default function lazyLoad(scriptUrl) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptUrl;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}
