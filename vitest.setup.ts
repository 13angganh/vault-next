/**
 * vitest.setup.ts — Vault Next
 * v1.7.0: mengaktifkan matcher @testing-library/jest-dom
 * (toBeInTheDocument, toHaveTextContent, dll) untuk seluruh test suite.
 * Dependency ini sudah ada di package.json sejak awal tapi belum pernah
 * di-import di manapun -- setupFiles di vitest.config.ts sebelumnya [].
 */
import '@testing-library/jest-dom/vitest';
