'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    deferredPrompt: any;
    showPWAInstallPrompt?: () => void;
  }
}

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch((err) => {
            console.error('ServiceWorker registration failed: ', err);
          });
      });

      // Capture beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        window.deferredPrompt = e;
        // Dispatch custom event to notify components that app is installable
        window.dispatchEvent(new CustomEvent('pwa-installable'));
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  return null;
}
