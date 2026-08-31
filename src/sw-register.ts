// Service worker registration — kept in a real module file so the page
// needs no inline scripts (required by the strict Content-Security-Policy).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
