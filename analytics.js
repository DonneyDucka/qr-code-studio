/* Privacy-friendly analytics loader (cookie-free).
 * Set CF_ANALYTICS_TOKEN in config.js to your Cloudflare Web Analytics token
 * (Dashboard > Analytics & Logs > Web Analytics > add site > copy token).
 * Cloudflare Web Analytics is free, GDPR-friendly, and uses no cookies. */
(function () {
  var token = (window.QRSTUDIO_CONFIG || {}).CF_ANALYTICS_TOKEN;
  if (!token) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: token }));
  document.head.appendChild(s);
})();
