'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Messaging } from 'firebase/messaging';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { KeyRound, RefreshCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isConfigMissing = !firebaseConfig.apiKey || firebaseConfig.apiKey === "";

  // Only show diagnostic fallback if we are on the client and config is actually missing
  if (isMounted && isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F7F5] p-6 font-body">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-[#e2e8f0] text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-[#E8F3EF] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#F1F7F5]">
            <KeyRound className="text-[#047857] h-10 w-10" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-headline font-extrabold text-[#1A2E28]">Secure Connect</h1>
            <p className="text-[#64748b] text-sm leading-relaxed">
              e-Swachh requires an active connection to the municipal governance cloud. Please configure your project credentials to begin.
            </p>
          </div>
          
          <div className="bg-[#F8FAFC] rounded-2xl p-6 text-left border border-slate-100 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connection Diagnostics</p>
            <div className="space-y-3">
              <DiagnosticItem label="Authentication Gateway" status={!!firebaseConfig.apiKey} />
              <DiagnosticItem label="Database Cluster" status={!!firebaseConfig.projectId} />
              <DiagnosticItem label="Storage Infrastructure" status={!!firebaseConfig.storageBucket} />
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full flex items-center justify-center gap-2 h-14 font-bold rounded-xl shadow-xl shadow-emerald-900/10 bg-[#047857] hover:bg-[#065F46] text-white transition-all"
            >
              <RefreshCcw size={18} /> Re-verify Credentials
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we don't have instances yet but config is present, show a simple loader
  if (!app || !db || !auth || !storage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connecting to Governance Cloud</span>
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

function DiagnosticItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-colors ${status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
        {status ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
        {status ? 'Ready' : 'Pending'}
      </div>
    </div>
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
