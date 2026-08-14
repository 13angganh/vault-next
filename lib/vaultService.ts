/**
 * Vault Next — Vault Service
 * Operasi tingkat tinggi: simpan, muat, unlock, setup, PIN.
 * Semua crypto lewat lib/crypto.ts, storage lewat lib/storage.ts.
 *
 * FIX Sesi 6B:
 * - setupPin sekarang menyimpan encMasterByPin (PIN bisa standalone unlock vault)
 * - verifyPinAndGetMaster — return master password jika PIN benar
 * - Seed phrase login langsung (bukan hanya reset)
 */

import { encrypt, decrypt, decryptLegacy, sha256, hashStr } from '@/lib/crypto';
import {
  lsGet, lsSet, lsRemove, lsGetJson, lsSetJson,
  saveVaultData, loadVaultData, hasVaultData,
  LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA, LS_PIN_SKIPPED,
} from '@/lib/storage';
import type {
  VaultEntry, VaultMeta, CustomCategory, CategoryFieldDef,
  VaultBackup, VaultBackupPayload,
} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnlockPayload {
  vault:      VaultEntry[];
  recycleBin: VaultEntry[];
  meta:       VaultMeta;
  customCats: CustomCategory[];
  lockedIds:  string[];
  lockedCatIds: string[];
  // v1.10.0: lihat catatan lengkap di VaultBackupPayload (lib/types.ts).
  defaultCatFieldOverrides: Record<string, CategoryFieldDef[]>;
}

export interface SetupPayload {
  masterPw:        string;
  hint:            string;
  recoveryPhrase?: string;
}

interface PinStorage {
  hash:         string;   // sha256(pin)
  encMaster:    string;   // encrypt(masterPw, pin) — untuk standalone PIN unlock
}

// ─── Util: normalisasi VaultMeta dari backup lama ────────────────────────────
// Backup lama (vault-private-offline) mungkin tidak punya field recovery/encMasterBySeed

function normalizeMeta(raw: Partial<VaultMeta>): VaultMeta {
  return {
    hint:            raw.hint            ?? '',
    recoveryHash:    raw.recoveryHash    ?? '',
    recovery:        raw.recovery        ?? '',
    encMasterBySeed: raw.encMasterBySeed ?? '',
  };
}

// ─── Setup Pertama Kali ───────────────────────────────────────────────────────

export async function setupVault(payload: SetupPayload): Promise<void> {
  const { masterPw, hint, recoveryPhrase } = payload;

  const meta: VaultMeta = {
    hint,
    recoveryHash:    recoveryPhrase ? await hashStr(recoveryPhrase.trim().toLowerCase()) : '',
    recovery:        '',
    encMasterBySeed: recoveryPhrase
      ? await encrypt(masterPw, recoveryPhrase.trim().toLowerCase())
      : '',
  };

  const inner: VaultBackupPayload = {
    vault: [], meta, customCats: [], lockedIds: [], recycleBin: [], lockedCatIds: [],
    defaultCatFieldOverrides: {},
  };

  const ciphertext = await encrypt(JSON.stringify(inner), masterPw);
  saveVaultData(ciphertext);
  lsSetJson(LS_META, meta);
}

// ─── Unlock ───────────────────────────────────────────────────────────────────

export async function unlockVault(masterPw: string): Promise<UnlockPayload> {
  const ciphertext = loadVaultData();
  if (!ciphertext) throw new Error('Vault belum dibuat');

  let plain: string;
  try {
    plain = await decrypt(ciphertext, masterPw);
  } catch {
    throw new Error('Password salah');
  }

  const data = JSON.parse(plain) as VaultBackupPayload;
  return {
    vault:      data.vault      ?? [],
    recycleBin: data.recycleBin ?? [],
    meta:       normalizeMeta(data.meta ?? {}),
    customCats: data.customCats ?? [],
    lockedIds:  data.lockedIds  ?? [],
    lockedCatIds: data.lockedCatIds ?? [],
    defaultCatFieldOverrides: data.defaultCatFieldOverrides ?? {},
  };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveVault(
  masterPw: string,
  vault: VaultEntry[],
  recycleBin: VaultEntry[],
  meta: VaultMeta,
  customCats: CustomCategory[],
  lockedIds: string[],
  // v1.10.0: parameter opsional dengan default [] — supaya SEMUA
  // pemanggilan saveVault yang sudah ada (16 titik di seluruh
  // komponen sebelum fix ini) tetap valid tanpa perlu diedit satu per
  // satu. Hanya titik yang benar-benar mengubah lock kategori (di
  // CategoryManager.tsx) yang perlu mengirim nilai sungguhan.
  lockedCatIds: string[] = [],
  // v1.10.0: sama seperti lockedCatIds di atas — opsional dengan
  // default {}. PENTING: setiap pemanggilan saveVault(store...) yang
  // TIDAK menyertakan parameter ini akan menimpa override field
  // kategori default milik pengguna jadi kosong secara diam-diam —
  // pelajaran dari celah data-loss lockedCatIds yang sempat ditemukan
  // & diperbaiki di 11 titik sebelum fitur ini. Setiap pemanggilan
  // saveVault(store...) di seluruh proyek WAJIB menyertakan
  // store.defaultCatFieldOverrides — diverifikasi dengan script
  // penghitung argumen struktural, bukan grep manual saja.
  defaultCatFieldOverrides: Record<string, CategoryFieldDef[]> = {},
): Promise<void> {
  const inner: VaultBackupPayload = {
    vault, meta, customCats, lockedIds, recycleBin, lockedCatIds, defaultCatFieldOverrides,
  };
  const ciphertext = await encrypt(JSON.stringify(inner), masterPw);
  saveVaultData(ciphertext);
}

// ─── PIN ──────────────────────────────────────────────────────────────────────

/**
 * Setup PIN — simpan hash + encMasterByPin agar PIN bisa standalone unlock vault.
 * masterPw wajib diberikan saat setup/ganti PIN.
 */
export async function setupPin(pin: string, masterPw: string): Promise<void> {
  const hash      = await sha256(pin);
  const encMaster = await encrypt(masterPw, pin);
  const stored: PinStorage = { hash, encMaster };
  lsSet(LS_PIN, JSON.stringify(stored));
}

/**
 * Verifikasi PIN.
 * Returns master password jika PIN benar (untuk langsung unlock vault).
 * Throws jika PIN salah.
 */
export async function verifyPinAndGetMaster(pin: string): Promise<string> {
  const raw = lsGet(LS_PIN);
  if (!raw) throw new Error('PIN belum dikonfigurasi');

  let stored: PinStorage;
  try {
    stored = JSON.parse(raw) as PinStorage;
  } catch {
    // Format lama (hanya hash string) — PIN tidak bisa standalone unlock
    throw new Error('Format PIN lama, setup ulang PIN dari Pengaturan');
  }

  const hash = await sha256(pin);
  if (hash !== stored.hash) throw new Error('PIN salah');

  try {
    return await decrypt(stored.encMaster, pin);
  } catch {
    throw new Error('Gagal mendekripsi dengan PIN ini');
  }
}

/** Verifikasi PIN — return boolean (untuk settings panel) */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    await verifyPinAndGetMaster(pin);
    return true;
  } catch {
    return false;
  }
}

export function hasPinSetup(): boolean {
  return !!lsGet(LS_PIN);
}

export function skipPinSetup(): void {
  lsSet(LS_PIN_SKIPPED, 'true');
}

export function isPinSkipped(): boolean {
  return lsGet(LS_PIN_SKIPPED) === 'true';
}

/** Hapus PIN */
export function removePin(): void {
  lsRemove(LS_PIN);
  lsRemove(LS_PIN_SKIPPED);
}

// ─── Recovery (Seed Phrase) ───────────────────────────────────────────────────

/**
 * Login langsung via seed phrase — return master password.
 * Vault langsung bisa dibuka tanpa reset apapun.
 */
export async function recoverMasterPw(recoveryPhrase: string): Promise<string> {
  const raw = lsGetJson<VaultMeta | null>(LS_META, null);
  if (!raw || !raw.encMasterBySeed) {
    throw new Error('Recovery phrase belum dikonfigurasi di vault ini');
  }

  const normalized = recoveryPhrase.trim().toLowerCase();

  // Verifikasi hash dulu
  if (raw.recoveryHash) {
    const hash = await hashStr(normalized);
    if (hash !== raw.recoveryHash) {
      throw new Error('Recovery phrase salah');
    }
  }

  try {
    return await decrypt(raw.encMasterBySeed, normalized);
  } catch {
    throw new Error('Gagal mendekripsi — recovery phrase tidak cocok');
  }
}

// ─── Backup Export ────────────────────────────────────────────────────────────

export async function exportBackup(
  masterPw: string,
  vault: VaultEntry[],
  recycleBin: VaultEntry[],
  meta: VaultMeta,
  customCats: CustomCategory[],
  lockedIds: string[],
  // v1.10.0: sama seperti saveVault — opsional dengan default agar
  // pemanggilan lama tetap valid tanpa diedit.
  lockedCatIds: string[] = [],
  defaultCatFieldOverrides: Record<string, CategoryFieldDef[]> = {},
): Promise<VaultBackup> {
  const inner: VaultBackupPayload = {
    vault, meta, customCats, lockedIds, recycleBin, lockedCatIds, defaultCatFieldOverrides,
  };
  const data = await encrypt(JSON.stringify(inner), masterPw);

  const backup: VaultBackup = {
    format:     'vault2',
    hint:       meta.hint,
    data,
    count:      vault.length,
    exportedAt: new Date().toISOString(),
  };

  lsSet(LS_BACKUP, String(Date.now()));
  lsSet(LS_BKPDATA, JSON.stringify(backup));

  return backup;
}

// ─── Backup Import ────────────────────────────────────────────────────────────

export async function importBackup(
  fileContent: string,
  masterPw: string,
): Promise<UnlockPayload> {
  let backup: VaultBackup;
  try {
    backup = JSON.parse(fileContent) as VaultBackup;
  } catch {
    throw new Error('File backup tidak valid (bukan JSON)');
  }

  if (backup.format !== 'vault2') {
    throw new Error(`Format tidak dikenal: ${(backup as { format?: string }).format ?? 'unknown'}`);
  }

  let plain: string | null = null;

  // Coba format baru (Vault Next) dulu
  try {
    plain = await decrypt(backup.data, masterPw);
  } catch {
    // Format baru gagal — coba format lama (vault-private-offline)
    try {
      plain = await decryptLegacy(backup.data, masterPw);
    } catch {
      throw new Error('Password salah. Pastikan password yang kamu masukkan sama dengan saat backup dibuat.');
    }
  }

  const data = JSON.parse(plain) as VaultBackupPayload;
  return {
    vault:      data.vault      ?? [],
    recycleBin: data.recycleBin ?? [],
    meta:       normalizeMeta(data.meta ?? {}),
    customCats: data.customCats ?? [],
    lockedIds:  data.lockedIds  ?? [],
    lockedCatIds: data.lockedCatIds ?? [],
    defaultCatFieldOverrides: data.defaultCatFieldOverrides ?? {},
  };
}

// ─── Util ─────────────────────────────────────────────────────────────────────

export { hasVaultData };

export function getVaultHint(): string {
  const raw = lsGetJson<VaultMeta | null>(LS_META, null);
  return raw?.hint ?? '';
}
