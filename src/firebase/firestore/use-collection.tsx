'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Query, 
  onSnapshot, 
  DocumentData, 
  QuerySnapshot,
  FirestoreError,
  queryEqual
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, SecurityRuleContext } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Stabilize the query reference
  const queryRef = useRef<Query<T> | null>(null);

  if (query === null) {
    queryRef.current = null;
  } else if (queryRef.current === null || !queryEqual(queryRef.current, query)) {
    queryRef.current = query;
  }

  const stableQuery = queryRef.current;

  useEffect(() => {
    if (!stableQuery) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as T & { id: string }));
        setData(items);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Firestore useCollection Error:', err);
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'collection_query',
            operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery]);

  return { data, loading, error };
}
