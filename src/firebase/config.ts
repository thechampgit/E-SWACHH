'use client';

/**
 * Firebase configuration object.
 * Hardcoded with the correct E-Swachh project credentials as fallback.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDXyVMqE7MeQIHPPWNkXQFVwMg46WJEsXs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-swachh-15ce7.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "e-swachh-15ce7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-swachh-15ce7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "936401481375",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:936401481375:web:8f35b9a8ae79030ae37caa",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""
};
