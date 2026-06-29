/* ── --vh CSS variable setter ────────────────────────────────────────────────
 * Mencegah keyboard-induced layout shift dan autohide di iOS/Android PWA.
 * Harus berjalan sesegera mungkin (sebelum pertama render).
 */
(function () {
  function setVH() {
    // visualViewport lebih akurat dari window.innerHeight saat keyboard muncul
    var h = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
  }

  setVH();

  // Listen resize dari visualViewport (keyboard muncul/hilang di mobile)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVH);
  } else {
    window.addEventListener('resize', setVH);
  }

  // Orientasi berubah → recalculate
  window.addEventListener('orientationchange', function () {
    setTimeout(setVH, 100);
  });
})();

/* ── Service Worker Registration ─────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function (reg) {
        // Cek update di background — wrapped try/catch agar tidak crash saat offline
        try { reg.update(); } catch (_) {}

        reg.addEventListener('updatefound', function () {
          var newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', function () {
            // Ketika SW baru installed dan ada controller aktif,
            // panggil skipWaiting agar SW baru langsung aktif.
            // AppShell.tsx akan tangkap via 'controllerchange' event.
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('SW registration failed:', err);
      });
  });
}
