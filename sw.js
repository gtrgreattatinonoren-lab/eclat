/* オフラインでも開けるようにする。更新時は VERSION を上げる */
const VERSION = 'eclat-2026-11-15k';
const CORE = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'js/data-lessons.js', 'js/data-beauty.js', 'js/data-videos.js', 'js/data-quiz.js', 'js/data-styles.js', 'js/data-updates.js', 'js/diagrams.js', 'js/app.js', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // 中身(JS/HTML)はネット優先で最新を取り、つながらない時だけキャッシュ。画像はキャッシュ優先
  const img = /\.(jpg|png|webp)$/.test(u.pathname);
  e.respondWith(img
    ? caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); } return res; }))
    : fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); } return res; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
