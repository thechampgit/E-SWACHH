'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { firebaseConfig } from './config';
import { useMemo, useRef } from 'react';

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null; 
  storage: FirebaseStorage | null;
  messaging: Messaging | null;
} {
  // Protective check: If API key is missing or is a placeholder, return nulls
  // This prevents the SDK from throwing a fatal 'invalid-api-key' error during render
  const isConfigMissing = !firebaseConfig.apiKey || 
                          firebaseConfig.apiKey === "" || 
                          firebaseConfig.apiKey.includes("your-api-key");

  if (isConfigMissing) {
    if (typeof window !== 'undefined') {
      console.warn("CivicPulse: Firebase API Key is missing. Using diagnostic mode.");
    }
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    let messaging: Messaging | null = null;
    
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported && !messaging) {
          messaging = getMessaging(app);
        }
      }).catch(err => {
        console.warn('Messaging not supported or blocked:', err);
      });
    }

    return { app, db, auth, storage, messaging };
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return { app: null, db: null, auth: null, storage: null, messaging: null };
  }
}

export async function requestNotificationPermission(messaging: Messaging | null) {
  if (!messaging || typeof window === 'undefined') return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: firebaseConfig.vapidKey
      });
      return token;
    }
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
  }
  return null;
}

/**
 * A hook to memoize Firebase references and queries.
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
