if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              // Ada versi baru — notif di app via AppShell
              window.dispatchEvent(new CustomEvent('sw-update'));
            }
          });
        });
      })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
