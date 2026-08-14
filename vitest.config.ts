import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // v1.7.0: @testing-library/jest-dom sudah jadi dependency tapi setup
    // filenya kosong -- matcher seperti toBeInTheDocument() tidak pernah
    // aktif, jadi test komponen React (mis. VaultListView.test.tsx) gagal
    // di titik assertion, bukan di titik yang sebenarnya diuji.
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
