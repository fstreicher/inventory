import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (!environment.production) {
        // Connect to emulator in development - only if not already connected
        try {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        } catch (error) {
          // Emulator already connected, ignore error
          console.log('Firestore emulator already connected');
        }
      }
      return firestore;
    }),
  ]
};
