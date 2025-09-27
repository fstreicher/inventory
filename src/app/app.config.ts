import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore, enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
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
      
      // Enable offline persistence for better offline experience
      // This allows the app to work completely offline in the basement
      enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence');
        } else {
          console.error('Failed to enable offline persistence:', err);
        }
      });
      
      return firestore;
    }),
  ]
};
