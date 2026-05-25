'use client';

/**
 * Firebase configuration object.
 * Hardcoded with the project credentials provided to ensure immediate connectivity.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAG3D6ALR5BbhTwJLWO6NmKgxiHIFDhJfo",
  authDomain: "studio-3092936231-e4dc8.firebaseapp.com",
  projectId: "studio-3092936231-e4dc8",
  storageBucket: "studio-3092936231-e4dc8.firebasestorage.app",
  messagingSenderId: "238649568344",
  appId: "1:238649568344:web:0d0a138c71121308412e2d",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""
};
