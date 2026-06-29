# 🔐 Vault Next

**PWA password manager offline-first** berbasis Next.js (App Router), TypeScript strict, Zustand, dan enkripsi AES-256-GCM.

> **Versi saat ini:** v1.4.5  
> **Repo:** https://github.com/13angganh/vault-next  
> **Deploy:** Vercel (auto-deploy dari GitHub push)

---

## Stack

| Layer | Library / Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| State | Zustand 5 |
| Enkripsi | AES-256-GCM + PBKDF2 dua lapis (Web Crypto API) |
| Animasi | Framer Motion 12 |
| Ikon | lucide-react |
| Font | Inter (body) + JetBrains Mono (mono) via `next/font/google` |
| Lint | ESLint 9 (flat config) + TypeScript-ESLint |
| Deploy | Vercel |
| Storage | localStorage (terenkripsi) — 100% offline, tanpa server |

---

## Menjalankan Proyek

```bash
npm install
npm run dev        # development server → http://localhost:3000
npm run build      # production build
npm run lint       # ESLint (0 warning = pass)
npm run typecheck  # tsc --noEmit
```

---

## Struktur Folder

```
app/
  layout.tsx         → Root layout, anti-flash tema (inline script di <head>)
  page.tsx           → Entry point — splash, LockScreen, atau AppShell
  loading.tsx        → Next.js loading fallback
  error.tsx          → Error boundary route-level
  global-error.tsx   → Error boundary global (layout crash)
  not-found.tsx      → 404 custom

components/
  common/            → LoadingScreen (splash branding), ErrorBoundary
  entries/           → EntryCard, EntryForm, DetailView, CategoryIcon
  lock/              → LockScreen, PINPad, RecoveryPanel, SetupFlow, BiometricHintModal
  providers/         → ThemeProvider (Light / Dark)
  settings/          → SettingsView, PINSettingsPanel, BackupModal, CategoryManager
  shell/             → AppShell, Header, Sidebar, AutoLockManager
  ui/
    primitives/      → Button, Input, Textarea, Modal, Toggle, Badge, Skeleton,
                       EmptyState, ErrorState, IconButton, ConfirmDialog
    PasswordStrengthMeter.tsx
    PasswordGenerator.tsx
    Toast.tsx
  vault/             → VaultListView

lib/
  animation.ts       → Konstanta DUR/EASE untuk Framer Motion (sumber tunggal)
  hooks/             → useRipple, useFocusTrap, useMounted, useClipboard
  store/             → appStore.ts (Zustand)
  constants.ts       → APP_NAME, APP_VERSION ← SUMBER VERSI
  crypto.ts          → AES-256-GCM, PBKDF2, format vault2 (FROZEN)
  format.ts          → Utilitas format (id-ID locale)
  logger.ts          → Logger terpusat (dev only)
  storage.ts         → localStorage abstraction (lsGet, lsSet, lsRemove)
  types.ts           → TypeScript types & interfaces
  utils.ts           → generateId, formatDate, helper
  vaultService.ts    → CRUD vault (enkripsi/dekripsi/backup/export/import)

public/
  sw.js              → Service Worker (CACHE_VER sinkron dengan APP_VERSION)
  sw-register.js     → SW registration + --vh CSS var setter
  manifest.json      → PWA manifest

styles/
  globals.css        → @import semua modul CSS (urutan penting: tokens -> base -> layout -> ...)
  tokens.css         → CSS variables (spacing, radius, font, z-index, easing, layout)
  base.css           → Reset, tema light/dark, str-* tokens, warna sistem
  layout.css         → AppShell, header, sidebar, vault list
  components/
    animations.css   → @keyframes global (aktif: fadeIn, fadeUp, fadeScaleIn, shake, pulseGold,
                       ripple, spin, bounceSoft, shimmer, entryStaggerIn, bodyReveal, badgeFadeIn)
    entries.css      → EntryCard, EntryForm, CategoryIcon, form fields
    lock.css         → LockScreen, PINPad, BiometricHintModal (v1.4.1: dari inline style)
    modal.css        → .modal-overlay (satu definisi), .modal, BackupModal, ConfirmDialog
    settings.css     → SettingsView, CategoryManager, collapsible sections
    sidebar.css      → Sidebar, header nav, overlay
    ui.css           → Button, ibtn, Badge (sumber tunggal), Toast, PasswordGenerator
```

---

## Format Data & Kompatibilitas

> ⚠️ Bagian ini **tidak boleh berubah** tanpa migrasi eksplisit.

- **Format backup:** `vault2` — identifier tetap, tidak boleh ganti
- **Crypto engine:** PBKDF2 dua lapis — 600k SHA-256 + 100k SHA-512, `VER_ENHANCED = 0xAB`
- **File import:** `.vault` dan `.json` diterima
- **Field entri (frozen):** `id`, `cat`, `name`, `user`, `pass`, `url`, `note`, `network`,
  `walletAddr`, `walletPw`, `seedPhrase`, `fav`, `ts`
- **Field entri tambahan:** `cardNo`, `cardHolder`, `cardExpiry`, `cardCVV`,
  `wifiSSID`, `wifiPass`, `emailAddr`
- **CustomCategory:** `id`, `label`, `emoji`, `iconKey`, `color?` (optional, v1.3.6+)

---

## Fitur

| Fitur | Keterangan |
|---|---|
| PIN 6 digit | Login cepat, lockout setelah salah berulang |
| Master Password | Fallback login jika PIN tidak tersedia |
| Recovery Phrase | Pulihkan master password dari seed phrase |
| Biometrik (WebAuthn) | Fingerprint / Face ID via platform authenticator |
| Auto-lock | Timer 1–60 menit |
| Lock per-entri | Entri dikunci individual dengan PIN |
| Kategori custom | Buat, edit, hapus kategori dengan icon + color picker (12 warna) |
| Recycle Bin | Hapus → restore sebelum benar-benar dihapus |
| ConfirmDialog | Semua aksi destruktif dikonfirmasi — konsisten di seluruh app |
| Password visibility toggle | Form entri punya Eye/EyeOff di field password |
| Backup / Restore | Export `.vault`, import `.vault` atau `.json` |
| Sync antar perangkat | Via teks terenkripsi (copy-paste manual) |
| Password generator | Generator dengan strength meter |
| Seed phrase entry | Grid atau textarea 12/24 kata |
| Tema | Light / Dark (anti-flash: tema langsung benar dari paint pertama) |
| PWA offline | 100% offline setelah install pertama |
| Empty state + action | Vault kosong punya tombol "+ Tambah Entri" langsung |

---

## Versioning

Tiga tempat yang harus selalu sinkron:

```
lib/constants.ts  → APP_VERSION = '1.4.3'
package.json      → "version": "1.4.3"
public/sw.js      → CACHE_VER = 'v1.4.3'
```

### Konvensi

```
MAJOR (x.0.0)  → Breaking change: ganti format data, crypto engine
MINOR (1.x.0)  → Fitur baru, refactor signifikan
PATCH (1.1.x)  → Hotfix bug spesifik
```

---

## Arsitektur CSS

### Sistem design token
Semua nilai visual via CSS custom properties. Tidak ada hardcoded hex atau px di komponen.

| Token group | File | Contoh |
|---|---|---|
| Spacing | `tokens.css` | `--space-1` (4px) … `--space-16` (64px) |
| Typography | `tokens.css` | `--text-xs` (10px) … `--text-3xl` (36px) |
| Warna | `base.css` | `--gold`, `--red`, `--teal`, `--muted`, dll |
| Z-index | `tokens.css` | `--z-modal` (400), `--z-top` (9999) |
| Easing | `tokens.css` | `--ease-out`, `--ease-spring` |
| Durasi animasi | `lib/animation.ts` | `DUR.tap` (0.12s) … `DUR.emph` (0.30s) |

### Konvensi komponen
- **Inline style dilarang** kecuali nilai yang benar-benar dynamic (warna dari data user)
- **Framer Motion**: pakai `DUR.*` dan `EASE.*` dari `lib/animation.ts` — bukan literal angka
- **Icon-only buttons**: wajib punya `aria-label`
- **Komponen helper di dalam komponen**: dilarang — harus top-level function (cegah re-mount bug)

### Sistem icon-button (tiga tipe, masing-masing tujuan berbeda)
| Class | Dipakai di | Ukuran | Style |
|---|---|---|---|
| `.ibtn` | Modal close, icon action dalam body konten | 32px | Border subtle, ripple effect |
| `.icon-btn` | Header app (tambah, tema, kunci) | 44px | Background pseudo-element |
| `.btn-icon` | PasswordGenerator (copy, regenerate, close) | 34px | Border + bg-s3 |

Ketiganya punya `:hover`, `:active` (scale 0.88), dan `aria-label` yang konsisten.

---

## Changelog

### v1.4.5 — Animasi Smooth + PINPad Refactor (2026-06-14)

**Fix bug flash panel master password saat app pertama dibuka:**
- Root cause: `skipSplash` default `true` → `LockScreen` dirender di frame
  pertama sebelum `useEffect` baca `sessionStorage` → `initialPanel()` pilih
  panel `master` dari localStorage → flash sekilas sebelum JS koreksi state
- Fix: tambah state `hydrated` (default `false`) yang blokir semua render.
  Saat `hydrated=false`: render `div` transparan (cegah layout shift).
  Setelah `useEffect` selesai baca sessionStorage → `hydrated=true` → render state benar
- `LockScreen` dibungkus `AnimatePresence + motion.div` dengan fade-in

**Animasi panel LockScreen:**
- Tambah `AnimatePresence mode="wait"` di dalam `ls-card`
- Setiap panel (pin/master/seed/recovery/setup) dibungkus `motion.div`
  dengan `initial y:8 → animate y:0` + opacity fade
- `mode="wait"`: panel lama exit dulu sebelum panel baru enter — smooth
- `useReducedMotion()` aware di semua animasi baru

**AppShell entrance animation:**
- `app-shell div → motion.div` dengan `opacity:0→1, y:6→0`
- Transisi dari LockScreen ke vault terasa halus

**Global transition polish:**
- Hapus wildcard `*, *::before, *::after { transition: ... }` yang
  berlaku ke SEMUA elemen DOM termasuk SVG/img → GPU overhead tidak perlu
- Ganti dengan selector targeted: `button, .btn, .ibtn, .entry-card`, dll
- `will-change: transform` di `.entry-card` → pindah ke `:hover` only
  (dari permanen di semua card → hanya aktif saat user hover)

**PINPad refactor (inline style → className CSS):**
- Hapus semua inline `style={{}}` dari PINPad, ganti dengan className
- Tambah CSS: `.pinpad`, `.pin-dot`, `.pin-dot--filled/success/error`,
  `.pin-key`, `.pin-key--del/empty`, `.pinpad__grid--disabled`
- `motion.button` + `whileTap` untuk key press feedback (scale 0.88)
- `aria-label` di semua tombol digit dan delete

**Bug fix: pinDotBounce keyframe dihapus di v1.4.0 tapi masih dipakai:**
- v1.4.0 salah hapus `pinDotBounce` karena dianggap dead code (grep
  mencari `animation: pinDotBounce` di CSS, tapi dipakai via
  `dot.style.animation = 'pinDotBounce ...'` di JavaScript)
- Fix: tambah kembali `pinDotBounce` + `pinDotSuccess` di `animations.css`

**CSS animation standardisasi:**
- Ganti semua `cubic-bezier(0.4, 0, 0.2, 1)` → `var(--ease-default)`
- Ganti `cubic-bezier(0.34, 1.x, 0.64, 1)` → `var(--ease-spring)`
- Ganti `ease` bare → `var(--ease-default)` di 7 file CSS

### v1.4.3 — Kontras Warna + Aria-label (2026-06-14)
- `--muted` dark mode: `#6b6d85` (3.77:1) → `#8486a2` (5.37:1) — lolos WCAG AA teks kecil
- `--gold` light mode: `#C8860A` (3.06:1) → `#9F6400` (4.89:1) — lolos WCAG AA
- EntryCard header: tambah `aria-label` dinamis ("Buka/Tutup + nama entri")
- CategoryManager icon picker: `aria-label` diperjelas

### v1.4.2 — Standardisasi Token CSS & Animasi (2026-06-14)
- 15 `font-size` hardcoded → `var(--text-*)` token
- 69 spacing hardcoded (`6px/10px/14px`) → `var(--space-*)` token
- Buat `lib/animation.ts`: `DUR.tap/fast/normal/expand/emph` + `EASE.out/inOut/spring/cubicOut`
- 14 nilai durasi/ease literal Framer Motion → `DUR.*`/`EASE.*` konstanta

### v1.4.1 — Konsolidasi Modal + Icon-Button (2026-06-14)
- `BiometricHintModal`: 35 inline `style={{}}` → className CSS di `lock.css`
- `z-index: 1200` literal → `var(--z-top)` (9999)
- Warna `rgba(245,158,11,...)` → `var(--gold-dim)`/`var(--gold-border)`
- `BackupModal`: `icon-btn` → `ibtn` (3 lokasi) — satu sistem
- `.ibtn:active` dan `.icon-btn:active`: tambah `scale(0.88)` — sebelumnya tidak ada

### v1.4.0 — Batch 1: Bug Fix + Dead Code Cleanup (2026-06-14)

**Bug fix nyata:**
- `EntryForm`: field password `type="text"` permanen → `type="password"` + Eye/EyeOff toggle
- `EntryForm`: konfirmasi sebelum ganti kategori menghapus field yang sudah diisi
- `EntryForm`: `ConfirmDialog` warning sebelum simpan entri kosong total
- `LoadingScreen`: timer artifisial 2200ms → 700ms + skip via sessionStorage (sekali per sesi)
- `layout.tsx`: anti-flash script tema sungguhan di `<head>` (sebelumnya hanya ada di komentar)
- `DetailView`: pola double-tap delete → `ConfirmDialog` (konsisten dengan EntryCard)

**Pola bug re-render diperbaiki:**
- `DetailView`: `FieldRow` & `SeedSection` → top-level component
- `EntryCard`: `Field` & `SeedField` → top-level component
  (sama seperti fix `SectionWrap` v1.3.6)

**Dead code dihapus:**
- 6 keyframe tidak terpakai: `slideInLeft`, `slideInRight`, `slideDown`, `scaleUp`, `pinDotBounce`, `pinDotSuccess`
- 5 utility class tidak terpakai: `animate-fade-in/up/scale/slide-in`, `label-caps`
- Sistem modal dash-style (`.modal-header`, `.modal-title`, dll) — dead code total
- 2 dari 3 definisi duplikat `.modal-overlay`
- Duplikat `@keyframes spin` di `ui.css`
- Duplikat `.badge` di `modal.css` (juga fix bug `font-family: mono` pada Badge primitive)
- Duplikat `--str-1..7` di `tokens.css` (selalu di-override `base.css`, mati)
- `.detail-action-btn--confirm` CSS (pola double-tap yang diganti ConfirmDialog)

**Metadata & konsistensi:**
- `manifest.json`: nama dan deskripsi diperbarui
- `sw.js`: `CACHE_VER` sinkron dengan `APP_VERSION`
- `tokens.css`: font fallback `'Outfit'` → `'Inter'` (font yang sebenarnya dimuat)
- `not-found.tsx` + `global-error.tsx`: warna fallback → sistem aktif (`#f0a500`, `#07080f`, Inter)

**Fitur baru kecil:**
- `VaultListView`: tombol "+ Tambah Entri" di empty state vault & kategori kosong
- `CategoryManager`: loading state saat `saveVault` (spinner + disabled)

### v1.3.9 — Fix Crash Render Generator Password (2026-06-14)
- Root cause: `.btn-icon` tidak pernah didefinisikan di CSS → kotak putih solid
- Ganti karakter unicode `↻` dengan Lucide `RotateCw`
- Fix 10 token CSS tidak valid di `ui.css` dan `entries.css`
- Tombol salin/regenerate: 34×34px dengan border dan background

### v1.3.8 — Fix Warna Kategori Persisten (2026-06-14)
- Root cause: `customCats` disimpan di dua tempat; `loadVault` overwrite `LS_CATS`
- Fix: `CategoryManager` panggil `saveVault()` setelah setiap tambah/edit/hapus

### v1.3.7 — Fix Preview Warna Kategori di List (2026-06-14)
- Root cause: list pakai `color="var(--muted)"` hardcoded, tidak baca `cat.color`
- Tombol Tambah Kategori: `min-height: 52px`, `font-size: text-md`

### v1.3.6 — Fix Berkedip Settings + Warna Kategori Custom (2026-06-14)
- Root cause berkedip: `SectionWrap` di dalam body komponen → re-creation tiap render
- Fix: refactor ke top-level `SectionItem` (pola yang sama diterapkan lagi di v1.4.0)
- Tambah `color?: string` ke `CustomCategory` interface (optional, backward-compat)
- Color picker 12 preset warna di form tambah/edit kategori
- `CategoryIcon` baca `customCat.color` untuk warna ikon dan background

### v1.3.5 — Audit Total Settings (2026-06-14)
- Fix bug Keamanan: `PINSettingsPanel` height dinamis di dalam `motion.div height:0→auto`
  → konten terpotong; fix: prop `dynamicHeight` untuk section dengan konten berubah
- Fix badge Backup & Sync: badge duplikat dari Penyimpanan → dihapus
- Fix inkonsistensi Tampilan: tombol "Ke Terang"/"Ke Gelap", desc informatif
- Fix badge Kategori: `+N custom` atau `8 bawaan`
- Fix badge muted: "Gelap" bukan status negatif → gold

### v1.3.4 — Badge Highlight Settings + Hapus Sesi (2026-06-14)
- Badge status di header tiap section saat collapsed (gold = aktif, abu = nonaktif)
- Hapus section Sesi (tombol kunci sudah ada di header)
- Info Vault: grid 4 kolom (Entri · Sampah · AES-256 · Versi)

### v1.3.3 — Settings Default Tertutup (2026-06-14)
- `openSections` default semua `false` — tertutup saat pertama buka

### v1.3.2 — Fix Bug Settings + Posisi Versi (2026-06-14)
- Root cause bug settings: `overflow: hidden` di container blokir Framer Motion `height: auto`
- Duplikat `.settings-page__body` konflik
- Versi LockScreen: dalam `.ls-logo` (rapat dengan judul)
- Versi Sidebar: di bawah nama "Vault Next" di header

### v1.3.1 — Versi Tampil + Settings Collapsible (2026-06-14)
- Versi tampil di 3 tempat: LockScreen, Sidebar, Settings Info Vault
- Settings: 8 section collapsible dengan Framer Motion + ChevronDown
- Konsistensi teks: hierarki label/desc/title di seluruh settings
- 8 token CSS tidak valid diperbaiki

### v1.3.0 — UI/UX Upgrade Menyeluruh (2026-06-14)
- 62 token CSS tidak valid di `entries.css` diganti
- Framer Motion di EntryCard: `motion.div`, `AnimatePresence` body, chevron rotate, `whileTap`
- Stagger entrance vault list (CSS `nth-child`, `prefers-reduced-motion` aware)
- Hover shadow lift + expanded left accent bar
- Button `btn-primary/gold`: hover glow `var(--shadow-gold)`
- Hapus bottom navigation CSS

### v1.2.0 — ConfirmDialog Universal + Fix Export Backup (2026-06-13)
- `ConfirmDialog` primitive: 3 variant (danger/warning/lock), `createPortal`, `z-top`
- Fix download anchor: `appendChild` → `click` → `removeChild` + `setTimeout revoke`
- Fix stale closure `masterPw` di `doImport`/`doSyncReceive`

### v1.1.1 — Patch PIN + Seed Textarea (2026-06-12)
- PIN hardcode 6 digit
- Seed phrase textarea: local raw state, spasi bisa diketik

### v1.1.0 — Bug Fix & UI/UX (2026-06-12)
- Keyboard tidak hide layout (`interactiveWidget: resizes-visual`, `--vh` via `visualViewport`)
- CSP: tambah `fonts.gstatic.com`
- PINPad throttle 60ms

### v1.0.0 — Rilis Awal
- Next.js 16, TypeScript strict, Zustand 5, AES-256-GCM
- Semua fitur inti: PIN, biometrik, backup, sync, kategori, recycle bin, tema

---

## Catatan Penting

**Custom CSS bukan Tailwind** — design system via CSS variables + modular files di `styles/components/`.

**Tanpa Firebase / Cloud** — 100% offline, semua di localStorage (terenkripsi AES-256-GCM). Format backup `vault2` frozen untuk kompatibilitas.

**`lib/crypto.ts` FROZEN** — jangan ubah tanpa migrasi data eksplisit. Perubahan di sini akan membuat semua backup lama tidak bisa dibuka.
