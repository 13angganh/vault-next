/**
 * lib/__tests__/pwToggleCss.test.ts — Vault Next
 *
 * v1.8.0: tombol toggle show/hide password (className="form-pw-toggle
 * btn-icon") pernah punya DUA sumber CSS `transform` pada elemen yang sama:
 * .form-pw-toggle { transform: translateY(-50%) }  -- untuk positioning
 * .btn-icon:active { transform: scale(0.93) }        -- untuk press-feedback
 *
 * CSS cascade tidak menggabungkan dua `transform` dari rule berbeda --
 * nilai yang menang MENIMPA seluruhnya. Akibatnya translateY(-50%) hilang
 * total tepat saat tombol ditekan, tombol meloncat posisi vertikalnya
 * secara mikro (durasi ~150ms) -- inilah sumber laporan pengguna "rasanya
 * tidak nyaman saat ditekan" yang sulit dijelaskan persis apa yang salah.
 *
 * Diperbaiki dengan memindahkan positioning .form-pw-toggle dari
 * `transform: translateY(-50%)` ke `margin-top: -16px` (matematis identik
 * untuk elemen bertinggi tetap 32px), sehingga `transform` sepenuhnya
 * "milik" state :active tanpa kemungkinan konflik properti apa pun.
 *
 * Test ini adalah jaring pengaman: jika suatu saat seseorang menambahkan
 * kembali `transform` ke .form-pw-toggle (mis. untuk animasi baru) tanpa
 * sadar mengulang konflik yang sama, test ini gagal dan menandainya --
 * bukan baru ketahuan lagi dari laporan pengguna berikutnya.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function extractRuleBody(css: string, selector: string): string {
  // Escape selector untuk regex, lalu cari "selector {" (bukan "selector:hover {"
  // atau varian lain) via negative lookahead terhadap karakter non-whitespace
  // setelah selector — cukup presisi untuk kontrak spesifik test ini tanpa
  // perlu parser CSS penuh.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*(?![\\w:-])\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  if (!match) {
    throw new Error(`Selector "${selector}" tidak ditemukan di CSS — struktur file mungkin berubah`);
  }
  return match[1];
}

describe('form-pw-toggle & btn-icon:active — CSS transform tidak boleh konflik (v1.8.0 fix)', () => {
  const entriesCss = fs.readFileSync(
    path.resolve(__dirname, '../../styles/components/entries.css'),
    'utf8',
  );
  const uiCss = fs.readFileSync(
    path.resolve(__dirname, '../../styles/components/ui.css'),
    'utf8',
  );

  it('.form-pw-toggle (default state) TIDAK mendeklarasikan transform', () => {
    const body = extractRuleBody(entriesCss, '.form-pw-toggle');
    expect(body).not.toMatch(/\btransform\s*:/);
  });

  it('.form-pw-toggle memakai margin-top untuk positioning vertikal (pengganti translateY)', () => {
    const body = extractRuleBody(entriesCss, '.form-pw-toggle');
    expect(body).toMatch(/margin-top\s*:\s*-16px/);
  });

  it('.btn-icon:active mendeklarasikan transition untuk transform (bukan cuma color/background)', () => {
    const body = extractRuleBody(uiCss, '.btn-icon:active');
    expect(body).toMatch(/transform\s*:\s*scale/);
    expect(body).toMatch(/transition\s*:[^;]*transform/);
  });
});
