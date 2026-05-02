/**
 * lib/constants.ts — Vault Next
 * Konstanta aplikasi yang tersebar di berbagai file.
 * Import dari sini untuk konsistensi.
 */

/** Nama aplikasi */
export const APP_NAME = 'Vault';

/** Versi aplikasi — sync dengan package.json */
export const APP_VERSION = '0.8.0';

/** Auto-lock default timeout (ms) */
export const AUTO_LOCK_DEFAULT_MS = 5 * 60 * 1000; // 5 menit

/** Auto-lock options (ms) */
export const AUTO_LOCK_OPTIONS = [
  { label: '1 menit',  value: 1 * 60 * 1000 },
  { label: '3 menit',  value: 3 * 60 * 1000 },
  { label: '5 menit',  value: 5 * 60 * 1000 },
  { label: '10 menit', value: 10 * 60 * 1000 },
  { label: '30 menit', value: 30 * 60 * 1000 },
  { label: 'Tidak pernah', value: 0 },
] as const;

/** Backup reminder interval (ms) — 24 jam */
export const BACKUP_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum seed phrase words */
export const SEED_PHRASE_WORD_COUNT = 24;

/** LocalStorage keys prefix */
export const STORAGE_PREFIX = 'vault_';

/** Z-index tokens — gunakan ini, jangan hardcode angka di CSS/TSX */
export const Z = {
  base:     0,
  content:  10,
  sticky:   100,
  sidebar:  200,
  dropdown: 300,
  modal:    400,
  toast:    500,
  top:      9999,
} as const;
