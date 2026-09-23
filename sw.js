// Gym · service worker
var VERSION = '202609231413-486d87aa';
var CORE = 'gym-core-' + VERSION;
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CORE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CORE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(new Promise(function (res) {
    var done = false, t = setTimeout(function () { caches.match(r, { ignoreSearch: true }).then(function (m) { if (m && !done) { done = true; res(m); } }); }, 3000);
    fetch(r).then(function (n) { if (n && n.ok) { var cp = n.clone(); caches.open(CORE).then(function (c) { c.put(r, cp); }); } if (!done) { done = true; clearTimeout(t); res(n); } })
      .catch(function () { caches.match(r, { ignoreSearch: true }).then(function (m) { if (!done) { done = true; clearTimeout(t); res(m || caches.match('index.html')); } }); });
  }));
});
