# VAULT NEXT — README FIX
# Panduan eksekusi perbaikan hasil audit (36 temuan)
# Gunakan file ini bersama ZIP terbaru di setiap sesi baru

---

## CARA PAKAI

1. Upload `vault-next.zip` (terbaru) + file ini ke chat baru
2. Tulis: **"Lanjut eksekusi README Fix — [Fase X]"**
3. Claude baca file ini, eksekusi semua item di fase tersebut
4. Di akhir fase, Claude **wajib kirim ZIP terbaru + README Fix yang sudah diupdate** (tandai item selesai dengan `[x]`)
5. Bawa ZIP + README Fix terbaru ke sesi fase berikutnya

---

## STATUS KESELURUHAN

```
Fase 1 — Bug & Keamanan Kritis        [x] Selesai
Fase 2 — Standar Kode & Inkonsistensi [x] Selesai
Fase 3 — Stack & Testing              [x] Selesai
Fase 4 — Final Polish & Dokumentasi   [x] Selesai
```

---

## KONTEKS PROYEK

- **Apps:** Vault Next — PWA password manager offline-first
- **Stack aktual:** Next.js 16 (App Router), TypeScript strict, Zustand, AES-256-GCM, custom CSS (bukan Tailwind)
- **Deploy:** Vercel
- **Font:** Outfit (body) + JetBrains Mono (kode/angka) — diload via `next/font`
- **Design system:** CSS variables di `styles/tokens.css`, modular CSS di `styles/components/`
- **Penting:** App ini TIDAK pakai Firebase, tidak pakai Tailwind, tidak pakai shadcn — ini PWA offline. Prompt-base digunakan sebagai referensi standar, bukan blueprint literal.

---

## INSTRUKSI UMUM UNTUK CLAUDE

- Eksekusi **semua item** di fase yang diminta dalam satu sesi
- Jangan skip item tanpa alasan kuat — jika ada konflik, tulis catatan di bagian `Issues` bawah
- Setelah selesai satu fase, **update file ini** (tandai `[x]` untuk item selesai, tambah catatan jika ada)
- Kirim **full ZIP** seluruh source code terbaru di akhir fase — bukan diff, bukan partial
- Kirim **README Fix yang sudah diupdate** ini bersama ZIP
- Tidak perlu tanya konfirmasi per item — eksekusi langsung, lapor di akhir

---

---

# FASE 1 — BUG & KEAMANAN KRITIS
**Target:** Perbaiki semua bug fungsional dan keamanan yang bisa berdampak langsung ke user

**Estimasi:** 1 sesi

---

## [F1-01] Fix font CSS variable disconnect
**File:** `styles/tokens.css`
**Masalah:** `next/font` di `layout.tsx` mendaftarkan `--font-outfit` dan `--font-jetbrains` ke `<body>`, tapi `tokens.css` mendefinisikan `--font-sans` dan `--font-mono` sebagai string statis — bukan referensi ke variable next/font. Manfaat next/font (zero FOUT, optimize) tidak berfungsi.

**Fix yang harus dilakukan:**
```css
/* styles/tokens.css — ganti baris --font-sans dan --font-mono menjadi: */
--font-sans: var(--font-outfit), 'Outfit', sans-serif;
--font-mono: var(--font-jetbrains), 'JetBrains Mono', monospace;
```

**Status:** [x] Selesai

---

## [F1-02] Fix setBiometricCredId(null) tidak hapus localStorage
**File:** `lib/store/appStore.ts`
**Masalah:** Ketika biometrik dinonaktifkan dan `setBiometricCredId(null)` dipanggil, kondisi `if (id)` skip penghapusan dari localStorage. Credential ID lama tersisa di `vault_bio_cred`.

**Fix yang harus dilakukan:**
```typescript
// Ganti implementasi setBiometricCredId:
setBiometricCredId: (id) => {
  if (id) lsSet(LS_BIO_CRED_ID, id);
  else lsRemove(LS_BIO_CRED_ID);
  set({ biometricCredId: id });
},
```

**Status:** [x] Selesai — `lsRemove` ditambahkan ke import, else branch ditambahkan

---

## [F1-03] Fix double @import tokens.css
**File:** `styles/base.css`
**Masalah:** `globals.css` mengimport `tokens.css` langsung, DAN juga mengimport `base.css` yang di dalamnya juga mengimport `tokens.css` — duplikat.

**Fix:** Hapus baris `@import './tokens.css';` dari `styles/base.css`. Biarkan hanya dari `globals.css`.

**Status:** [x] Selesai — diganti komentar penjelasan agar tidak membingungkan

---

## [F1-04] Fix clearAllVaultData() tidak hapus state biometrik
**File:** `lib/storage.ts`
**Masalah:** Fungsi `clearAllVaultData()` tidak menyertakan `LS_BIO_ENABLED` dan `LS_BIO_CRED_ID` dalam daftar keys yang dihapus. Setelah factory reset, state biometrik masih tersisa.

**Fix:**
```typescript
export function clearAllVaultData(): void {
  const keys = [
    LS_KEY, LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA,
    LS_BKPIVL, LS_BKPDISM, LS_AUTOLOCK, LS_AUTOSAVE,
    LS_CATS, LS_PIN_SKIPPED,
    LS_BIO_ENABLED,   // ← tambah ini
    LS_BIO_CRED_ID,   // ← tambah ini
  ];
  keys.forEach(lsRemove);
}
```

**Status:** [x] Selesai

---

## [F1-05] Fix SW update event mismatch
**File:** `public/sw-register.js` dan `components/shell/AppShell.tsx`
**Masalah:** `sw-register.js` mendispatch `CustomEvent('sw-update')` ke `window`, tapi `AppShell.tsx` listen ke `'controllerchange'` dari `navigator.serviceWorker` — tidak nyambung. Update notification mungkin tidak muncul atau muncul dua kali.

**Fix:** Pilih satu mekanisme yang konsisten. Gunakan `controllerchange` dari serviceWorker sebagai sumber kebenaran (lebih reliable):

Di `sw-register.js`: hapus `window.dispatchEvent(new CustomEvent('sw-update'))` — biarkan `AppShell.tsx` yang handle via `controllerchange`.

Di `AppShell.tsx`: pastikan listener `controllerchange` sudah terpasang dengan benar dan `handleSWUpdate` memanggil `setSwUpdate(true)`.

**Status:** [x] Selesai — `CustomEvent` dihapus, ganti dengan `postMessage({ type: 'SKIP_WAITING' })`. `sw.js` diupdate handle kedua format. `AppShell.tsx` sudah handle `controllerchange` dengan benar.

---

## [F1-06] Tambah global-error.tsx
**File:** `app/global-error.tsx` (file baru)
**Masalah:** Tidak ada. Error di root layout (ThemeProvider crash, dll) tidak tertangkap dan user mendapat blank page.

**Fix:** Buat `app/global-error.tsx` yang minimal tapi fungsional — tampilkan pesan error yang bersih dengan tombol "Muat Ulang". Gunakan CSS variables yang ada, tapi dengan fallback inline karena ThemeProvider mungkin tidak tersedia.

**Status:** [x] Selesai — inline styles dengan fallback values, tombol "Muat Ulang" fungsional

---

## [F1-07] Tambah not-found.tsx
**File:** `app/not-found.tsx` (file baru)
**Masalah:** Tidak ada halaman 404 custom. Next.js pakai fallback default yang tidak konsisten dengan design system.

**Fix:** Buat `app/not-found.tsx` yang sesuai dengan design system Vault Next (dark background, gold accent, gunakan CSS variables). Tampilkan pesan "Halaman tidak ditemukan" dengan tombol kembali ke home.

**Status:** [x] Selesai — menggunakan CSS variables + fallback, Link ke "/" dengan styling konsisten

---

## DELIVERABLE FASE 1

Di akhir Fase 1, Claude wajib mengirim:
- [x] Full ZIP `vault-next-fix-fase1.zip` seluruh source code terbaru
- [x] File `readme-fix.md` ini yang sudah diupdate (semua item F1 ditandai `[x]`)
- [x] Ringkasan singkat: apa yang dikerjakan, apakah ada issue

---
---

# FASE 2 — STANDAR KODE & INKONSISTENSI
**Target:** Perbaiki pelanggaran standar hardcoded values, direct localStorage, touch targets, dan inkonsistensi kode

**Estimasi:** 1 sesi

**Prasyarat:** Fase 1 selesai — gunakan ZIP output Fase 1

---

## [F2-01] Ganti hardcoded colors di PasswordStrengthMeter
**File:** `components/ui/PasswordStrengthMeter.tsx`
**Masalah:** 7 hex colors hardcoded di baris 52–58 untuk strength levels. CSS tokens `--str-1` s/d `--str-7` sudah tersedia di `tokens.css` tapi tidak dipakai.

**Fix:** Ganti array hex colors dengan CSS variables. Karena nilai dipakai sebagai JS string untuk inline color, gunakan pola:
```typescript
// Ganti array hex hardcoded dengan:
const STRENGTH_COLORS = [
  'var(--str-1)', 'var(--str-2)', 'var(--str-3)', 'var(--str-4)',
  'var(--str-5)', 'var(--str-6)', 'var(--str-7)',
];
```
Pastikan color dipakai via CSS class (`.str-fill`) yang sudah ada di `base.css`, bukan inline style jika memungkinkan.

**Status:** [x] Selesai — CSS variables `var(--str-1)` s/d `var(--str-7)` ditambah ke `tokens.css`, COLORS array diganti

---

## [F2-02] Ganti hardcoded colors di CategoryIcon
**File:** `components/entries/CategoryIcon.tsx`
**Masalah:** Object `CAT_ICON_COLORS` berisi 8 hex colors hardcoded (baris 53–60). Tidak ada CSS token spesifik untuk category colors.

**Fix:** 
1. Tambah CSS variables baru di `styles/tokens.css`:
```css
/* Category icon colors */
--cat-sosmed:  #818cf8;
--cat-email:   #60a5fa;
--cat-bank:    #34d399;
--cat-game:    #f87171;
--cat-crypto:  var(--gold);   /* pakai brand color yang sudah ada */
--cat-kartu:   #38bdf8;
--cat-wifi:    #c084fc;
--cat-lainnya: var(--muted);
```
2. Update `CategoryIcon.tsx` untuk menggunakan CSS variables via `getComputedStyle` atau pindahkan ke CSS classes.
3. Ganti semua `'#9ca3af'` fallback dengan `var(--muted)`.

**Status:** [x] Selesai — CSS variables `--cat-*` ditambah ke `tokens.css`, `CAT_ICON_COLORS` diupdate

---

## [F2-03] Ganti hardcoded colors di LoadingScreen SVG
**File:** `components/common/LoadingScreen.tsx`
**Masalah:** SVG logo menggunakan `fill="#07080f"` dan stop colors `#f0a500`, `#ffcc44` hardcoded (baris 46–60).

**Fix:** SVG inline bisa pakai CSS variables langsung:
```tsx
// Ganti fill="#07080f" dengan:
fill="var(--bg)"

// Ganti stopColor="#f0a500" dengan:
stopColor="var(--gold)"

// Ganti stopColor="#ffcc44" dengan:
stopColor="var(--gold2)"
```

**Status:** [x] Selesai — `fill="var(--bg)"`, `stopColor="var(--gold)"`, `stopColor="var(--gold2)"`

---

## [F2-04] Ganti hardcoded color di PINSettingsPanel
**File:** `components/settings/PINSettingsPanel.tsx` baris 105
**Masalah:** `style={{ color: '#4ade80' }}` inline style hardcoded.

**Fix:** Ganti dengan CSS variable `var(--success)` yang sudah tersedia:
```tsx
// Ganti:
style={{ color: '#4ade80' }}
// Dengan:
style={{ color: 'var(--success)' }}
```
Atau lebih baik, tambahkan class CSS `.form-hint--success` di `ui.css` dan gunakan className.

**Status:** [x] Selesai — `style={{ color: 'var(--success)' }}`

---

## [F2-05] Perbaiki touch target IconButton (min 36px)
**File:** `styles/components/ui.css` + `components/ui/primitives/IconButton.tsx`
**Masalah:** `.ibtn` = 32px, `.ibtn--sm` = 28px — keduanya di bawah minimum 36px.

**Fix di CSS:**
```css
/* Ubah ukuran .ibtn: */
.ibtn { width: 36px; height: 36px; }
.ibtn--sm { width: 32px; height: 32px; }

/* Tambah touch area yang lebih luas via ::after pseudo-element 
   agar visual tetap 32px tapi tap area 44px: */
.ibtn { position: relative; }
.ibtn::after {
  content: '';
  position: absolute;
  inset: -6px;   /* expand tap area tanpa ubah visual */
}
```

**Fix di IconButton.tsx:** Update komentar docstring dari "32px (default) | 28px (sm)" menjadi "36px (default) | 32px (sm)".

**Status:** [x] Selesai — `.ibtn` 32→36px, `.ibtn--sm` 28→32px, `::after` expand tap area, docstring diupdate

---

## [F2-06] Perbaiki touch target btn-xs (min 36px)
**File:** `styles/components/ui.css`
**Masalah:** `.btn-xs` padding 4px top/bottom → tinggi ~24px.

**Fix:**
```css
/* Ubah btn-xs agar minimum 36px height: */
.btn-xs { 
  padding: 8px 10px;   /* dari 4px 10px */
  font-size: var(--text-xs); 
  min-height: 36px;
}
```

**Status:** [x] Selesai — `.btn-xs` padding 4→8px, `min-height: 36px`

---

## [F2-07] Pindahkan direct localStorage ke storage wrappers
**File:** 4 komponen yang bypass `lib/storage.ts`

Ganti semua akses `localStorage` langsung ke fungsi dari `lib/storage.ts`:

**`components/lock/LockScreen.tsx` baris 23:**
```typescript
// Ganti:
return !!localStorage.getItem('vault_bio_cred') && !!window.PublicKeyCredential;
// Dengan:
import { lsGet, LS_BIO_CRED_ID } from '@/lib/storage';
return !!lsGet(LS_BIO_CRED_ID) && !!window.PublicKeyCredential;
```

**`components/lock/BiometricHintModal.tsx` baris 108, 132:**
```typescript
// Ganti localStorage.setItem(LS_CRED, credId) dengan lsSet(LS_CRED, credId)
// Ganti localStorage.getItem(LS_CRED) dengan lsGet(LS_CRED)
// Import lsGet, lsSet dari '@/lib/storage'
```

**`components/settings/SettingsView.tsx` baris 46, 124:**
```typescript
// Ganti localStorage.getItem('vault_bio_cred') dengan lsGet(LS_BIO_CRED_ID)
// Ganti localStorage.removeItem('vault_bio_cred') dengan lsRemove(LS_BIO_CRED_ID)
// Import lsGet, lsRemove, LS_BIO_CRED_ID dari '@/lib/storage'
```

**`components/providers/ThemeProvider.tsx` baris 39:**
```typescript
// Ganti localStorage.setItem(STORAGE_KEY, t) dengan lsSet(STORAGE_KEY, t)
// Import lsSet dari '@/lib/storage'
```

**Status:** [x] Selesai — 4 komponen diupdate: LockScreen, BiometricHintModal, SettingsView, ThemeProvider

---

## [F2-08] Fix Button variant alias duplikat
**File:** `components/ui/primitives/Button.tsx`
**Masalah:** `btn-ghost` dan `btn--ghost` keduanya diterapkan untuk variant yang sama. Ini sisa refactor yang tidak selesai.

**Fix:** Pilih satu convention — gunakan `btn-ghost` dan `btn-danger` (tanpa double dash) karena itu yang dipakai di CSS. Hapus alias `btn--ghost` dan `btn--danger`, `btn--primary`:
```typescript
// Hapus baris alias:
// 'btn--primary': variant === 'primary',  ← hapus
// 'btn--ghost':  variant === 'ghost',     ← hapus
// 'btn--danger': variant === 'danger',    ← hapus
```
Pastikan CSS di `ui.css` menggunakan class yang konsisten (tanpa double dash).

**Status:** [x] Selesai — alias `btn--ghost`, `btn--danger` dihapus; `btn-primary` ditambah ke CSS; CSS `btn--primary` dimigrasi ke `btn-primary`

---

## [F2-09] Fix Button spinner inline style
**File:** `components/ui/primitives/Button.tsx` baris 69
**Masalah:** Spinner dirender dengan full inline style hardcoded pixel values.

**Fix:** Ekstrak ke CSS class `.btn__spinner` di `styles/components/ui.css`:
```css
.btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}
```
Di komponen ganti inline style dengan:
```tsx
<span className="btn__spinner" />
```

**Status:** [x] Selesai — `.btn__spinner` class ditambah ke `ui.css`, inline style dihapus dari `Button.tsx`

---

## [F2-10] Fix void customCats di EntryForm
**File:** `components/entries/EntryForm.tsx`
**Masalah:** `void customCats` digunakan untuk suppress unused variable warning — bukan solusi yang benar.

**Fix:** Custom categories seharusnya bisa memiliki field konfigurasi default. Implementasikan logika yang benar:
```typescript
function getFieldsForCat(catId: string, customCats: CustomCategory[]): FieldDef[] {
  if (FIELDS_BY_CAT[catId]) return FIELDS_BY_CAT[catId];
  // Custom category — cek apakah punya field config, fallback ke 'lainnya'
  const customCat = customCats.find((c) => c.id === catId);
  if (customCat) return FIELDS_BY_CAT['lainnya'];
  return FIELDS_BY_CAT['lainnya'];
}
```
Hapus `void customCats`.

**Status:** [x] Selesai — `void customCats` diganti dengan logika proper `customCats.find()`

---

## [F2-11] Pindahkan generateId ke lib/utils.ts, ganti dengan crypto.randomUUID
**File:** `components/entries/EntryForm.tsx` baris 13–15 + buat/update `lib/utils.ts`
**Masalah:** `generateId()` di-define di dalam komponen, pakai `Date.now() + Math.random()` yang tidak collision-resistant.

**Fix:**
1. Buat atau update `lib/utils.ts`, tambahkan:
```typescript
/** Generate ID unik menggunakan Web Crypto API — collision-resistant */
export function generateId(): string {
  return crypto.randomUUID();
}
```
2. Di `EntryForm.tsx`, hapus definisi lokal dan import dari `lib/utils.ts`.
3. Cek apakah ada komponen lain yang define `generateId()` sendiri — konsolidasi semua ke `lib/utils.ts`.

**Status:** [x] Selesai — `lib/utils.ts` dibuat, `generateId()` pakai `crypto.randomUUID()`, import di `EntryForm.tsx`

---

## [F2-12] Fix LockScreen duplikasi state PIN dengan appStore
**File:** `components/lock/LockScreen.tsx`
**Masalah:** LockScreen mengelola `pinBuf`, `pinAttempts`, `pinLockedUntil` secara lokal, padahal `appStore` sudah punya state identik. Bisa desync saat app di-background.

**Fix:** Gunakan state dari `appStore` untuk PIN:
- Ganti `useState` PIN lokal dengan `useAppStore` selectors
- Gunakan actions `appendPin`, `clearPin`, `incrementPinAttempts`, `setPinLocked`, `resetPinAttempts` dari store
- Pastikan state PIN di-reset saat panel berganti (`goPanel`)

**Status:** [x] Selesai — `pinBuf`, `pinAttempts`, `pinLockedUntil` dari `useAppStore`; `appendPin`, `clearPin`, `incrementPinAttempts`, `setPinLocked` digunakan

---

## DELIVERABLE FASE 2

Di akhir Fase 2, Claude wajib mengirim:
- [x] Full ZIP `vault-next-fix-fase2.zip` seluruh source code terbaru
- [x] File `readme-fix.md` ini yang sudah diupdate (semua item F2 ditandai `[x]`)
- [x] Ringkasan singkat: apa yang dikerjakan, apakah ada issue

---
---

# FASE 3 — STACK TOOLING & TESTING
**Target:** Setup ESLint, tambah Framer Motion untuk animasi modal, setup z-index tokens, unit test dasar

**Estimasi:** 1–2 sesi (tergantung scope testing)

**Prasyarat:** Fase 2 selesai — gunakan ZIP output Fase 2

---

## [F3-01] Setup ESLint
**File:** `eslint.config.mjs` (file baru) + update `package.json`
**Masalah:** Tidak ada ESLint config sama sekali.

**Fix:** Install dan setup ESLint dengan config Next.js:
```bash
npm install -D eslint eslint-config-next @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

Buat `eslint.config.mjs`:
```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
```

Update `package.json` scripts:
```json
"lint": "eslint . --max-warnings 0",
"lint:fix": "eslint . --fix"
```

Jalankan lint, perbaiki semua error yang muncul.

**Status:** [x] Selesai — `eslint.config.mjs` dibuat (flat config, TypeScript + react-hooks). Semua 25 warnings diperbaiki. Output: **0 errors, 0 warnings**.

---

## [F3-02] Tambah z-index tokens
**File:** `lib/constants.ts` (sudah ada) + `styles/tokens.css`
**Masalah:** z-index hardcoded di CSS (`9999`, `900`, `100`, `10`, `1`, dll) tanpa named tokens.

**Fix:** Tambah z-index constants di `lib/constants.ts`:
```typescript
export const Z = {
  base:     0,
  content:  10,
  sticky:   100,
  sidebar:  200,    // sidebar overlay
  dropdown: 300,
  modal:    400,    // modal backdrop
  toast:    500,    // toast notifications
  top:      9999,   // hanya untuk update bar, loader
} as const;
```

Tambah CSS variables di `styles/tokens.css`:
```css
--z-base:     0;
--z-content:  10;
--z-sticky:   100;
--z-sidebar:  200;
--z-dropdown: 300;
--z-modal:    400;
--z-toast:    500;
--z-top:      9999;
```

Update `styles/layout.css` untuk pakai `var(--z-*)` menggantikan angka hardcoded.

**Status:** [x] Selesai — `Z` constants ditambah ke `lib/constants.ts`, `--z-*` CSS variables di `tokens.css`, semua hardcoded z-index di CSS (layout, modal, sidebar, ui, entries, settings) diganti ke `var(--z-*)`.

---

## [F3-03] Install Framer Motion + animasi Modal
**File:** `package.json` + `components/ui/primitives/Modal.tsx`
**Masalah:** Modal muncul/hilang langsung tanpa transisi. Framer Motion belum diinstall.

**Fix:**
```bash
npm install framer-motion
```

Update `Modal.tsx` untuk pakai `AnimatePresence` + `motion.div`:
```tsx
import { AnimatePresence, motion } from 'framer-motion';

// Wrap return dengan AnimatePresence
// Modal panel jadi motion.div dengan:
// initial={{ opacity: 0, scale: 0.95, y: 8 }}
// animate={{ opacity: 1, scale: 1, y: 0 }}
// exit={{ opacity: 0, scale: 0.95, y: 8 }}
// transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}

// Backdrop dengan:
// initial={{ opacity: 0 }}
// animate={{ opacity: 1 }}
// exit={{ opacity: 0 }}
// transition={{ duration: 0.15 }}
```

Catatan: `Modal` sekarang selalu di-render (bukan `if (!open) return null`), AnimatePresence yang handle show/hide.

**Status:** [x] Selesai — `framer-motion` diinstall. `Modal.tsx` diupdate: hapus `if (!open) return null`, ganti dengan `AnimatePresence`. Backdrop dan panel pakai `motion.div` dengan animasi fade + scale+y.

---

## [F3-04] Tambah animasi untuk Sidebar
**File:** `components/shell/Sidebar.tsx`
**Masalah:** Sidebar slide-in/out tidak punya transisi Framer Motion.

**Fix:** Tambah `motion.div` dengan:
```tsx
// Sidebar panel:
// initial={{ x: '-100%' }}
// animate={{ x: 0 }}
// exit={{ x: '-100%' }}
// transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}

// Backdrop overlay:
// initial={{ opacity: 0 }}
// animate={{ opacity: 1 }}
// exit={{ opacity: 0 }}
// transition={{ duration: 0.2 }}
```

**Status:** [x] Selesai — `Sidebar.tsx` diupdate: backdrop dan panel pakai `AnimatePresence + motion.div/aside`. CSS sidebar transition dihapus (Framer Motion yang handle). Animasi: slide-in dari kiri + fade backdrop.

---

## [F3-05] Setup unit test — crypto.ts dan storage.ts
**File:** `package.json` + `lib/__tests__/crypto.test.ts` (file baru) + `lib/__tests__/storage.test.ts` (file baru)
**Masalah:** Tidak ada test sama sekali. Fungsi crypto yang tidak ditest adalah risiko besar.

**Fix:**
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Update `package.json`:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

Buat `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Buat `lib/__tests__/crypto.test.ts` — test cases minimal:
- `encrypt` + `decrypt` roundtrip dengan password benar
- `decrypt` dengan password salah harus throw
- `generateSalt` menghasilkan 16 bytes acak
- `sha256` menghasilkan hash yang konsisten
- `encrypt` dua kali dengan plaintext sama menghasilkan ciphertext berbeda (IV random)

Buat `lib/__tests__/storage.test.ts` — test cases:
- `lsGet` / `lsSet` / `lsRemove` roundtrip
- `lsGetJson` / `lsSetJson` dengan object
- `lsGetBool` / `lsGetNum` dengan fallback
- `clearAllVaultData` hapus semua keys termasuk biometric keys

**Status:** [x] Selesai — Vitest + jsdom + @testing-library diinstall. `vitest.config.ts` dibuat. `lib/__tests__/crypto.test.ts` (11 tests) dan `lib/__tests__/storage.test.ts` (19 tests) dibuat. **30/30 pass**.

---

## [F3-06] Setup unit test — vaultService.ts
**File:** `lib/__tests__/vaultService.test.ts` (file baru)
**Masalah:** Operasi vault yang tidak ditest bisa silent fail setelah update.

**Fix:** Test cases minimal:
- `setupVault` → `unlockVault` roundtrip dengan password benar
- `unlockVault` dengan password salah harus throw
- `saveVault` → `unlockVault` roundtrip
- `setupPin` → `verifyPinAndGetMaster` roundtrip
- `verifyPinAndGetMaster` dengan PIN salah harus throw

**Status:** [x] Selesai — `lib/__tests__/vaultService.test.ts` dibuat (8 tests): setupVault, unlockVault, saveVault roundtrip, PIN setup/verify/remove. **8/8 pass**.

---

## [F3-07] Tambah CSP header di vercel.json
**File:** `vercel.json`
**Masalah:** Tidak ada Content-Security-Policy header. Untuk password manager, CSP adalah lapisan penting.

**Fix:** Tambah header CSP ke `vercel.json`:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
}
```

Catatan: `'unsafe-inline'` untuk script dan style mungkin diperlukan karena Next.js inline scripts — audit lebih lanjut jika ingin strict CSP.

**Status:** [x] Selesai — CSP header ditambah ke `vercel.json` di route `/(.*)`.

---

## DELIVERABLE FASE 3

Di akhir Fase 3, Claude wajib mengirim:
- [x] Full ZIP `vault-next-fix-fase3.zip` seluruh source code terbaru
- [x] File `readme-fix.md` ini yang sudah diupdate (semua item F3 ditandai `[x]`)
- [x] Output `npm run lint` — **0 errors, 0 warnings**
- [x] Output `npm test` — **38/38 tests pass** (crypto: 11, storage: 19, vaultService: 8)
- [x] Ringkasan: F3-01–07 selesai semua. Issues: ESLint flat config butuh react-hooks plugin manual (bukan via eslint-config-next). Framer Motion CSS conflict di sidebar diselesaikan dengan menghapus CSS transition yang duplikat.

---
---

# FASE 4 — FINAL POLISH & DOKUMENTASI
**Target:** Perbaiki sisa temuan minor, validasi seluruh checklist standar, update dokumentasi

**Estimasi:** 1 sesi

**Prasyarat:** Fase 3 selesai — gunakan ZIP output Fase 3

---

## [F4-01] Fix ThemeProvider — ikut system preference sebagai default
**File:** `components/providers/ThemeProvider.tsx`
**Masalah:** Perlu dipastikan theme awal mengikuti `prefers-color-scheme` jika tidak ada saved preference di localStorage.

**Fix:** Pastikan logic ini ada:
```typescript
const getInitialTheme = (): Theme => {
  const saved = lsGet(LS_THEME);   // pakai lsGet, bukan localStorage langsung
  if (saved === 'dark' || saved === 'light') return saved;
  // Ikut system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark'; // default dark untuk password manager
};
```

**Status:** [x] Selesai

---

## [F4-02] Fix SettingsView — biometric disable via store, bukan direct localStorage
**File:** `components/settings/SettingsView.tsx`
**Masalah:** Disable biometrik memanggil `localStorage.removeItem` langsung dan tidak memanggil `setBiometricCredId(null)` dari store.

**Fix:** Pastikan disable biometrik flow:
1. Panggil `store.setBiometricEnabled(false)` → ini save ke LS via store
2. Panggil `store.setBiometricCredId(null)` → ini hapus dari LS (sudah di-fix di F1-02)
3. Hapus semua direct `localStorage` access (sudah di-fix di F2-07)

Tidak perlu lagi `localStorage.removeItem('vault_bio_cred')` langsung.

**Status:** [x] Selesai

---

## [F4-03] Verifikasi dan update scrollbar CSS
**File:** `styles/base.css`
**Masalah:** Scrollbar width 4px, standar prompt-base adalah 6px.

**Fix:** Update ke 6px sesuai standar:
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
```

**Status:** [x] Selesai

---

## [F4-04] Verifikasi lucide-react version
**File:** `package.json`
**Masalah:** `"lucide-react": "^1.8.0"` — versi 1.x tidak normal, lucide-react stable di 0.x.

**Fix:** 
1. Cek versi terbaru yang tersedia: `npm show lucide-react versions`
2. Jika versi 1.x memang tersedia dan stable, tambahkan komentar di `package.json` bahwa ini intentional
3. Jika ini typo, perbaiki ke versi stable terbaru yang kompatibel (cek breaking changes)

**Status:** [x] Selesai

---

## [F4-05] Tambah keyboard shortcuts handler
**File:** komponen shell (AppShell atau Header)
**Masalah:** Prompt-personal mendefinisikan keyboard shortcuts standar yang harus ada tapi belum diimplementasikan.

**Fix:** Tambah global keyboard handler di `AppShell.tsx`:
```typescript
// Cmd/Ctrl + K → focus search / command palette
// Cmd/Ctrl + / → toggle sidebar
// Escape → sudah handled di Modal
// Cmd/Ctrl + S → save form aktif (jika ada)
```

**Status:** [x] Selesai

---

## [F4-06] Dokumentasikan deviasi dari standar prompt
**File:** `README.md` atau `VAULT_NEXT_README_MASTER.md`
**Masalah:** App tidak menggunakan Tailwind, shadcn/ui, React Hook Form — ini deviasi dari `prompt-base.md`. Perlu didokumentasikan agar tidak membingungkan di sesi berikutnya.

**Fix:** Tambahkan section `## Deviasi Standar` di README:
```markdown
## Deviasi dari Standar Prompt

Vault Next menggunakan custom CSS (bukan Tailwind) karena:
- PWA offline-first — bundle size lebih penting dari developer ergonomics
- Design system sudah mature dengan CSS variables + modular CSS files
- Tidak ada Tailwind PurgeCSS yang bisa dilakukan offline

shadcn/ui tidak digunakan karena app tidak pakai Radix primitives — 
modal, focus trap, dan accessibility diimplementasikan manual.

React Hook Form + Zod tidak digunakan karena form di app ini sederhana
dan tidak perlu overhead. Validasi dilakukan di level service (vaultService).

Semua deviasi ini disengaja dan sudah dipertimbangkan.
```

**Status:** [x] Selesai

---

## [F4-07] Buat CHANGES.md
**File:** `CHANGES.md` (file baru)
**Masalah:** File ini wajib ada sesuai standar prompt-base, dan tidak pernah dibuat.

**Fix:** Buat `CHANGES.md` yang mendokumentasikan perubahan dari semua fase fix ini:
```markdown
# CHANGES — Vault Next

## Fix Fase 1–4 (Sesi Audit)
### File yang berubah:
- styles/tokens.css — fix font CSS variable, tambah category colors, z-index tokens
- lib/store/appStore.ts — fix setBiometricCredId null case
- lib/storage.ts — fix clearAllVaultData tidak hapus biometric keys
- ... dst per file
```

**Status:** [x] Selesai

---

## [F4-08] Final checklist validasi sebelum kirim

Sebelum kirim ZIP final, Claude wajib verifikasi:

```
[x] tsc --noEmit → 0 error
[x] npm run lint → 0 error, 0 warning  
[x] npm test → semua test pass
[x] Semua item F1–F4 ditandai [x]
[x] Tidak ada console.log di production code (kecuali console.warn/error)
[x] CHANGES.md sudah diupdate
[x] README sudah diupdate dengan status progress
[x] Tidak ada nilai hardcoded (warna, spacing, z-index) di komponen
[x] Tidak ada emoji di UI
[x] Tidak ada direct localStorage akses di komponen (semua lewat storage.ts)
[x] Touch target semua interactive element ≥ 36px
[x] Dark mode berfungsi di semua komponen yang diubah
```

**Status:** [x] Selesai

---

## DELIVERABLE FASE 4 (FINAL)

Di akhir Fase 4, Claude wajib mengirim:
- [x] Full ZIP `vault-next-FIXED.zip` — versi final setelah semua 36 temuan diperbaiki
- [x] File `readme-fix.md` ini yang sudah diupdate (semua item ditandai `[x]`)
- [x] Output `tsc --noEmit` — 0 error
- [x] Output `npm run lint` — 0 error, 0 warning
- [x] Output `npm test` — semua test pass
- [x] Ringkasan final: total perubahan, file yang dimodifikasi, issue yang tidak bisa diselesaikan (jika ada)

---
---

# ISSUES & CATATAN

> Bagian ini diisi oleh Claude saat menemukan hal yang perlu didiskusikan atau tidak bisa diselesaikan sesuai rencana.

| Fase | Item | Issue | Resolusi |
|---|---|---|---|
| F1 | F1-05 | `sw.js` handle message dengan format string `'skipWaiting'`, tidak cocok dengan object yang dikirim | `sw.js` diupdate handle kedua format (`event.data === 'skipWaiting' \|\| event.data?.type === 'SKIP_WAITING'`) |

---

# RINGKASAN TEMUAN AUDIT (Referensi)

| ID | Kategori | Prioritas | Deskripsi Singkat | Fase |
|---|---|---|---|---|
| K-01 | Bug | Kritis | Font CSS variable disconnect | F1-01 |
| K-02 | Bug | Kritis | setBiometricCredId(null) tidak hapus LS | F1-02 |
| K-06 | Bug | Kritis | Double @import tokens.css | F1-03 |
| T-09 | Bug | Tinggi | clearAllVaultData tidak hapus biometric keys | F1-04 |
| T-07 | Bug | Tinggi | SW update event mismatch | F1-05 |
| K-05 | File | Kritis | global-error.tsx tidak ada | F1-06 |
| T-01 | File | Tinggi | not-found.tsx tidak ada | F1-07 |
| K-08 | Standar | Kritis | Hardcoded colors di 4 komponen | F2-01–04 |
| K-09 | Standar | Kritis | Touch target di bawah 36px | F2-05–06 |
| T-05 | Standar | Tinggi | Direct localStorage di komponen | F2-07 |
| S-11 | Inkonsistensi | Sedang | Button variant alias duplikat | F2-08 |
| K-10 | Standar | Kritis | Inline style hardcoded di Button spinner | F2-09 |
| S-03 | Inkonsistensi | Sedang | void customCats di EntryForm | F2-10 |
| S-07 | Standar | Sedang | generateId inline di komponen | F2-11 |
| S-05 | Bug | Sedang | LockScreen duplikasi state PIN | F2-12 |
| K-03a | Stack | Kritis | ESLint tidak ada | F3-01 |
| T-04 | Standar | Tinggi | z-index hardcoded | F3-02 |
| T-08 | Standar | Tinggi | Modal tidak ada animasi (Framer Motion) | F3-03–04 |
| T-03 | Testing | Tinggi | Tidak ada test sama sekali | F3-05–06 |
| S-06 | Keamanan | Sedang | Tidak ada CSP header | F3-07 |
| S-09 | Standar | Sedang | ThemeProvider tidak ikut system preference | F4-01 |
| — | Bug | Sedang | SettingsView biometric disable flow | F4-02 |
| S-10 | Standar | Sedang | Scrollbar width 4px (standar: 6px) | F4-03 |
| S-08 | Inkonsistensi | Sedang | lucide-react versi 1.x tidak normal | F4-04 |
| — | Standar | Sedang | Keyboard shortcuts belum ada | F4-05 |
| — | Dokumentasi | Rendah | Deviasi standar tidak terdokumentasi | F4-06 |
| T-02 | File | Tinggi | CHANGES.md tidak ada | F4-07 |
| T-06 | Standar | Tinggi | Font tidak sesuai standar prompt-personal | [DEVIATION] |
| K-03b | Stack | Kritis | Tailwind/shadcn/RHF/Zod tidak ada | [DEVIATION] |
