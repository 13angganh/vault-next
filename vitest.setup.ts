/**
 * vitest.setup.ts — Vault Next
 * v1.7.0: mengaktifkan matcher @testing-library/jest-dom
 * (toBeInTheDocument, toHaveTextContent, dll) untuk seluruh test suite.
 * Dependency ini sudah ada di package.json sejak awal tapi belum pernah
 * di-import di manapun -- setupFiles di vitest.config.ts sebelumnya [].
 */
import '@testing-library/jest-dom/vitest';

/**
 * v1.10.3: mock ResizeObserver untuk jsdom.
 * jsdom (test environment proyek ini) tidak menyediakan ResizeObserver
 * sama sekali — dikonfirmasi lewat reproduksi langsung (ReferenceError)
 * saat SettingsView.tsx pertama kali memakainya untuk fix animasi
 * collapsible laggy. Mock minimal ini cukup untuk komponen yang hanya
 * memanggil observe()/disconnect() dan tidak bergantung pada callback
 * ResizeObserver benar-benar terpanggil saat resize sungguhan terjadi
 * (jsdom tidak melakukan layout nyata, jadi resize event tidak relevan
 * untuk lingkungan test) — cukup agar constructor tidak throw dan
 * kode yang menggunakannya bisa diuji tanpa guard-only assertion.
 */
class MockResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;
