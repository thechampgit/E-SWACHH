'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { firebaseConfig } from './config';
import { useRef } from 'react';

/**
 * Initializes Firebase services safely using a singleton pattern.
 * Strictly client-side to prevent SSR failures.
 */
let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let cachedStorage: FirebaseStorage | null = null;

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null; 
  storage: FirebaseStorage | null;
  messaging: Messaging | null;
} {
  // Ensure we are in a browser environment
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }

  try {
    if (!cachedApp) {
      cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      cachedDb = getFirestore(cachedApp);
      cachedAuth = getAuth(cachedApp);
      cachedStorage = getStorage(cachedApp);
    }
    
    return { 
      app: cachedApp, 
      db: cachedDb, 
      auth: cachedAuth, 
      storage: cachedStorage, 
      messaging: null 
    };
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }
}

export async function requestNotificationPermission(app: FirebaseApp | null) {
  if (!app || typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if (!firebaseConfig.vapidKey) return null;
      const token = await getToken(messaging, {
        vapidKey: firebaseConfig.vapidKey
      });
      return token;
    }
  } catch (error) {
    console.warn('Notification permission error:', error);
  }
  return null;
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T } | null>(null);
  const hasChanged = !ref.current || !deps.every((dep, i) => dep === ref.current?.deps[i]);
  
  if (hasChanged) {
    ref.current = { deps, value: factory() };
  }
  
  return ref.current!.value;
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
