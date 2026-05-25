'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { firebaseConfig } from './config';
import { useMemo, useRef } from 'react';

/**
 * Initializes Firebase services safely using a singleton pattern.
 */
export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null; 
  storage: FirebaseStorage | null;
  messaging: Messaging | null;
} {
  // Protective check: Ensure we have a valid API Key
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "" || firebaseConfig.apiKey.includes("your-api-key")) {
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Initialize production services
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    let messaging: Messaging | null = null;
    
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported && !messaging) {
          try {
            messaging = getMessaging(app);
          } catch (e) {
            console.warn('FCM not initialized:', e);
          }
        }
      });
    }

    return { app, db, auth, storage, messaging };
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }
}

export async function requestNotificationPermission(messaging: Messaging | null) {
  if (!messaging || typeof window === 'undefined') return null;
  
  try {
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

/**
 * A hook to memoize Firebase references and queries.
 * Essential for preventing infinite loops in useCollection/useDoc.
 */
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
