import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Handle service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (environment.production) {
      // Register service worker only in production
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.debug('📦 Service Worker registered successfully:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.debug('📦 New app version available! Reload to update.');
                  // You could show a toast notification here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.debug('📦 Service Worker registration failed:', error);
        });
    } else {
      // In development, unregister any existing service workers and clear caches
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.debug('📦 Unregistering service worker for development');
          registration.unregister();
        });
      });

      // Clear all caches in development
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            console.debug('🗑️ Clearing cache:', cacheName);
            caches.delete(cacheName);
          });
        });
      }
    }
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
