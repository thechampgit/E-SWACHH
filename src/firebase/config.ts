
'use client';

/**
 * Firebase configuration object.
 * Values are pulled from environment variables. 
 * Fallbacks are provided to prevent crash if env vars are missing during dev.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""
};

// Diagnostic check to help the user identify missing configuration
if (typeof window !== 'undefined') {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push("API Key");
  if (!firebaseConfig.projectId) missing.push("Project ID");
  
  if (missing.length > 0) {
    console.warn(
      `CivicPulse: Firebase config missing [${missing.join(", ")}]. Please set your NEXT_PUBLIC_FIREBASE_* variables.`
    );
  }
}
