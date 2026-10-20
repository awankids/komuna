'use client';

import { useEffect } from 'react';

/**
 * Client-side Theme & Appearance Initializer
 * Replaces inline script tags to comply with React 19 / Turbopack strict script checking
 * while preventing console warnings and maintaining user theme preferences.
 */
export default function ThemeInitializer() {
  useEffect(() => {
    try {
      // 1. One-time reset of legacy dark mode stuck in localStorage from previous OS dark query
      if (localStorage.getItem('komuna_theme_v2_clean') !== 'yes') {
        localStorage.setItem('komuna-dark', 'no');
        localStorage.setItem('komuna_theme_v2_clean', 'yes');
      }

      // 2. On /login route, always enforce pure Light Mode default unless user explicitly chose dark on login
      if (window.location.pathname === '/login') {
        if (localStorage.getItem('komuna_login_dark_explicit') !== 'yes') {
          localStorage.setItem('komuna-dark', 'no');
        }
      }

      const theme = localStorage.getItem('komuna-theme') || 'orange';
      const isDark = localStorage.getItem('komuna-dark') === 'yes';
      const font = localStorage.getItem('komuna-font') || 'outfit';
      const size = localStorage.getItem('komuna-size') || 'normal';
      const style = localStorage.getItem('komuna-style') || 'classic';
      
      const cl = document.documentElement.classList;
      // Remove only theme/font/size/dark/style classes to preserve Next.js/Tailwind font variables
      Array.from(cl).forEach((c) => {
        if (c.startsWith('theme-') || c.startsWith('font-') || c.startsWith('size-') || c.startsWith('style-') || c === 'dark') {
          cl.remove(c);
        }
      });
      cl.add('theme-' + theme);
      cl.add('font-' + font);
      cl.add('size-' + size);
      cl.add('style-' + style);
      if (isDark) {
        cl.add('dark');
      }
    } catch {}

    // Global unhandled error listener for client-side diagnostic logging
    const handleError = (event: ErrorEvent) => {
      try {
        const logs = JSON.parse(localStorage.getItem('komuna-error-logs') || '[]');
        logs.unshift({
          timestamp: new Date().toISOString(),
          type: 'error',
          message: event.message || 'Unknown client-side runtime error',
          source: event.filename ? (event.filename.split('/').pop() + ':' + event.lineno) : 'Unknown script source',
          url: window.location.href,
        });
        localStorage.setItem('komuna-error-logs', JSON.stringify(logs.slice(0, 50)));
      } catch {}
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
