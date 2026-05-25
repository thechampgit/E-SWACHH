
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig } from './config';

export function initializeFirebase(): { 
  app: FirebaseApp; 
  db: Firestore; 
  auth: Auth; 
  storage: FirebaseStorage;
  messaging: Messaging | null;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  
  // Messaging is not supported in all environments (e.g. some SSR or private browsing)
  let messaging: Messaging | null = null;
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) messaging = getMessaging(app);
    });
  }

  return { app, db, auth, storage, messaging };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
