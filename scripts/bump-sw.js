/**
 * bump-sw.js — Inject timestamp ke CACHE_NAME di public/sw.js
 * Jalankan sebelum build/deploy agar SW cache ter-invalidate otomatis.
 * Usage: node scripts/bump-sw.js
 */

const fs   = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
let content  = fs.readFileSync(swPath, 'utf-8');

// Generate timestamp: YYYYMMDD-HHmm
const now = new Date();
const pad  = (n) => String(n).padStart(2, '0');
const ts   = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

// Ganti CACHE_NAME apapun (termasuk versi lama atau yang sudah punya timestamp)
content = content.replace(
  /const CACHE_NAME\s*=\s*['"][^'"]*['"]/,
  `const CACHE_NAME = 'vault-next-${ts}'`
);

fs.writeFileSync(swPath, content, 'utf-8');
console.log(`[bump-sw] CACHE_NAME → vault-next-${ts}`);
