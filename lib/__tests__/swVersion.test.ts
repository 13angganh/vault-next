/**
 * lib/__tests__/swVersion.test.ts — Vault Next
 *
 * v1.8.0: public/sw.js punya CACHE_VER yang pernah tertinggal 2 minor
 * version dari APP_VERSION (CACHE_VER='v1.6.3' saat APP_VERSION sudah
 * '1.8.0') karena tidak ada apa pun yang memvalidasi keduanya tetap
 * sinkron -- scripts/generate-sw-version.ts sekarang menulis ulang
 * CACHE_VER dari APP_VERSION secara otomatis lewat hook "prebuild".
 *
 * Test ini adalah jaring pengaman TERPISAH dari mekanisme generate-nya:
 * bahkan jika seseorang lupa menjalankan `npm run build` (yang memicu
 * prebuild) sebelum commit, atau mengedit CACHE_VER secara manual
 * meski sudah diberi komentar larangan, test ini gagal dan menandai
 * drift-nya -- bukan baru ketahuan setelah deploy ke production.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { APP_VERSION } from '../constants';

describe('sw.js CACHE_VER — harus selalu sinkron dengan APP_VERSION', () => {
  const swPath = path.resolve(__dirname, '../../public/sw.js');
  const swSource = fs.readFileSync(swPath, 'utf8');

  it('CACHE_VER di public/sw.js sama persis dengan APP_VERSION di lib/constants.ts', () => {
    const match = swSource.match(/^const CACHE_VER\s*=\s*'v([^']*)';/m);
    expect(match, 'pola "const CACHE_VER = \'v...\'" tidak ditemukan di sw.js — struktur file mungkin berubah').not.toBeNull();
    const cacheVer = (match as RegExpMatchArray)[1];
    expect(cacheVer).toBe(APP_VERSION);
  });

  it('scripts/generate-sw-version.ts ada dan dirujuk oleh hook "prebuild" di package.json', () => {
    const scriptPath = path.resolve(__dirname, '../../scripts/generate-sw-version.ts');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
    );
    expect(pkg.scripts.prebuild).toContain('sw-version');
  });
});
