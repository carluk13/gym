// Gym · service worker
var VERSION = '202610271053-6f2857ae';
var CORE = 'gym-core-' + VERSION;
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
// Sprites de fotos (build.py pone la lista). Se precargan para que salgan sin cobertura; si fallan, el service worker se instala igual.
var SPRITES = ["sp/s0.jpg", "sp/s1.jpg", "sp/s2.jpg", "sp/s3.jpg", "sp/s4.jpg", "sp/s5.jpg", "sp/s6.jpg", "sp/s7.jpg", "sp/s8.jpg"];
// Margen para la red al abrir la app: pasado este tiempo responde la copia guardada (y la nueva se guarda para la próxima vez)
var NET_WAIT = 1500;
// Precarga sin la caché HTTP del navegador (GitHub Pages da max-age=600): así una versión nueva nunca guarda el index.html viejo
function fresh(u) { return new Request(u, { cache: 'reload' }); }
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CORE).then(function (c) { return c.addAll(FILES.map(fresh)).then(function () { return c.addAll(SPRITES.map(fresh)).catch(function () {}); }); }).then(function () { return self.skipWaiting(); })); });
// Solo borra cachés viejas de Gym: en el mismo origen está la app de Corea (/corea/) con las suyas.
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('gym-') === 0 && k !== CORE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
// La app (navegación o index.html): primero la red, para coger la versión nueva; sin red o pasado NET_WAIT, la guardada.
// Fotos, iconos y manifiesto: primero la caché (se precargan con cada versión); lo que falte, de la red, y se guarda.
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;
  var page = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname);
  if (!page) {
    e.respondWith(caches.open(CORE).then(function (c) {
      return c.match(r, { ignoreSearch: true }).then(function (m) {
        return m || fetch(r).then(function (n) { if (n && n.ok) c.put(r, n.clone()); return n; });
      });
    }));
    return;
  }
  function saved() { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }).then(function (m) { return m || caches.match('./'); }); }
  e.respondWith(new Promise(function (res) {
    var done = false, t = setTimeout(function () { saved().then(function (m) { if (m && !done) { done = true; res(m); } }); }, NET_WAIT);
    fetch(r).then(function (n) { if (n && n.ok) { var cp = n.clone(); caches.open(CORE).then(function (c) { c.put(r, cp); }); } if (!done) { done = true; clearTimeout(t); res(n); } })
      .catch(function () { saved().then(function (m) { if (!done) { done = true; clearTimeout(t); res(m || Response.error()); } }); });
  }));
});
