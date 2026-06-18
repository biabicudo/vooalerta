// VooAlerta Service Worker v2
const CACHE = 'vooalerta-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🚨 VooAlerta – Preço abaixo do limite!';
  const opts = {
    body: data.body || 'Toque para ver e comprar.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'vooalerta-alert',
    requireInteraction: true,
    actions: [
      { action: 'buy', title: '🛒 Comprar agora' },
      { action: 'dismiss', title: 'Dispensar' }
    ],
    data: { url: data.url || 'https://www.google.com/travel/flights' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'buy' || !e.action) {
    const url = e.notification.data.url;
    e.waitUntil(
      clients.matchAll({ type:'window' }).then(cs => {
        if (cs.length > 0) { cs[0].focus(); cs[0].navigate(url); }
        else clients.openWindow(url);
      })
    );
  }
});

// Background sync for periodic price checks
self.addEventListener('periodicsync', e => {
  if (e.tag === 'price-check') {
    e.waitUntil(doBackgroundPriceCheck());
  }
});

async function doBackgroundPriceCheck() {
  // Background price fetch would call your backend here
  // For demo, we just keep the SW alive
  console.log('[SW] Background price check triggered');
}
