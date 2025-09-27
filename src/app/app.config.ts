import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';
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
          connectAuthEmulator(auth, `http://localhost:${firebase.emulators.auth.port}`);
        } catch (error) {
          // Emulator already connected, ignore error
          console.log('Auth emulator already connected');
        }
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (!environment.production) {
        // Connect to emulator in development - only if not already connected
        try {
          connectFirestoreEmulator(firestore, 'localhost', firebase.emulators.firestore.port);
        } catch (error) {
          // Emulator already connected, ignore error
          console.log('Firestore emulator already connected');
        }
      }
      return firestore;
    }),
  ]
};
