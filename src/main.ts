import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('📦 Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('📦 New app version available! Reload to update.');
                // You could show a toast notification here
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('📦 Service Worker registration failed:', error);
      });
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
