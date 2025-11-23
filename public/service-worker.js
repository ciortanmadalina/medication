const CACHE_NAME = 'medication-reminder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Push event - show notification with action buttons
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle action buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const doseId = event.notification.data.doseId;
  const action = event.action;

  let apiEndpoint;
  let body;

  if (action === 'take') {
    apiEndpoint = '/.netlify/functions/markDoseAsTaken';
    body = JSON.stringify({ doseId });
  } else if (action === 'snooze') {
    apiEndpoint = '/.netlify/functions/snoozeDose';
    body = JSON.stringify({ doseId, minutes: 10 });
  } else {
    // Notification clicked without action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
    return;
  }

  // Handle action button clicks
  event.waitUntil(
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    })
    .then((response) => {
      if (!response.ok) {
        console.error('Action failed:', response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      console.log('Action result:', data);
      // Optionally notify all clients to refresh
      return self.clients.matchAll();
    })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DOSE_UPDATED',
          doseId: doseId,
          action: action
        });
      });
    })
    .catch((error) => {
      console.error('Error handling notification action:', error);
    })
  );
});
