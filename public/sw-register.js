if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Cek update di background setiap halaman load
        reg.update().catch(() => {});

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            // Ketika SW baru installed dan ada controller aktif,
            // panggil skipWaiting agar SW baru langsung aktif.
            // AppShell.tsx akan tangkap via 'controllerchange' event.
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
