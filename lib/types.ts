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

  // ── Field BARU v1.10.2 — kategori Bank: pisah Username dari No. Rekening ──
  // Sebelumnya digabung dalam satu field 'user' berlabel
  // "Username / No. Rekening". Field 'user' TETAP dipakai untuk
  // Username (data lama tidak berubah maknanya) — field baru ini
  // khusus menampung No. Rekening sebagai isian terpisah.
  bankAccountNo?: string;

  // ── Field BARU v1.10.0 — Verifikasi 2 Langkah (kategori Email) ──
  twoFAEnabled?:       boolean;
  twoFAPhone?:         string;
  twoFARecoveryEmail?: string;
  twoFABackupCodes?:   string[];

  // ── Field BARU v1.10.2 — Perluasan Verifikasi 2 Langkah ──
  // Permintaan pengguna: 5 opsi tambahan yang muncul saat
  // Verifikasi 2 Langkah aktif, di luar 3 yang sudah ada di atas
  // (nomor telepon pemulihan, email pemulihan, kode cadangan).
  twoFAVideoSelfie?:        boolean; // 1. Video selfie (fitur keamanan Google)
  twoFASecurityKey?:        string;  // 2. Kunci sandi & kunci keamanan (catatan bebas)
  twoFAAuthenticatorApp?:   boolean; // 3. Authenticator app aktif/nonaktif
  twoFAGoogleCommand?:      boolean; // 4a. Perintah Google aktif/nonaktif
  twoFAGoogleCommandDevice?: string; // 4b. Merk & tipe HP yang terhubung (hanya relevan saat 4a aktif)
  twoFAPrimaryPhone?:       string;  // 5. Nomor telepon verifikasi 2 langkah (BEDA dari twoFAPhone/pemulihan)

  // ── Field BARU v1.10.0 — Field kategori dinamis ──
  // Wadah generik untuk field KUSTOM (bukan bawaan) yang ditambahkan
  // pengguna lewat Pengaturan > Edit Kategori. Key di sini cocok
  // dengan `key` pada CategoryFieldDef yang punya locked=false/undefined
  // (field bawaan tetap disimpan di properti asli seperti user/pass/dst
  // di atas, TIDAK di sini — demi backward-compat dengan data lama).
  customFields?: Record<string, string>;
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
  color?:  string;   // v1.3.6: warna background/icon custom (hex atau CSS var). Optional — backward-compat
  // v1.10.0: daftar field form untuk kategori ini. Opsional untuk
  // backward-compat — kategori custom lama (sebelum fitur ini) tidak
  // punya field ini sama sekali; fallback ke field default kategori
  // "Lainnya" tetap berlaku (lihat getFieldsForCat di EntryForm.tsx).
  fields?: CategoryFieldDef[];
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
  // v1.10.0: kategori (default maupun custom) yang dikunci dari
  // hapus/ubah tidak sengaja. Field BARU — ditambahkan, tidak
  // mengganti lockedIds (yang tetap untuk kunci ENTRI individual).
  // Opsional supaya backup lama (tanpa field ini) tetap valid — lihat
  // fallback `?? []` di unlockVault/importBackup di vaultService.ts.
  lockedCatIds?: string[];
  // v1.10.0: override daftar field per kategori DEFAULT (Sosmed, Email,
  // dst). Kategori default sendiri tetap konstanta kode (DEFAULT_CATEGORIES),
  // TIDAK diubah — field ini murni menyimpan kustomisasi field milik
  // pengguna, terpisah per kategori by id. Kategori custom punya
  // mekanisme serupa lewat CustomCategory.fields (lihat di bawah), BUKAN
  // di sini — field ini KHUSUS kategori default karena mereka tidak
  // punya objek CustomCategory sendiri untuk menampung field custom.
  defaultCatFieldOverrides?: Record<string, CategoryFieldDef[]>;
}

/**
 * v1.10.0: Definisi satu field dalam form entri untuk sebuah kategori
 * (default maupun custom). Mengganti pendekatan lama FIELDS_BY_CAT yang
 * hardcode di kode — sekarang field per kategori adalah DATA yang bisa
 * dikustomisasi pengguna lewat menu Pengaturan > Edit Kategori.
 *
 * `key`: untuk field BAWAAN (Username/Password/URL/Catatan, dst) key
 * sama seperti nama properti asli di VaultEntry (mis. 'user', 'pass') —
 * backward-compat penuh dengan data lama. Untuk field KUSTOM baru yang
 * ditambahkan pengguna, key adalah string bebas yang menjadi kunci di
 * dalam VaultEntry.customFields (lihat field itu di interface VaultEntry).
 * `locked`: field bawaan inti (mis. field 'user'/'pass' pada kategori
 * yang belum sempat dikunci penuh) bisa ditandai locked agar tidak
 * sengaja dihapus dari daftar field kategori — independen dari
 * lockedCatIds (yang mengunci SELURUH kategori dari edit/hapus).
 *
 * v1.10.1: tipe 'multi' ditambahkan — field dengan beberapa isian
 * bernomor sekaligus (pola sama dengan seed phrase crypto / kode
 * cadangan 2FA: grid per-item ATAU satu blok teks, dipisah baris/spasi).
 * `multiCount` menentukan jumlah isian tetap untuk field ini (mis. 10).
 * Nilainya TETAP disimpan sebagai satu string di
 * VaultEntry.customFields[key] (bukan mengubah tipe customFields jadi
 * array — customFields sudah Record<string,string> dipakai luas),
 * digabung dengan pemisah baris baru saat disimpan dan dipecah lagi
 * saat dirender, pola identik codesToText/textToCodes di EntryForm.tsx.
 */
export interface CategoryFieldDef {
  key:          string;
  label:        string;
  type?:        'text' | 'password' | 'url' | 'email' | 'textarea' | 'multi';
  placeholder?: string;
  locked?:      boolean;
  multiCount?:  number;
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
  { id: 'note',    label: 'Catatan' },
];

// ─── Lock Screen State ────────────────────────────────────────────────────────

export type LockScreenView =
  | 'master'       // input master password
  | 'pin'          // input PIN (setelah setup)
  | 'setup'        // setup pertama kali
  | 'recovery'     // pemulihan via seed/recovery
  | 'biometric';   // info biometric hint
