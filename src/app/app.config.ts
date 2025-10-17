import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      projectId: "pos-lapot-shop",
      appId: "1:232278708365:web:27381e043daea6ffe252c4",
      storageBucket: "pos-lapot-shop.firebasestorage.app",
      apiKey: "AIzaSyC_XG_4KHhjbGK80nA08osqzw5ZTFfD2cg",
      authDomain: "pos-lapot-shop.firebaseapp.com",
      messagingSenderId: "232278708365",
      measurementId: "G-5WZSDTDPZ6"
    })),
    provideFirestore(() => getFirestore()),
    provideCharts(withDefaultRegisterables())
  ]
};
