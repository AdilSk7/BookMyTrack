// api.js
(function () {
  if (window.API_BASE) return; // allow manual override elsewhere

  const isLocal = (hostname) =>
    hostname === 'localhost' || hostname === '127.0.0.1';

  const base = isLocal(location.hostname)
    ? 'http://localhost:5000'
    : 'https://your-backend-domain.example.com'; // change this when you deploy

  window.API_BASE = base;
  console.log('[API_BASE]', window.API_BASE);
})();
