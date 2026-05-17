/**
 * lib/constants.ts — Vault Next
 * Konstanta aplikasi yang tersebar di berbagai file.
 * Import dari sini untuk konsistensi.
 */

/** Nama aplikasi */
export const APP_NAME = 'Vault';

/** Versi aplikasi — sync dengan package.json */
export const APP_VERSION = '0.8.0';

/** Auto-lock default timeout (menit) */
export const AUTO_LOCK_DEFAULT_MIN = 5;

/**
 * Auto-lock options — nilai dalam MENIT, sesuai unit yang dipakai store (autoLockMinutes).
 */
export const AUTOLOCK_OPTIONS_MIN = [
  { label: 'Nonaktif',  value: 0  },
  { label: '1 menit',   value: 1  },
  { label: '5 menit',   value: 5  },
  { label: '10 menit',  value: 10 },
  { label: '30 menit',  value: 30 },
  { label: '1 jam',     value: 60 },
] as const;

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum seed phrase words */
export const SEED_PHRASE_WORD_COUNT = 24;

/** LocalStorage keys prefix */
export const STORAGE_PREFIX = 'vault_';

/** Z-index tokens — gunakan ini, jangan hardcode angka di CSS/TSX */
export const Z = {
  behind:       -1,   // pseudo-element dekoratif di belakang parent
  base:          0,
  raisedLocal:   1,   // SVG/konten di atas ::before dalam stacking context lokal
  content:      10,
  sticky:      100,
  sidebar:     200,
  dropdown:    300,
  modal:       400,
  toast:       500,
  top:        9999,
} as const;

/** Panjang minimum PIN digit */
export const PIN_MIN_LEN = 4;

/** Panjang maksimum PIN digit */
export const PIN_MAX_LEN = 6;

/**
 * Route constants — semua URL dari sini, tidak pernah hardcode string URL di komponen.
 * Vault Next adalah single-page PWA — semua navigasi di dalam app (bukan route antar halaman).
 * Konstanta ini dipakai untuk link eksternal seperti not-found → home.
 */
export const ROUTES = {
  home:    '/',
  offline: '/offline',
} as const;
