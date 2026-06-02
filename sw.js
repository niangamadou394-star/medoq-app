const CACHE = 'pilotage-amadou-v2';
const ASSETS = ['./index.html', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});

/* ---- Notification click → open app ---- */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.registration.scope) && 'focus' in c) return c.focus();
      }
      return clients.openWindow('./');
    })
  );
});

/* ---- Schedule received from main thread ---- */
let _schedule = [];
let _fired = {};  // { "id_YYYY-MM-DD": true }
let _timer = null;

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SET_SCHEDULE') {
    _schedule = e.data.schedule || [];
    startChecker();
  }
});

function startChecker() {
  if (_timer) clearInterval(_timer);
  checkNow();
  _timer = setInterval(checkNow, 60000);
}

function checkNow() {
  const now = new Date();
  const dayJs = now.getDay();          // 0 Sun … 6 Sat
  const hh = ('0' + now.getHours()).slice(-2);
  const mm = ('0' + now.getMinutes()).slice(-2);
  const timeKey = hh + ':' + mm;
  const dateKey = now.toISOString().slice(0, 10);

  // Reset fired at midnight
  if (timeKey === '00:00') _fired = {};

  _schedule.forEach(n => {
    if (n.time !== timeKey) return;
    if (n.days && !n.days.includes(dayJs)) return;
    const fk = n.id + '_' + dateKey;
    if (_fired[fk]) return;
    _fired[fk] = true;
    self.registration.showNotification(n.title, {
      body: n.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: n.id,
      vibrate: [200, 100, 200],
      renotify: true,
      requireInteraction: false
    });
  });
}
