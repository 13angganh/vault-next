/**
 * lib/__tests__/dataCompat.test.ts — Aurum Vault v2.0.0 (Tahap 1)
 *
 * KONTRAK KOMPATIBILITAS DATA v1.11.0 → v2.0.0.
 * Pengguna lama dan backup lama HARUS tetap berfungsi tanpa migrasi.
 *
 * Fixture di ./fixtures DIHASILKAN OLEH KODE v1.11.0 ASLI (bukan ditulis tangan),
 * berisi DATA PALSU. Jangan pernah mengganti dengan backup/password asli.
 *   - backup-v1_11_0.vault.json        : hasil exportBackup() v1.11.0
 *   - storage-snapshot-v1_11_0.json    : isi localStorage setelah setupVault+setupPin+saveVault v1.11.0
 *   - v1-brand-slugs.json              : 121 slug brand di lib/brand-icons.ts v1.11.0
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import React from 'react';

import {
  unlockVault, importBackup, exportBackup, verifyPinAndGetMaster, hasPinSetup,
  recoverMasterPw, removePin, setupVault, type UnlockPayload,
} from '../vaultService';
import { decrypt, hashStr } from '../crypto';
import * as storage from '../storage';
import { getPinLength, setPinLength } from '../pinLength';
import { useNavMode } from '../navMode';
import { generateRecoveryPhrase, RECOVERY_WORD_COUNT } from '../recoveryPhrase';
import { getBrandIconBySlug } from '../brand-icons';
import { EntryIcon } from '@/components/entries/EntryIcon';
import type { VaultEntry } from '../types';

const ROOT = process.cwd();
const FX = path.join(ROOT, 'lib/__tests__/fixtures');
const readFx = (n: string) => fs.readFileSync(path.join(FX, n), 'utf-8');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
/** Hash isi file dengan CRLF dinormalisasi ke LF (checkout Windows tidak boleh membuat test gagal). */
const fileSha = (rel: string, norm: (s: string) => string = (s) => s) =>
  sha(norm(fs.readFileSync(path.join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')));

/** Ambil nilai wajib; gagal jelas (bukan TypeError samar) bila ternyata kosong. */
function must<T>(v: T | null | undefined, what: string): T {
  if (v === null || v === undefined) throw new Error(`nilai wajib tidak ada: ${what}`);
  return v;
}
const entryOf = (p: UnlockPayload, id: string): VaultEntry => must(p.vault.find((e) => e.id === id), `entri ${id}`);
const metaRaw = (): Record<string, string> => JSON.parse(must(localStorage.getItem('vault_meta'), 'vault_meta'));

const BACKUP_V1 = readFx('backup-v1_11_0.vault.json');
const SNAP = JSON.parse(readFx('storage-snapshot-v1_11_0.json')) as {
  masterPw: string; pin: string; phrase: string; hint: string;
  localStorage: Record<string, string>;
  expected: { entryIds: string[]; binIds: string[]; lockedIds: string[]; lockedCatIds: string[]; customCatIds: string[]; customNetworkIds: string[] };
};
const V1_SLUGS = JSON.parse(readFx('v1-brand-slugs.json')) as string[];

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 1 — file BEKU & konfigurasi identik dengan v1.11.0 (SHA-256)', () => {
  const FROZEN: Record<string, string> = {
    'lib/types.ts':       '4322df6d6d4849fee2c12f2d31a93a71eb129a5655e0ebfbfe49dc29e260d61e',
    'lib/crypto.ts':      'bc32b349128399d2ee0746180d662a9406be08f2eb0dfce7e76038b534950cc1',
    'lib/storage.ts':     '8231d3d760b22780e3b3e8f2084a572da7fbfaefe26fbd68c3b6906903c38a18',
    'package-lock.json':  '375f56d236c45c1ce954dc5717c1ca81ee881acbd974e52281eba958cbf6a8dc',
    'vercel.json':        '92c28f06ff8c497bcc296364138ea79bed60537f3bf2060fd925cc8962959fd8',
    'next.config.js':     'a3855463a373541a66b566708d3c6964ff80b937541d3148c22b4bffbdd51fbd',
    'eslint.config.mjs':  '83e7a5fd48aa6fe057ede8a8d776b274e3d66eba5fff1719d16683c22f86d030',
    'vitest.config.ts':   '61fa5a7ac6c65b127102a8d5c141e6770a9e2e2d0de58430a9ee42eefbe58087',
  };
  for (const [rel, expected] of Object.entries(FROZEN)) {
    it(`${rel} identik byte-per-byte dengan v1.11.0`, () => {
      expect(fileSha(rel)).toBe(expected);
    });
  }

  it('public/sw.js identik dengan v1.11.0 selain baris CACHE_VER (diubah hanya lewat npm run sw-version)', () => {
    const neutral = (s: string) => s.replace(/^const CACHE_VER .*$/m, 'CACHE_VER_LINE');
    expect(fileSha('public/sw.js', neutral)).toBe('bf24b4bab7cc23d68889e7e725124f1466735b8e91e68cbb19e76d8d227aabbe');
  });

  it('package.json: skrip npm + dependencies + devDependencies tidak berubah (tanpa dependensi baru)', () => {
    const pk = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const canon = JSON.stringify({ scripts: pk.scripts, dependencies: pk.dependencies, devDependencies: pk.devDependencies });
    expect(sha(canon)).toBe('80a717f9b9cacb692d05c8ffbcc55dca40dcd15f5c9295cea8ee6936f20f3df4');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 2 — kunci penyimpanan: yang ada tidak berubah, hanya 2 kunci baru', () => {
  const EXISTING_19 = [
    'vault_data', 'vault_meta', 'vault_pin', 'vault_theme', 'vault_bkp_ts', 'vault_bkp_data', 'vault_bkp_ivl',
    'vault_bkp_dism', 'vault_autolock', 'vault_autosave', 'vault_cats', 'vault_networks', 'vault_pin_skip',
    'vault_bio_enabled', 'vault_bio_cred', 'vault_bio_sess', 'vault_ss_mpw', 'vault_pin_attempts', 'vault_pin_locked_until',
  ];

  it('konstanta di lib/storage.ts memuat tepat 19 kunci yang sama (nama & nilai)', () => {
    const values = Object.entries(storage)
      .filter(([k, v]) => /^(LS_|SS_)/.test(k) && typeof v === 'string')
      .map(([, v]) => v as string).sort();
    expect(values).toEqual([...EXISTING_19].sort());
  });

  it('seluruh literal "vault_*" di kode sumber ⊆ 19 kunci lama + vault_splash_shown (sudah ada di v1) + 2 kunci baru', () => {
    const allowed = new Set([...EXISTING_19, 'vault_splash_shown', 'vault_nav_mode', 'vault_pin_len']);
    const found = new Map<string, string[]>();
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = path.posix.join(dir, ent.name);
        if (ent.isDirectory()) { if (ent.name !== '__tests__' && ent.name !== 'node_modules') walk(rel); continue; }
        if (!/\.(ts|tsx)$/.test(ent.name)) continue;
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
        for (const m of src.matchAll(/['"`](vault_[a-z_]+)['"`]/g)) found.set(m[1], [...(found.get(m[1]) ?? []), rel]);
      }
    };
    ['app', 'components', 'lib'].forEach(walk);
    const unexpected = [...found.keys()].filter((k) => !allowed.has(k));
    expect(unexpected).toEqual([]);
  });

  it('vault_pin_len & vault_nav_mode ditulis dengan nama dan format yang dijanjikan', () => {
    setPinLength(4);  expect(localStorage.getItem('vault_pin_len')).toBe('4');
    setPinLength(6);  expect(localStorage.getItem('vault_pin_len')).toBe('6');
    useNavMode.getState().setMode('sidebar'); expect(localStorage.getItem('vault_nav_mode')).toBe('sidebar');
    useNavMode.getState().setMode('bottom');  expect(localStorage.getItem('vault_nav_mode')).toBe('bottom');
  });

  it('vault_pin_len ABSEN = PIN lama (null, panjang bebas 4–8); nilai tak dikenal diperlakukan sama', () => {
    expect(getPinLength()).toBeNull();
    localStorage.setItem('vault_pin_len', '5'); expect(getPinLength()).toBeNull();
    localStorage.setItem('vault_pin_len', '4'); expect(getPinLength()).toBe(4);
    localStorage.setItem('vault_pin_len', '6'); expect(getPinLength()).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 3 — backup yang dibuat v1.11.0 dapat diimpor v2 (dan sebaliknya: envelope sama)', () => {
  it('backup v1.11.0 diimpor v2: seluruh isi utuh (entri, sampah, kategori, kunci, override, jaringan)', async () => {
    const p: UnlockPayload = await importBackup(BACKUP_V1, SNAP.masterPw);
    expect(p.vault.map((e) => e.id)).toEqual(SNAP.expected.entryIds);
    expect(p.recycleBin.map((e) => e.id)).toEqual(SNAP.expected.binIds);
    expect(p.lockedIds).toEqual(SNAP.expected.lockedIds);
    expect(p.lockedCatIds).toEqual(SNAP.expected.lockedCatIds);
    expect(p.customCats.map((c) => c.id)).toEqual(SNAP.expected.customCatIds);
    expect(p.customNetworks.map((n) => n.id)).toEqual(SNAP.expected.customNetworkIds);
    expect(p.defaultCatFieldOverrides.email?.[0]?.label).toBe('Nama Pengguna');
    expect(p.meta.hint).toBe(SNAP.hint);
    // field tambahan v1.10.x/1.11.0 tidak hilang
    const gmail = entryOf(p, 'u1');
    expect(gmail.twoFABackupCodes).toEqual(['AAAA-1111', 'BBBB-2222']);
    expect(gmail.brandIconSlug).toBe('gmail');
    expect(entryOf(p, 'u2').walletNetworks?.[0]?.addresses).toHaveLength(1);
    expect(entryOf(p, 'u5').bankAccountNo).toBe('000111222333');
  }, 60000);

  it('slug brand TIDAK dikenal / sudah dihapus di v2 tetap tersimpan apa adanya (tidak dibuang saat impor)', async () => {
    const p = await importBackup(BACKUP_V1, SNAP.masterPw);
    expect(entryOf(p, 'u3').brandIconSlug).toBe('trello');
    expect(entryOf(p, 'u4').brandIconSlug).toBe('protonmail');
    expect(entryOf(p, 'u7').brandIconSlug).toBe('slug-tidak-ada-xyz');
  }, 60000);

  it('password salah ditolak dengan pesan yang sama seperti v1', async () => {
    await expect(importBackup(BACKUP_V1, 'salah-total')).rejects.toThrow(/Password salah/);
  }, 60000);

  it('backup yang dibuat v2 punya envelope SAMA dengan v1 (urutan kunci, format, tipe) dan payload dalam berstruktur sama', async () => {
    const p = await importBackup(BACKUP_V1, SNAP.masterPw);
    const out = await exportBackup(SNAP.masterPw, p.vault, p.recycleBin, p.meta, p.customCats, p.lockedIds,
      p.lockedCatIds, p.defaultCatFieldOverrides, p.customNetworks);
    const v1env = JSON.parse(BACKUP_V1);

    expect(Object.keys(out)).toEqual(Object.keys(v1env));              // format, hint, data, count, exportedAt
    expect(Object.keys(out)).toEqual(['format', 'hint', 'data', 'count', 'exportedAt']);
    expect(out.format).toBe('vault2');
    expect(typeof out.data).toBe('string');
    expect(out.count).toBe(v1env.count);
    expect(out.hint).toBe(v1env.hint);
    expect(Number.isNaN(Date.parse(out.exportedAt))).toBe(false);

    const innerV1 = JSON.parse(await decrypt(v1env.data, SNAP.masterPw));
    const innerV2 = JSON.parse(await decrypt(out.data, SNAP.masterPw));
    expect(Object.keys(innerV2).sort()).toEqual(Object.keys(innerV1).sort());
    expect(innerV2.vault).toEqual(innerV1.vault);                       // entri tidak berubah satu byte pun
    expect(innerV2.recycleBin).toEqual(innerV1.recycleBin);
    expect(innerV2.customCats).toEqual(innerV1.customCats);
  }, 120000);

  it('format selain "vault2" ditolak (kontrak envelope tidak dilonggarkan)', async () => {
    const bad = JSON.stringify({ ...JSON.parse(BACKUP_V1), format: 'vault3' });
    await expect(importBackup(bad, SNAP.masterPw)).rejects.toThrow(/Format tidak dikenal/);
  });

  it('nama file unduhan backup (.vault) & ekspor PDF tidak berubah', () => {
    const modal = fs.readFileSync(path.join(ROOT, 'components/settings/BackupModal.tsx'), 'utf-8');
    const pdf   = fs.readFileSync(path.join(ROOT, 'lib/exportPdf.ts'), 'utf-8');
    expect(modal).toContain('a.download = `vault-backup-${ts}.vault`;');
    expect(pdf).toContain('a.download=`vault-backup-${new Date().toISOString().slice(0,10)}.pdf`;');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 4 — vault pengguna lama (localStorage hasil v1.11.0) tetap terbuka di v2', () => {
  const loadSnapshot = () => { for (const [k, v] of Object.entries(SNAP.localStorage)) localStorage.setItem(k, v); };

  it('snapshot v1.11.0 TIDAK memuat kunci baru v2 (tanpa migrasi, tanpa penulisan ulang)', () => {
    expect(Object.keys(SNAP.localStorage)).not.toContain('vault_pin_len');
    expect(Object.keys(SNAP.localStorage)).not.toContain('vault_nav_mode');
  });

  it('unlock dengan master password: seluruh isi terbaca', async () => {
    loadSnapshot();
    const p = await unlockVault(SNAP.masterPw);
    expect(p.vault.map((e) => e.id)).toEqual(SNAP.expected.entryIds);
    expect(p.lockedIds).toEqual(SNAP.expected.lockedIds);
    await expect(unlockVault('salah-total')).rejects.toThrow(/Password salah/);
  }, 60000);

  it('PIN lama 5 digit tetap bisa membuka (vault_pin_len absen → getPinLength() null)', async () => {
    loadSnapshot();
    expect(hasPinSetup()).toBe(true);
    expect(getPinLength()).toBeNull();
    expect(SNAP.pin).toHaveLength(5);
    expect(await verifyPinAndGetMaster(SNAP.pin)).toBe(SNAP.masterPw);
    await expect(verifyPinAndGetMaster('00000')).rejects.toThrow(/PIN salah/);
  }, 60000);

  it('recovery phrase LAMA yang diketik manual (huruf campur, spasi tepi) tetap memulihkan master password', async () => {
    loadSnapshot();
    expect(await recoverMasterPw(SNAP.phrase)).toBe(SNAP.masterPw);                       // persis seperti diketik dulu
    expect(await recoverMasterPw(SNAP.phrase.trim().toLowerCase())).toBe(SNAP.masterPw);  // sudah dinormalisasi
    expect(await recoverMasterPw('KATA PERTAMA KEDUA KETIGA KEEMPAT KELIMA KEENAM\n')).toBe(SNAP.masterPw);
    await expect(recoverMasterPw('kata salah semua')).rejects.toThrow(/Recovery phrase salah/);
  }, 120000);

  it('removePin menghapus vault_pin, vault_pin_skip DAN vault_pin_len', async () => {
    loadSnapshot();
    setPinLength(6);
    localStorage.setItem('vault_pin_skip', 'true');
    removePin();
    expect(localStorage.getItem('vault_pin')).toBeNull();
    expect(localStorage.getItem('vault_pin_skip')).toBeNull();
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
    expect(hasPinSetup()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 5 — vault BARU (frasa 5 kata otomatis) memakai skema hash/enkripsi yang SAMA', () => {
  it('frasa otomatis: 5 kata huruf kecil; hash recovery = hashStr(trim+lowercase) seperti v1; pulih meski huruf berbeda', async () => {
    const phrase = generateRecoveryPhrase();
    expect(RECOVERY_WORD_COUNT).toBe(5);
    expect(phrase.split(' ')).toHaveLength(5);
    expect(phrase).toBe(phrase.toLowerCase());

    await setupVault({ masterPw: 'Pw-Baru-V2!', hint: 'h', recoveryPhrase: phrase });
    const meta = metaRaw();
    expect(meta.recoveryHash).toBe(await hashStr(phrase.trim().toLowerCase()));
    expect(await recoverMasterPw(`  ${phrase.toUpperCase()}  `)).toBe('Pw-Baru-V2!');
  }, 60000);

  it('skema hash identik dengan v1.11.0: hash frasa lama di snapshot v1 = hashStr(frasa ternormalisasi) di v2', async () => {
    const metaV1 = JSON.parse(SNAP.localStorage['vault_meta']);
    expect(metaV1.recoveryHash).toBe(await hashStr(SNAP.phrase.trim().toLowerCase()));
  });

  it('setupVault v2 dengan frasa yang SAMA (huruf campur + spasi tepi) menghasilkan recoveryHash PERSIS sama dengan yang dibuat v1.11.0', async () => {
    // Frasa 5 kata otomatis sudah huruf kecil, sehingga normalisasi tidak terlihat di sana.
    // Tes ini memaksa jalur normalisasi (trim + lowercase) di setupVault ikut diuji.
    const metaV1 = JSON.parse(SNAP.localStorage['vault_meta']);
    await setupVault({ masterPw: SNAP.masterPw, hint: SNAP.hint, recoveryPhrase: SNAP.phrase });
    const metaV2 = metaRaw();
    expect(metaV2.recoveryHash).toBe(metaV1.recoveryHash);
    expect(Object.keys(metaV2).sort()).toEqual(Object.keys(metaV1).sort());
    // dan enkripsi master-by-seed buatan v2 bisa dibuka dengan frasa ternormalisasi, seperti v1
    expect(await recoverMasterPw(SNAP.phrase.trim().toLowerCase())).toBe(SNAP.masterPw);
  }, 60000);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 6 — ikon brand: slug tidak dikenal tampil sebagai ikon kategori, tanpa crash', () => {
  const baseEntry: VaultEntry = { id: 'x1', cat: 'email', name: 'Uji' };
  const html = (e: VaultEntry) => render(React.createElement(EntryIcon, { entry: e, customCats: [], size: 'md' })).container.innerHTML;

  it('seluruh 121 slug v1.11.0 dirender tanpa melempar error; yang sudah dihapus/tak dikenal = tampilan ikon kategori', () => {
    const fallback = html(baseEntry);
    let removed = 0;
    for (const slug of V1_SLUGS) {
      const out = html({ ...baseEntry, brandIconSlug: slug });
      expect(out.length).toBeGreaterThan(0);
      if (!getBrandIconBySlug(slug)) { removed++; expect(out).toBe(fallback); }
    }
    expect(removed).toBe(33);   // 33 brand yang memang dihapus di v2 (daftar terkunci)
  });

  it('slug sama sekali tidak dikenal juga fallback ke ikon kategori', () => {
    expect(html({ ...baseEntry, brandIconSlug: 'slug-tidak-ada-xyz' })).toBe(html(baseEntry));
  });

  it('brand yang masih ada (gmail) benar-benar menampilkan logo brand (bukan fallback) — kontrol positif', () => {
    expect(getBrandIconBySlug('gmail')).toBeTruthy();
    expect(html({ ...baseEntry, brandIconSlug: 'gmail' })).not.toBe(html(baseEntry));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kontrak 7 — identitas PWA tetap', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/manifest.json'), 'utf-8'));
  it('manifest.json: id, start_url, scope tetap "/"', () => {
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
  });
  it('8 nama file ikon lama tetap ada di manifest DAN di disk (hanya isinya yang baru)', () => {
    const OLD = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'].map((s) => `/icons/icon-${s}.png`);
    const srcs = manifest.icons.map((i: { src: string }) => i.src);
    for (const f of OLD) {
      expect(srcs).toContain(f);
      expect(fs.existsSync(path.join(ROOT, 'public', f))).toBe(true);
    }
  });
});
