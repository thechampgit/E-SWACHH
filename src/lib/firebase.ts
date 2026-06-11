import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:  "AIzaSyDXyVMqE7MeQIHPPWNkXQFVwMg46WJEsXs",
  authDomain: "e-swachh-15ce7.firebaseapp.com",
  projectId: "e-swachh-15ce7",
  storageBucket: "e-swachh-15ce7.firebasestorage.app",
  messagingSenderId:  "936401481375",
  appId: "1:936401481375:web:8f35b9a8ae79030ae37caa"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Export these
export const db = getFirestore(app);
export const auth = getAuth(app);



