const CACHE_NAME = 'goatmaster-v1';
const STATIC_CACHE = 'goatmaster-static-v4';
const DYNAMIC_CACHE = 'goatmaster-dynamic-v4';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // API responses can contain private tenant data. Never put them in the shared Cache API.
  if (url.pathname.startsWith('/api/')) return;

  // Handle static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests - network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default: network first
  event.respondWith(fetch(request));
});

// Cache first strategy - for static assets
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy - for API calls
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Navigation strategy - for page navigations
async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Private app pages are never served from a shared cache.
    // Return offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Check if asset is static
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/) ||
    pathname === '/manifest.json'
  );
}

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Sync offline queue
async function syncOfflineQueue() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll({ type: 'window' });
    
    // Send sync request to each client
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_QUEUE' });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_QUEUE') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    const url = event.notification.data?.actionUrls?.[event.action];
    if (url) {
      const destination = new URL(url, self.location.origin);
      if(destination.origin === self.location.origin)event.waitUntil(clients.openWindow(destination.href));
    }
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/dashboard');
      })
    );
  }
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  // Analytics or cleanup
  console.log('Notification closed:', event.notification.tag);
});
