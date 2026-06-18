const CACHE_NAME = 'bodhishape-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bodhishape_logo_1781108377890.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
       try {
         return cache.addAll(ASSETS);
       } catch (err) {
         console.warn("[PWA SW] Pre-caching warning:", err);
       }
    })
  );
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Network-First strategy prioritizing live state changes with reliable cache fallback
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  
  // Avoid caching backend API calls, OAuth systems, or third-party web sockets
  if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache valid standard responses
        if (res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

// Push Event Listener for receiving background notifications even when application is closed
self.addEventListener('push', (event) => {
  let data = {
    title: 'BodhiShape 🪷',
    body: 'Mantenha o foco em sua evolução diária!',
    icon: '/bodhishape_logo_1781108377890.png',
    badge: '/bodhishape_logo_1781108377890.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'open_app', title: 'Abrir BodhiShape 🪷' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click to focus or open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
