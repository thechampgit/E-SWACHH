'use client';

/**
 * Firebase configuration object.
 * Values are hardcoded based on the project provided by the user.
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

// Diagnostic check to help identify configuration issues
if (typeof window !== 'undefined') {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push("API Key");
  if (!firebaseConfig.projectId) missing.push("Project ID");
  
  if (missing.length > 0) {
    console.warn(`CivicPulse Diagnostic: Missing config for [${missing.join(", ")}].`);
  }
}
