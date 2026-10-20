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
      // Register Service Worker smoothly without disruptive auto-reloading
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Proactively check for new version on server in background
            registration.update().catch(() => {});

            // If a worker is already waiting, tell it to skip waiting
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for new installing workers
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.error('ServiceWorker registration failed: ', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      // Capture beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        window.deferredPrompt = e;
        window.dispatchEvent(new CustomEvent('pwa-installable'));
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('load', registerSW);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  return null;
}
