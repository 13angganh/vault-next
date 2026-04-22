/**
 * Vault Next — Vault Service
 * Operasi tingkat tinggi: simpan, muat, unlock, setup, PIN.
 * Semua crypto lewat lib/crypto.ts, storage lewat lib/storage.ts.
 */

import { encrypt, decrypt, sha256, hashStr } from '@/lib/crypto';
import {
  lsGet, lsSet, lsRemove, lsGetJson, lsSetJson,
  saveVaultData, loadVaultData, hasVaultData,
  LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA, LS_PIN_SKIPPED,
} from '@/lib/storage';
import type {
  VaultEntry, VaultMeta, CustomCategory,
  VaultBackup, VaultBackupPayload,
} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnlockPayload {
  vault:      VaultEntry[];
  recycleBin: VaultEntry[];
  meta:       VaultMeta;
  customCats: CustomCategory[];
  lockedIds:  string[];
}

export interface SetupPayload {
  masterPw:    string;
  hint:        string;
  recoveryPhrase?: string;  // opsional
}

// ─── Setup Pertama Kali ───────────────────────────────────────────────────────

/**
 * Inisialisasi vault baru.
 * Buat vault kosong, simpan terenkripsi, simpan meta.
 */
export async function setupVault(payload: SetupPayload): Promise<void> {
  const { masterPw, hint, recoveryPhrase } = payload;

  const meta: VaultMeta = {
    hint,
    recoveryHash: recoveryPhrase ? await hashStr(recoveryPhrase.trim().toLowerCase()) : '',
    recovery:     '',
    encMasterBySeed: recoveryPhrase
      ? await encrypt(masterPw, recoveryPhrase.trim().toLowerCase())
      : '',
  };

  const inner: VaultBackupPayload = {
    vault:      [],
    meta,
    customCats: [],
    lockedIds:  [],
    recycleBin: [],
  };

  const ciphertext = await encrypt(JSON.stringify(inner), masterPw);
  saveVaultData(ciphertext);
  lsSetJson(LS_META, meta);
}

// ─── Unlock ───────────────────────────────────────────────────────────────────

/**
 * Coba unlock vault dengan master password.
 * Throws jika password salah atau data korup.
 * Returns UnlockPayload jika berhasil.
 */
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
    meta:       data.meta,
    customCats: data.customCats ?? [],
    lockedIds:  data.lockedIds  ?? [],
  };
}

// ─── Save (auto-save) ─────────────────────────────────────────────────────────

/**
 * Simpan state vault ke localStorage (re-enkripsi).
 */
export async function saveVault(
  masterPw: string,
  vault: VaultEntry[],
  recycleBin: VaultEntry[],
  meta: VaultMeta,
  customCats: CustomCategory[],
  lockedIds: string[],
): Promise<void> {
  const inner: VaultBackupPayload = { vault, meta, customCats, lockedIds, recycleBin };
  const ciphertext = await encrypt(JSON.stringify(inner), masterPw);
  saveVaultData(ciphertext);
}

// ─── PIN ──────────────────────────────────────────────────────────────────────

/** Setup PIN baru (simpan ter-hash) */
export async function setupPin(pin: string): Promise<void> {
  const hashed = await sha256(pin);
  lsSet(LS_PIN, hashed);
}

/** Verifikasi PIN — return true jika cocok */
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = lsGet(LS_PIN);
  if (!stored) return false;
  const hashed = await sha256(pin);
  return hashed === stored;
}

/** Cek apakah PIN sudah di-setup */
export function hasPinSetup(): boolean {
  return !!lsGet(LS_PIN);
}

/** Skip setup PIN */
export function skipPinSetup(): void {
  lsSet(LS_PIN_SKIPPED, 'true');
}

export function isPinSkipped(): boolean {
  return lsGet(LS_PIN_SKIPPED) === 'true';
}

// ─── Recovery ─────────────────────────────────────────────────────────────────

/**
 * Coba recover master password via recovery phrase.
 * Returns master password jika berhasil, throws jika gagal.
 */
export async function recoverMasterPw(recoveryPhrase: string): Promise<string> {
  const raw = lsGetJson<VaultMeta | null>(LS_META, null);
  if (!raw || !raw.encMasterBySeed) throw new Error('Recovery phrase tidak dikonfigurasi');

  const normalized = recoveryPhrase.trim().toLowerCase();
  const hash = await hashStr(normalized);

  if (hash !== raw.recoveryHash) throw new Error('Recovery phrase salah');

  try {
    return await decrypt(raw.encMasterBySeed, normalized);
  } catch {
    throw new Error('Gagal mendekripsi data recovery');
  }
}

// ─── Backup Export ────────────────────────────────────────────────────────────

/**
 * Buat file backup .vault (format vault2).
 * Returns object yang siap di-JSON.stringify dan di-download.
 */
export async function exportBackup(
  masterPw: string,
  vault: VaultEntry[],
  recycleBin: VaultEntry[],
  meta: VaultMeta,
  customCats: CustomCategory[],
  lockedIds: string[],
): Promise<VaultBackup> {
  const inner: VaultBackupPayload = { vault, meta, customCats, lockedIds, recycleBin };
  const data = await encrypt(JSON.stringify(inner), masterPw);

  const backup: VaultBackup = {
    format:     'vault2',
    hint:       meta.hint,
    data,
    count:      vault.length,
    exportedAt: new Date().toISOString(),
  };

  // Simpan timestamp backup terakhir
  lsSet(LS_BACKUP, String(Date.now()));
  lsSet(LS_BKPDATA, JSON.stringify(backup));

  return backup;
}

// ─── Backup Import ────────────────────────────────────────────────────────────

/**
 * Import backup .vault.
 * Validasi format, dekripsi, return payload.
 * Throws jika format invalid atau password salah.
 */
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

  let plain: string;
  try {
    plain = await decrypt(backup.data, masterPw);
  } catch {
    throw new Error('Password salah atau file rusak');
  }

  const data = JSON.parse(plain) as VaultBackupPayload;
  return {
    vault:      data.vault      ?? [],
    recycleBin: data.recycleBin ?? [],
    meta:       data.meta,
    customCats: data.customCats ?? [],
    lockedIds:  data.lockedIds  ?? [],
  };
}

// ─── Util ─────────────────────────────────────────────────────────────────────

/** Cek apakah vault sudah pernah dibuat */
export { hasVaultData };

/** Ambil hint dari meta (tanpa unlock) */
export function getVaultHint(): string {
  const raw = lsGetJson<VaultMeta | null>(LS_META, null);
  return raw?.hint ?? '';
}
