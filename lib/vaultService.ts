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
  masterPw:        string;
  hint:            string;
  recoveryPhrase?: string;
}

interface PinStorage {
  hash:         string;   // sha256(pin)
  encMaster:    string;   // encrypt(masterPw, pin) — untuk standalone PIN unlock
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
    vault: [], meta, customCats: [], lockedIds: [], recycleBin: [],
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
    meta:       data.meta,
    customCats: data.customCats ?? [],
    lockedIds:  data.lockedIds  ?? [],
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
): Promise<void> {
  const inner: VaultBackupPayload = { vault, meta, customCats, lockedIds, recycleBin };
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

export { hasVaultData };

export function getVaultHint(): string {
  const raw = lsGetJson<VaultMeta | null>(LS_META, null);
  return raw?.hint ?? '';
}
