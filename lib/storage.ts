/**
 * SSR-safe localStorage wrapper
 * Semua access ke localStorage wajib melalui fungsi ini
 */

export const storage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage penuh atau diblokir
      console.warn(`[Vault] Gagal menyimpan key: ${key}`);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  },

  /** Ambil nilai dan parse JSON, kembalikan null jika gagal */
  getJSON<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** Simpan nilai sebagai JSON */
  setJSON<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  },
};

// Key constants
export const STORAGE_KEYS = {
  THEME: 'vault_theme',
  PIN_HASH: 'vault_pin_hash',
  MASTER_PW_HASH: 'vault_master_pw_hash',
  SEED_PHRASE: 'vault_seed_phrase',
  VAULT_DATA: 'vault_data',
  SALT: 'vault_salt',
  SESSION_EXPIRY: 'vault_session_expiry',
  SETUP_COMPLETE: 'vault_setup_complete',
} as const;
