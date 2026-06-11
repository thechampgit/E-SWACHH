"use client";

import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/hooks/usedoc";

export default function TestPage() {
  const { user, loading: authLoading } = useAuth();
  console.log("USER:", user);

  // o. Only create docRef when user exists
  let userDocRef = null;

  if (!authLoading && user) {
   useDoc(user ? `users/${user.uid}` : null);
  }

  const { data, loading, error } = useDoc(userDocRef);

  if (authLoading) return <p>Auth loading...</p>;

  if (!user) return <p>Not logged in</p>;

  if (loading) return <p>Loading data...</p>;

  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>User Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
