// Komuna Theme & Appearance Initializer (Anti-FOUC)
(function() {
  try {
    // Migration: One-time reset of legacy dark mode stuck in localStorage from previous OS dark query
    if (localStorage.getItem('komuna_theme_v2_clean') !== 'yes') {
      localStorage.setItem('komuna-dark', 'no');
      localStorage.setItem('komuna_theme_v2_clean', 'yes');
    }

    var theme = localStorage.getItem('komuna-theme') || 'orange';
    var isDark = localStorage.getItem('komuna-dark') === 'yes';
    var font = localStorage.getItem('komuna-font') || 'outfit';
    var size = localStorage.getItem('komuna-size') || 'normal';
    var style = localStorage.getItem('komuna-style') || 'classic';
    
    var cl = document.documentElement.classList;
    // Remove only theme/font/size/dark/style classes to preserve Next.js/Tailwind font variables
    Array.from(cl).forEach(function(c) {
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
  } catch (e) {}
})();

// Global unhandled error listener for client-side diagnostic logging
if (typeof window !== 'undefined') {
  window.addEventListener('error', function(event) {
    try {
      var logs = JSON.parse(localStorage.getItem('komuna-error-logs') || '[]');
      logs.unshift({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: event.message || 'Unknown client-side runtime error',
        source: event.filename ? (event.filename.split('/').pop() + ':' + event.lineno) : 'Unknown script source',
        url: window.location.href
      });
      localStorage.setItem('komuna-error-logs', JSON.stringify(logs.slice(0, 50)));
    } catch (err) {}
  });
}
