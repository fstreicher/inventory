import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, initializeFirestore, provideFirestore, persistentLocalCache, persistentMultipleTabManager } from '@angular/fire/firestore';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import * as firebase from '../../firebase.json';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (!environment.production) {
        // Connect to auth emulator in development - only if not already connected
        try {
          connectAuthEmulator(auth, `http://${environment.emulatorHost}:${firebase.emulators.auth.port}`);
        } catch (error: unknown) {
          // Emulator already connected, ignore error
          console.warn('Auth emulator already connected', error);
        }
      }
      return auth;
    }),
    provideFirestore(() => {
      // Configure Firestore with persistent local cache for offline functionality
      // This replaces the deprecated enableMultiTabIndexedDbPersistence
      const firestore = initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      if (!environment.production) {
        // Connect to emulator in development - only if not already connected
        try {
          connectFirestoreEmulator(firestore, environment.emulatorHost, firebase.emulators.firestore.port);
        } catch (error: unknown) {
          // Emulator already connected, ignore error
          console.warn('Firestore emulator already connected', error);
        }
      }

      return firestore;
    }),
  ]
};
