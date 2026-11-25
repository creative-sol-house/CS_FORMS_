// Remove BASE_PATH or set it to "" 
const CACHE_NAME = "sol-ad-dashboard-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    // Ensure public/offline.html exists, access path is /offline.html
    caches.open(CACHE_NAME).then((cache) => cache.add("/offline.html"))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      // Correct offline page path
      return (await caches.match("/offline.html")) || Response.error();
    })
  );
});