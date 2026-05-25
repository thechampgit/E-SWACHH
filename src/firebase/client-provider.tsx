
'use client';

import React, { useMemo, ReactNode } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { app, db, auth, storage, messaging } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider app={app} db={db} auth={auth} storage={storage} messaging={messaging}>
      {children}
    </FirebaseProvider>
  );
}
