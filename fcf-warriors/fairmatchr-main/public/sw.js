/* ==========================================================================
   sw.js — the "service worker": a little background helper the browser runs so
   the app installs on a phone and still opens offline.
   --------------------------------------------------------------------------
   Strategy (kept simple, and safe for a single-page app):
   - Cache the app's SHELL (the one page + its styles, script, icons).
   - PAGE navigations: try the network first, fall back to the cached shell
     when offline. (Network-first avoids the classic bug where a stale cached
     page hangs after you deploy an update.)
   - Static files (css/js/icons): serve from cache, fall back to network.
   - API calls (/api/...): always go to the network — they need live data.
   Bump CACHE_VERSION whenever you change files so phones pick up the update.
   ========================================================================== */
const CACHE_VERSION = "fcf-warriors-v1";
const SHELL = [
  "/",
  "/theme.css", "/styles.css", "/app.js", "/questions.js",
  "/manifest.json", "/icon.svg", "/icon-192.png", "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                       // only cache reads
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;           // never cache API calls

  // Page navigations: network-first, fall back to the cached app shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/", { ignoreSearch: true }))
    );
    return;
  }

  // Everything else (styles, script, icons): cache-first, then network.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
