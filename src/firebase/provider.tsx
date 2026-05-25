
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Messaging } from 'firebase/messaging';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  messaging: Messaging | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({
  children,
  app,
  db,
  auth,
  storage,
  messaging,
}: {
  children: ReactNode;
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  messaging: Messaging | null;
}) {
  // If the configuration is missing, show a descriptive diagnostic screen instead of crashing
  if (!app || !db || !auth || !storage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 border border-emerald-100 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="text-emerald-600 h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold text-slate-900">Setup Required</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              CivicPulse is ready to deploy, but it needs a valid Firebase configuration to connect to the municipal servers.
            </p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Connection Diagnostics</p>
            <ul className="text-xs space-y-2 font-medium text-slate-600">
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${firebaseConfig.apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
                API Key: {firebaseConfig.apiKey ? 'Detected' : 'Missing'}
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${firebaseConfig.projectId ? 'bg-emerald-500' : 'bg-red-500'}`} />
                Project ID: {firebaseConfig.projectId ? 'Detected' : 'Missing'}
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full flex items-center justify-center gap-2 h-12 font-bold shadow-lg shadow-emerald-200/50"
            >
              <RefreshCcw size={16} /> Refresh Connection
            </Button>
            <p className="text-[10px] text-slate-400 mt-4 italic">
              Check your project environment variables in settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ app, db, auth, storage, messaging }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useFirestore() {
  return useFirebase().db;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useStorage() {
  return useFirebase().storage;
}

export function useMessaging() {
  return useFirebase().messaging;
}
