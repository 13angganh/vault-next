/**
 * scripts/generate-sw-version.ts — Vault Next
 * Sinkronkan CACHE_VER di public/sw.js dengan APP_VERSION di lib/constants.ts.
 * Jalankan: npm run sw-version
 *
 * v1.8.0: CACHE_VER sebelumnya adalah nilai string terpisah yang harus
 * diingat manual untuk disamakan dengan APP_VERSION -- pernah tertinggal
 * 2 minor version (CACHE_VER='v1.6.3' saat APP_VERSION sudah '1.8.0')
 * karena tidak ada apa pun yang memaksa keduanya tetap sinkron. Script
 * ini menjadikan lib/constants.ts satu-satunya sumber kebenaran: nilai
 * CACHE_VER di sw.js ditulis ulang dari APP_VERSION setiap kali script
 * ini berjalan, dan dijalankan otomatis lewat hook "prebuild" di
 * package.json -- jadi `npm run build` selalu menyamakan keduanya tanpa
 * developer perlu mengingat langkah manual.
 *
 * Berbeda dengan generate-tokens.ts (yang men-generate seluruh file dari
 * nol), sw.js punya banyak logic caching hand-written yang harus tetap
 * sebagai source asli. Script ini hanya mengganti SATU baris (CACHE_VER)
 * via regex yang sempit, bukan menimpa seluruh file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { APP_VERSION } from '../lib/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_PATH = path.resolve(__dirname, '../public/sw.js');

const CACHE_VER_LINE = /^const CACHE_VER\s*=\s*'v[^']*';.*$/m;
const newLine = `const CACHE_VER   = 'v${APP_VERSION}'; // Auto-sync dari APP_VERSION -- JANGAN edit manual, jalankan: npm run sw-version`;

const src = fs.readFileSync(SW_PATH, 'utf8');

if (!CACHE_VER_LINE.test(src)) {
  console.error(`❌ Pola "const CACHE_VER = '...'" tidak ditemukan di ${SW_PATH}.`);
  console.error('   sw.js mungkin sudah direstrukturisasi -- perbarui regex CACHE_VER_LINE di script ini.');
  process.exit(1);
}

const updated = src.replace(CACHE_VER_LINE, newLine);

if (updated === src) {
  console.log(`✅ CACHE_VER sudah sinkron dengan APP_VERSION (v${APP_VERSION}) -- tidak ada perubahan.`);
} else {
  fs.writeFileSync(SW_PATH, updated, 'utf8');
  console.log(`✅ CACHE_VER disinkronkan → v${APP_VERSION} (${SW_PATH})`);
}
