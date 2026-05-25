
'use client';

import { useState, useEffect } from 'react';

/**
 * A hydration guard to prevent Next.js 15 hydration mismatches.
 * Renders children only on the client side after mounting.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
