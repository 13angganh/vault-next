# CHANGES — Vault Next

Dokumen ini mencatat semua perubahan yang dilakukan selama sesi audit (Fix Fase 1–4) dan Audit Kedua (Fix Fase 5).
Total temuan audit pertama: 36 item. Semua diselesaikan kecuali yang tercatat sebagai [DEVIATION].
Total temuan audit kedua: 9 item. Semua diselesaikan dalam 1 fase.

---

## Fix Fase 6 — Bug Lock Per-Entri + Konsistensi Bahasa

### FIX-BUG-LOCK — lockedIds tidak tersimpan saat unlock per-entri
**File:** `components/vault/VaultListView.tsx`
- **Root cause:** `handleUnlockSubmit` melepas kunci entri via `store.setLockedIds(...)` ke in-memory saja tanpa memanggil `saveVault` — sehingga perubahan hilang saat app ditutup/dibuka kembali
- **Fix:** Tambah import `saveVault`, hitung `newLockedIds` terlebih dahulu, panggil `saveVault` setelah `store.setLockedIds` agar state ter-persist ke localStorage (terenkripsi)
- **Rollback guard:** Jika `saveVault` gagal, store di-rollback ke `lockedIds` sebelumnya agar konsisten dengan disk
- Catatan: `EntryCard.handleToggleLock` (lock dari tombol) sudah benar — sudah memanggil `saveVault`. Hanya alur **unlock** yang kurang

### FIX-BAHASA-01 — "Tong Sampah" → "Sampah" (5 lokasi)
**File:** `Sidebar.tsx`, `VaultListView.tsx` (2x), `BackupModal.tsx`, `SettingsView.tsx`
- Lebih singkat dan natural sebagai label navigasi dan stat

### FIX-BAHASA-02 — Konsistensi bahasa BackupModal (seluruh file)
**File:** `components/settings/BackupModal.tsx`
- Tab label: `Export` → `Backup`, `Import` → `Pulihkan`, `Sync` → `Sinkron`
- Modal title: `Backup & Sync` → `Backup & Sinkron`
- Info box: `Export semua entri` → `Backup semua entri`, `diimport kembali` → `dipulihkan`
- Stat label: `Tong Sampah` → `Sampah`
- Error title: `Gagal export` → `Gagal membuat backup`, `Gagal import` → `Gagal memulihkan`, `Gagal sync` → `Gagal sinkron`
- Tombol utama: `Download Backup` → `Unduh Backup`, `Mengekspor` → `Membuat backup…`, `Import Backup` → `Pulihkan dari Backup`, `Mengimpor` → `Memulihkan…`, `Generate Teks Sync` → `Buat Teks Sinkron`, `Terapkan Sync` → `Terapkan Sinkron`, `Menyinkronkan` tetap
- Desc teks: `Sync manual via copy-paste` → `Sinkron manual via copy-paste`, `Generate teks terenkripsi` → `Buat teks terenkripsi`, `teks sync` → `teks sinkron`
- `aria-label="Toggle visibility"` → `aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}` (2 lokasi — import pw + sync pw)
- Pesan error validasi: `Tempel teks sync di atas` → `Tempel teks sinkron di atas terlebih dahulu`
- Fix bug kecil: `syncCopied` tampil teks JSX yang benar (sebelumnya ada string literal yang tidak dirender)

### FIX-BAHASA-03 — SettingsView desc Backup & Sync
**File:** `components/settings/SettingsView.tsx`
- `Export/Import .vault · Sync manual antar perangkat` → `Backup & pulihkan .vault · Sinkron antar perangkat`
- `Tong Sampah` → `Sampah` di Info Vault grid

---



### FIX-BUG-01 — Dokumentasi deviasi font Outfit vs Inter
**File:** `README.md`
- Tambah entri baru di section "Deviasi dari Standar Prompt"
- Menjelaskan alasan pilihan Outfit: karakter display lebih ekspresif untuk password manager dark/premium
- Deviasi sebelumnya tidak terdokumentasi — sekarang eksplisit seperti Custom CSS dan tanpa Firebase

### FIX-BUG-02 — Rename `idleSec` → `idleMinutes` di AutoLockManager
**File:** `components/shell/AutoLockManager.tsx`
- Variable `idleSec` menyimpan nilai dalam menit (bukan detik) — nama menyesatkan
- Rename ke `idleMinutes` agar sesuai dengan nilai aktual dan konsisten dengan `autoLockMinutes`
- Logika perbandingan tidak berubah (sudah benar), hanya nama variable

### FIX-INC-01 — Sinkronkan version package.json dengan constants.ts
**File:** `package.json`
- `"version": "0.1.0"` → `"0.8.0"` agar sinkron dengan `APP_VERSION` di `lib/constants.ts`
- Satu sumber kebenaran versi: `package.json` sebagai ground truth, `constants.ts` mengikuti

### FIX-INC-02 — Hapus duplikasi autoLockOptions, perbaiki inkonsistensi unit
**File:** `lib/constants.ts`, `components/settings/SettingsView.tsx`
- `constants.ts`: hapus `AUTO_LOCK_OPTIONS` yang ms-based (berbeda unit dari store), tambah `AUTOLOCK_OPTIONS_MIN` dalam menit + `@deprecated` JSDoc pada `AUTO_LOCK_DEFAULT_MS`
- `SettingsView.tsx`: import `AUTOLOCK_OPTIONS_MIN` dari constants, hapus definisi lokal `autoLockOptions` yang duplikat
- Inkonsistensi unit (ms vs menit) kini resolved — store dan options pakai unit yang sama (menit)

### FIX-INC-03 — Hapus prop dead `onGlobalLoading` dari VaultListView dan AppShell
**File:** `components/vault/VaultListView.tsx`, `components/shell/AppShell.tsx`
- `VaultListView`: hapus `onGlobalLoading` dari `VaultListViewProps` interface dan destructuring
- `AppShell`: hapus state `globalLoading`, handler `handleGlobalLoading`, dan linear progress bar yang tidak pernah di-trigger
- Prop sudah di-discard (`_`) sejak refactor sebelumnya tapi interface dan call site belum dibersihkan

### FIX-A11Y-01 — Modal gunakan aria-labelledby (WAI-ARIA Dialog pattern)
**File:** `components/ui/primitives/Modal.tsx`
- Import `useId` dari React untuk generate ID unik per instance modal
- Ganti `aria-label={title}` dengan `aria-labelledby={titleId}` yang referensi ke `<h3 id={titleId}>`
- Fallback: jika tidak ada `title`, tetap pakai `aria-label="Dialog"` agar selalu ada accessible name
- Sesuai WAI-ARIA Dialog Pattern — screen reader sekarang baca judul modal langsung dari elemen H3

### FIX-INC-04 — Tambah `data-search-input` ke Header search input
**File:** `components/shell/Header.tsx`
- Tambah atribut `data-search-input` ke `<input type="search">`
- AppShell keyboard handler `Cmd/Ctrl+K` mencari `[data-search-input]` — tanpa atribut ini shortcut tidak berfungsi
- Bug fungsional: shortcut `Cmd/Ctrl+K` sebelumnya selalu gagal karena selector tidak menemukan target

### FIX-STYLE-01 — Refactor SetupFlow dari inline style ke CSS classes
**File:** `components/lock/SetupFlow.tsx`, `styles/components/lock.css`
- Tambah 100+ baris CSS class di `lock.css`: `.setup-flow`, `.setup-steps`, `.setup-step`, `.setup-panel`, `.setup-input`, `.setup-strength`, `.setup-summary`, dll.
- Ganti ~59 `style={{}}` inline di SetupFlow dengan className equivalents
- Sisa 12 inline styles yang tidak bisa dihindari: dynamic computed color (strength meter), icon color, dan `flex: 1` di Button prop
- Konsistensi dengan komponen lain yang sepenuhnya class-based

### FIX-TEST-01 — Catat E2E tests sebagai backlog
**File:** `CHANGES.md` (file ini)
- Playwright + E2E tests untuk alur utama (unlock → tambah entri → lock) tidak ada
- Dicatat sebagai backlog — tidak dieksekusi di fase ini
- Prioritas rendah: unit tests sudah cover fungsi kritikal (crypto, storage, vaultService)

---

## Fix Fase 4 — Final Polish & Dokumentasi

### F4-01 — ThemeProvider ikut system preference
**File:** `components/providers/ThemeProvider.tsx`
- Import `LS_THEME` dari `storage.ts` (hapus duplikasi `STORAGE_KEY` lokal)
- Tambah fungsi `getInitialTheme()` yang cek `prefers-color-scheme` sebagai fallback
- Fallback ke `dark` jika system tidak diketahui (default password manager)
- `lsSet` sekarang menggunakan `LS_THEME` dari storage.ts, bukan string lokal

### F4-02 — SettingsView biometric disable via store
**File:** `components/settings/SettingsView.tsx`
- Hapus import `lsRemove` dan `LS_BIO_CRED_ID` yang tidak lagi diperlukan langsung
- Tombol "Hapus" biometrik sekarang hanya panggil `setBiometricEnabled(false)` + `setBiometricCredId(null)`
- `setBiometricCredId(null)` sudah handle `lsRemove` via fix F1-02 di appStore

### F4-03 — Scrollbar width 6px
**File:** `styles/base.css`
- Ubah `::-webkit-scrollbar` dari `4px` ke `6px` (lebar dan tinggi)
- Ubah `border-radius` dari `2px` ke `3px` untuk proporsional

### F4-04 — Update lucide-react ke versi terbaru
**File:** `package.json`
- lucide-react `^1.8.0` → `^1.14.0`
- Konfirmasi: versi 1.x adalah stable release (bukan anomali) — versi terbaru adalah 1.14.0
- Breaking changes: tidak ada antara 1.8.0 → 1.14.0 (minor releases)

### F4-05 — Keyboard shortcuts
**File:** `components/shell/AppShell.tsx`
- Tambah `useEffect` global keyboard handler
- `Cmd/Ctrl + K` → fokus ke search input (cari elemen dengan `data-search-input`)
- `Cmd/Ctrl + /` → toggle sidebar
- `Cmd/Ctrl + N` → tambah entri baru (hanya jika tidak sedang edit)
- `Escape` → tutup sidebar jika terbuka

### F4-06 — Dokumentasi deviasi standar
**File:** `README.md`
- Rewrite README dari template default Next.js
- Tambah section: stack, deviasi standar (Custom CSS, tanpa shadcn, tanpa RHF/Zod, tanpa Firebase)
- Tambah struktur folder
- Tambah link ke `readme-fix.md`

### F4-07 — CHANGES.md
**File:** `CHANGES.md` (file ini)
- Dibuat untuk dokumentasi perubahan dari semua fase fix

---

## Fix Fase 3 — Stack & Testing

### F3-01 — ESLint setup
**File:** `eslint.config.mjs` (baru), `package.json`
- ESLint 9 flat config dengan TypeScript-ESLint dan react-hooks plugin
- Script: `npm run lint`, `npm run lint:fix`

### F3-02 — Z-index tokens
**File:** `styles/tokens.css`, komponen yang pakai z-index hardcoded
- Tambah `--z-base`, `--z-dropdown`, `--z-modal`, `--z-overlay`, `--z-toast`, `--z-max`
- Ganti semua hardcoded z-index di CSS dengan token

### F3-03 & F3-04 — Framer Motion animasi modal
**File:** `components/ui/Modal.tsx`, komponen-komponen yang pakai Modal
- Tambah `framer-motion` ke dependencies
- Modal sekarang pakai `AnimatePresence` + `motion.div` untuk entrance/exit animation

### F3-05 & F3-06 — Vitest unit tests
**File:** `lib/__tests__/crypto.test.ts`, `lib/__tests__/storage.test.ts`, `vitest.config.ts`
- Setup Vitest dengan jsdom environment
- Test suite untuk crypto engine (AES-256-GCM, PBKDF2, generateSalt, sha256)
- Test suite untuk storage layer (lsGet, lsSet, lsRemove, lsGetBool, lsGetNum, clearAllVaultData)

### F3-07 — CSP headers
**File:** `vercel.json`
- Tambah Content Security Policy header yang ketat
- `default-src 'self'`, script/style `'self' 'unsafe-inline'` (diperlukan Next.js)
- `connect-src 'self'` (tidak ada external API)
- X-Frame-Options: DENY, X-Content-Type-Options: nosniff

---

## Fix Fase 2 — Standar Kode & Inkonsistensi

### F2-01 — Hardcoded colors PasswordStrengthMeter
**File:** `components/ui/PasswordStrengthMeter.tsx`, `styles/tokens.css`
- Tambah CSS variables `--str-1` s/d `--str-7` di tokens.css
- Ganti array hex hardcoded dengan `var(--str-*)` references

### F2-02 — Hardcoded colors CategoryIcon
**File:** `components/entries/CategoryIcon.tsx`, `styles/tokens.css`
- Tambah CSS variables `--cat-sosmed`, `--cat-email`, dll. di tokens.css
- Ganti `CAT_ICON_COLORS` object dengan CSS variable references

### F2-03 & F2-04 — Hardcoded colors di komponen lain
**File:** komponen-komponen yang pakai warna hardcoded
- Ganti semua hex colors dengan CSS variable yang sesuai

### F2-05 & F2-06 — Touch targets minimum 36px
**File:** CSS komponen interaktif
- Pastikan semua button, toggle, link memiliki min-height/min-width ≥ 36px

### F2-07 — Direct localStorage di komponen
**File:** berbagai komponen
- Ganti semua `localStorage.getItem/setItem/removeItem` langsung dengan `lsGet/lsSet/lsRemove` dari `storage.ts`

### F2-08 — Button variant alias duplikat
**File:** `components/ui/primitives.tsx`
- Hapus alias variant yang duplikat, normalisasi ke set variant yang konsisten

### F2-09 — Inline style hardcoded di Button spinner
**File:** `components/ui/primitives.tsx` atau `Button.tsx`
- Ganti inline `style={{ color: '#...' }}` dengan CSS class

### F2-10 — void customCats di EntryForm
**File:** `components/entries/EntryForm.tsx`
- Fix pemanggilan async function tanpa await yang menyebabkan unhandled promise

### F2-11 — generateId inline di komponen
**File:** komponen-komponen yang generate ID sendiri
- Ganti inline `Math.random().toString(36)` dengan `generateId()` dari `lib/utils.ts`

### F2-12 — LockScreen duplikasi state PIN
**File:** `components/lock/LockScreen.tsx`
- Fix state management PIN yang duplikat/tidak sinkron

---

## Fix Fase 1 — Bug & Keamanan Kritis

### F1-01 — Font CSS variable disconnect
**File:** `styles/tokens.css`
- `--font-sans: var(--font-outfit), 'Outfit', sans-serif`
- `--font-mono: var(--font-jetbrains), 'JetBrains Mono', monospace`

### F1-02 — setBiometricCredId(null) tidak hapus localStorage
**File:** `lib/store/appStore.ts`
- Tambah `else` branch: `lsRemove(LS_BIO_CRED_ID)` saat `id === null`

### F1-03 — Double @import tokens.css
**File:** `styles/base.css`
- Hapus `@import './tokens.css'` dari `base.css` (sudah diimport di `globals.css`)

### F1-04 — clearAllVaultData tidak hapus biometric keys
**File:** `lib/storage.ts`
- Tambah `LS_BIO_ENABLED` dan `LS_BIO_CRED_ID` ke daftar keys yang dihapus

### F1-05 — SW update event mismatch
**File:** `public/sw-register.js`, `public/sw.js`, `components/shell/AppShell.tsx`
- Hapus duplikasi `CustomEvent('sw-update')`
- Standarisasi ke `postMessage({ type: 'SKIP_WAITING' })`
- `sw.js` handle kedua format (string `'skipWaiting'` dan object `{ type: 'SKIP_WAITING' }`)

### F1-06 — global-error.tsx tidak ada
**File:** `app/global-error.tsx` (baru)
- Halaman fallback untuk error di root layout
- Inline styles dengan CSS variable fallback
- Tombol "Muat Ulang" fungsional

### F1-07 — not-found.tsx tidak ada
**File:** `app/not-found.tsx` (baru)
- Halaman 404 custom sesuai design system
- CSS variables + fallback, Link ke "/"

---

## Deviasi yang Tidak Diubah

| ID | Deskripsi | Alasan |
|---|---|---|
| T-06 | Font Outfit (bukan Inter sesuai prompt-personal) | Intentional — didokumentasikan di README section "Deviasi dari Standar Prompt" sejak Fix Fase 5 |
| K-03b | Tailwind/shadcn/RHF/Zod tidak ada | Intentional deviation — lihat README section "Deviasi dari Standar Prompt" |
| TEST-01 | Tidak ada E2E Playwright | Backlog — unit tests crypto/storage/vaultService sudah cover fungsi kritikal |
