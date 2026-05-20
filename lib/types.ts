/**
 * Vault Next — Shared Types
 * Schema entri BEKU setelah Sesi 4. Jangan ubah field lama.
 */

// ─── VaultEntry ───────────────────────────────────────────────────────────────

export interface VaultEntry {
  // ── Field LAMA — tidak boleh diubah ──
  id:          string;
  cat:         string;
  name:        string;
  user?:       string;
  pass?:       string;
  url?:        string;
  note?:       string;
  network?:    string;
  walletAddr?: string;
  walletPw?:   string;
  seedPhrase?: string[];
  fav?:        boolean;
  ts?:         number;

  // ── Field BARU — ditambahkan, tidak mengganti ──
  cardNo?:     string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCVV?:    string;
  wifiSSID?:   string;
  wifiPass?:   string;
  emailAddr?:  string;
}

// ─── VaultMeta ────────────────────────────────────────────────────────────────

export interface VaultMeta {
  hint:              string;
  recoveryHash:      string;   // sha256 dari recovery phrase
  recovery:          string;   // recovery phrase terenkripsi (opsional)
  encMasterBySeed:   string;   // master password dienkripsi oleh seed phrase
}

// ─── Custom Category ──────────────────────────────────────────────────────────

export interface CustomCategory {
  id:      string;
  label:   string;
  emoji:   string;   // Sesi D: diisi dengan iconKey (nama Lucide icon), bukan emoji literal
                     // Backward-compat: jika berisi emoji char lama, CategoryIcon fallback ke Tag
  iconKey: string;   // canonical key — dipakai Sesi D+
}

// ─── Backup Format ────────────────────────────────────────────────────────────

export interface VaultBackup {
  format:     'vault2';
  hint:       string;
  data:       string;           // ciphertext base64
  count:      number;
  exportedAt: string;           // ISO string
}

/** Isi plaintext yang dienkripsi di VaultBackup.data */
export interface VaultBackupPayload {
  vault:      VaultEntry[];
  meta:       VaultMeta;
  customCats: CustomCategory[];
  lockedIds:  string[];
  recycleBin: VaultEntry[];
}

// ─── Kategori Default ─────────────────────────────────────────────────────────

export interface CategoryDef {
  id:    string;
  label: string;
  emoji?: string; // opsional — default cat pakai Lucide via CategoryIcon
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'sosmed',  label: 'Sosmed'  },
  { id: 'email',   label: 'Email'   },
  { id: 'bank',    label: 'Bank'    },
  { id: 'game',    label: 'Game'    },
  { id: 'crypto',  label: 'Crypto'  },
  { id: 'kartu',   label: 'Kartu'   },
  { id: 'wifi',    label: 'Wi-Fi'   },
  { id: 'lainnya', label: 'Lainnya' },
];

// ─── Lock Screen State ────────────────────────────────────────────────────────

export type LockScreenView =
  | 'master'       // input master password
  | 'pin'          // input PIN (setelah setup)
  | 'setup'        // setup pertama kali
  | 'recovery'     // pemulihan via seed/recovery
  | 'biometric';   // info biometric hint
