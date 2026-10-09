/* Har safar savollar yoki kod o'zgarganda VERSION raqamini oshiring */
const VERSION = "v1";
const FILES = ["./", "index.html", "app.js", "lic.js", "questions.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes("fonts.g"))) {
      const cp = res.clone(); caches.open(VERSION).then(c => c.put(e.request, cp));
    }
    return res;
  }).catch(() => caches.match("index.html"))));
});
