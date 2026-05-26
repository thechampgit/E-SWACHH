'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{
    app: any;
    db: any;
    auth: any;
    storage: any;
    messaging: any;
  } | null>(null);

  useEffect(() => {
    // Initialize only on client mount to prevent hydration mismatches
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

  return (
    <FirebaseProvider 
      app={services?.app ?? null} 
      db={services?.db ?? null} 
      auth={services?.auth ?? null} 
      storage={services?.storage ?? null} 
      messaging={services?.messaging ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
