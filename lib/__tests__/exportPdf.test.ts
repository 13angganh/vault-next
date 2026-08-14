/**
 * lib/__tests__/exportPdf.test.ts — Vault Next
 *
 * v1.7.0: README (bagian "Bug fix: fitur Export PDF crash total")
 * mengklaim "Diverifikasi dengan test yang men-spy PDFPage.drawText:
 * seed phrase 24 kata dan wallet address panjang tertulis lengkap tanpa
 * '…'" — tapi audit Aug 2026 menemukan tidak ada file test untuk
 * lib/exportPdf.ts sama sekali. Klaim itu tidak berdasar (pola yang sama
 * dengan temuan EntryForm.test.tsx). Test ini menutup celahnya secara
 * nyata dengan men-spy PDFPage.prototype.drawText persis seperti yang
 * diklaim, memverifikasi kedua fix di changelog v1.6.1:
 *
 * 1. Karakter '⚠'/'★' tidak lagi dikirim ke drawText (diganti '!'/'[FAV]')
 *    — StandardFonts WinAnsi encoding pdf-lib tidak bisa encode keduanya.
 * 2. Value panjang (seed phrase 24 kata, wallet address) tidak lagi
 *    dipotong diam-diam dengan '…' — di-wrap ke beberapa baris dan
 *    muncul UTUH di gabungan semua teks yang ditulis ke halaman.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PDFPage } from 'pdf-lib';
import { exportVaultPdf } from '../exportPdf';
import type { VaultEntry } from '../types';

// exportVaultPdf memicu download file sungguhan (createElement('a'), click()).
// jsdom mendukung URL.createObjectURL/revokeObjectURL secara native, tapi
// kita tetap perlu mencegah a.click() benar-benar menavigasi/error di jsdom.
beforeEach(() => {
  HTMLAnchorElement.prototype.click = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const seedPhrase24Kata = Array.from({ length: 24 }, (_, i) => `katasandi${i + 1}`);
const walletAddressPanjang = '0x' + 'a1b2c3d4e5f6'.repeat(8); // 98 karakter, > batas truncation lama (90)

const dummyEntry: VaultEntry = {
  id: 'e1',
  cat: 'crypto',
  name: 'Dompet Utama',
  fav: true,
  seedPhrase: seedPhrase24Kata,
  walletAddr: walletAddressPanjang,
};

async function captureAllDrawnText(vault: VaultEntry[]): Promise<string[]> {
  const drawnTexts: string[] = [];
  const spy = vi.spyOn(PDFPage.prototype, 'drawText').mockImplementation(function (
    this: PDFPage,
    text: string,
  ) {
    drawnTexts.push(text);
    return undefined as unknown as void;
  });

  await exportVaultPdf({ vault, customCats: [], appVersion: '1.7.0' });

  spy.mockRestore();
  return drawnTexts;
}

describe('exportPdf — karakter yang tidak bisa di-encode WinAnsi (v1.6.1 fix, dibuktikan v1.7.0)', () => {
  it('tidak pernah mengirim karakter ⚠ ke drawText — cover page pakai "!" sebagai gantinya', async () => {
    const drawnTexts = await captureAllDrawnText([]);
    const gabungan = drawnTexts.join('');

    expect(gabungan).not.toContain('⚠');
    expect(gabungan).toContain('!  DOKUMEN SENSITIF');
  });

  it('tidak pernah mengirim karakter ★ ke drawText — entri favorit pakai "[FAV]" sebagai gantinya', async () => {
    const drawnTexts = await captureAllDrawnText([dummyEntry]);
    const gabungan = drawnTexts.join('');

    expect(gabungan).not.toContain('★');
    expect(gabungan).toContain('[FAV]');
  });
});

describe('exportPdf — wrapping value panjang, bukan truncation (v1.6.1 fix, dibuktikan v1.7.0)', () => {
  it('seed phrase 24 kata tertulis LENGKAP tanpa "…" — digabung dari beberapa baris hasil wrap', async () => {
    const drawnTexts = await captureAllDrawnText([dummyEntry]);
    const gabungan = drawnTexts.join(' ');

    // Value asli, sebelum wrap, pasti > 90 karakter (batas truncation lama)
    const seedAsli = seedPhrase24Kata.join(' ');
    expect(seedAsli.length).toBeGreaterThan(90);

    // Tidak ada elipsis truncation di manapun
    expect(gabungan).not.toContain('…');

    // Setiap kata dari seed phrase harus muncul utuh di suatu tempat —
    // kalau masih dipotong dengan slice(0,90), kata-kata terakhir
    // (index tinggi) akan hilang total dari output.
    for (const kata of seedPhrase24Kata) {
      expect(gabungan).toContain(kata);
    }
  });

  it('wallet address panjang tertulis LENGKAP tanpa "…"', async () => {
    const drawnTexts = await captureAllDrawnText([dummyEntry]);
    const gabungan = drawnTexts.join('');

    expect(walletAddressPanjang.length).toBeGreaterThan(90); // > batas truncation lama
    expect(gabungan).not.toContain('…');

    // Digabung dari fragmen wrap (wrapText memecah per-karakter untuk
    // field mono seperti wallet address, tanpa spasi pemisah) harus
    // memuat keseluruhan address sebagai substring berurutan.
    expect(gabungan).toContain(walletAddressPanjang);
  });
});
