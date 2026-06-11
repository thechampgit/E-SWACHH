'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentData, 
  DocumentSnapshot,
  FirestoreError,
  refEqual
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, SecurityRuleContext } from '../errors';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Stabilize the docRef reference
  const docRefRef = useRef<DocumentReference<T> | null>(null);

  if (docRef === null) {
    docRefRef.current = null;
  } else if (docRefRef.current === null || !refEqual(docRefRef.current, docRef)) {
    docRefRef.current = docRef;
  }

  const stableDocRef = docRefRef.current;

  useEffect(() => {
    if (!stableDocRef) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      stableDocRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(`Firestore useDoc Error [${stableDocRef.path}]:`, err);
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: stableDocRef.path,
            operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableDocRef]);

  return { data, loading, error };
}
