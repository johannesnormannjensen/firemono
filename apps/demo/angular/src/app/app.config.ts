import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { provideRouter } from '@angular/router';
import { EnvironmentService } from '@firemono/demo/angular/environment';
import { environment } from '../environment/environment';
import { firebaseConfig } from '../firebase/firebase-config';
import { appRoutes } from './app.routes';

const useEmulator = environment.type === 'emulator';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    { provide: EnvironmentService, useValue: new EnvironmentService(environment) },
    provideFirebaseApp(() => {
      const app = initializeApp(firebaseConfig);
      if (useEmulator) {
        console.warn('Using auth emulator');
        connectAuthEmulator(getAuth(), 'http://localhost:9099');
      }
      return app;
    }),
    provideFirestore(() => {
      const db = getFirestore();
      if (useEmulator) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.warn('Using firestore emulator');
      }
      return db;
    }),
    provideFunctions(() => {
      const functions = getFunctions(undefined, 'europe-west1');
      if (useEmulator) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.warn('Using functions emulator');
      }
      return functions;
    }),
  ],
};
