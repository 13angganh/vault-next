/**
 * Vault Next — Storage
 * SSR-safe localStorage wrapper + key constants.
 * Semua akses localStorage via fungsi di sini — TIDAK langsung.
 */

// ─── Key Constants ─────────────────────────────────────────────────────────────
export const LS_KEY        = 'vault_data';       // data vault terenkripsi
export const LS_META       = 'vault_meta';       // metadata (hint, recovery hash, dll)
export const LS_PIN        = 'vault_pin';        // PIN terenkripsi
export const LS_THEME      = 'vault_theme';      // dark | light
export const LS_BACKUP     = 'vault_bkp_ts';     // timestamp backup terakhir
export const LS_BKPDATA    = 'vault_bkp_data';   // data backup terakhir
export const LS_BKPIVL     = 'vault_bkp_ivl';    // interval backup (jam)
export const LS_BKPDISM    = 'vault_bkp_dism';   // dismiss timestamp reminder
export const LS_AUTOLOCK   = 'vault_autolock';   // menit auto-lock
export const LS_AUTOSAVE   = 'vault_autosave';   // boolean autosave aktif
export const LS_CATS       = 'vault_cats';       // kategori custom (JSON)
export const LS_PIN_SKIPPED = 'vault_pin_skip';  // boolean skip setup PIN

// ─── SSR Guard ────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// ─── Core Get / Set / Remove ──────────────────────────────────────────────────

export function lsGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('[Vault] localStorage.setItem gagal:', key);
  }
}

export function lsRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export function lsGetJson<T>(key: string, fallback: T): T {
  const raw = lsGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSetJson(key: string, value: unknown): void {
  lsSet(key, JSON.stringify(value));
}

// ─── Boolean helpers ──────────────────────────────────────────────────────────

export function lsGetBool(key: string, fallback = false): boolean {
  const raw = lsGet(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

export function lsSetBool(key: string, value: boolean): void {
  lsSet(key, value ? 'true' : 'false');
}

// ─── Number helpers ───────────────────────────────────────────────────────────

export function lsGetNum(key: string, fallback: number): number {
  const raw = lsGet(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return isNaN(n) ? fallback : n;
}

export function lsSetNum(key: string, value: number): void {
  lsSet(key, String(value));
}

// ─── Typed Vault Helpers ──────────────────────────────────────────────────────

/** Simpan vault terenkripsi (string base64) */
export function saveVaultData(encrypted: string): void {
  lsSet(LS_KEY, encrypted);
}

/** Ambil vault terenkripsi */
export function loadVaultData(): string | null {
  return lsGet(LS_KEY);
}

/** Cek apakah vault sudah pernah disimpan (vault sudah di-setup) */
export function hasVaultData(): boolean {
  return !!lsGet(LS_KEY);
}

/** Hapus semua data vault (factory reset) */
export function clearAllVaultData(): void {
  const keys = [
    LS_KEY, LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA,
    LS_BKPIVL, LS_BKPDISM, LS_AUTOLOCK, LS_AUTOSAVE,
    LS_CATS, LS_PIN_SKIPPED,
  ];
  keys.forEach(lsRemove);
}
