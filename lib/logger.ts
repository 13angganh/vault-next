/**
 * Vault Next — lib/logger.ts
 * Logger terpusat. Untuk app offline-first: hanya wrapper
 * yang menonaktifkan output di production (kecuali error).
 * Tidak ada pengiriman ke server.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /** Log informatif — hanya muncul di development */
  info: (...args: unknown[]): void => {
    if (isDev) console.info('[vault]', ...args);
  },

  /** Warning — hanya muncul di development */
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn('[vault]', ...args);
  },

  /** Error — selalu muncul (baik dev maupun production) */
  error: (...args: unknown[]): void => {
    console.error('[vault]', ...args);
  },

  /** Debug — hanya muncul di development */
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug('[vault]', ...args);
  },
};
