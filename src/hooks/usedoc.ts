"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useDoc(path: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!path) return;

    const ref = doc(db, path);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData({ id: snapshot.id, ...snapshot.data() });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}
