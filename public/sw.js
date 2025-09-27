// Simple service worker for offline caching
const CACHE_NAME = 'inventory-manager-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Angular CLI will inject the built files here automatically
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('📦 Service Worker: Installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('📦 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('📦 Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('📦 Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - cache first strategy for app shell, network first for API calls
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Handle Firebase/Firestore requests with network first
  if (requestUrl.hostname.includes('firestore.googleapis.com') || 
      requestUrl.hostname.includes('firebase.googleapis.com')) {
    // Network first for Firebase - let Firestore handle its own caching
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Cache first for app shell and static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Check if we received a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for when the app comes back online
self.addEventListener('sync', (event) => {
  console.log('📡 Service Worker: Background sync triggered - Firestore will handle data sync automatically');
});

// Show a notification when the app is updated
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});