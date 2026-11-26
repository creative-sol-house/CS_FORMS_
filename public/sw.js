self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Fetch handler required for installability; always goes to the network.
self.addEventListener("fetch", () => {});