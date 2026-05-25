'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
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
  
  let messaging: Messaging | null = null;
  
  // Messaging only works in the browser
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

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
