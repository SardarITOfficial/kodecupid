'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that makes the app installable. The worker itself
 * is network-only in Milestone 1, so it can never serve a stale build.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installation support is a progressive enhancement; failures are silent.
    });
  }, []);

  return null;
}
