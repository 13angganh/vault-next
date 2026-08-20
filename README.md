# 🔐 Vault Next

**PWA password manager offline-first** berbasis Next.js (App Router), TypeScript strict, Zustand, dan enkripsi AES-256-GCM.

> **Versi saat ini:** v1.10.1  
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
  design-tokens.ts   → Sumber tunggal semua design token (spacing, radius, warna,
                       font, z-index, layout) — styles/tokens.css DI-GENERATE dari
                       sini via `npm run tokens`, JANGAN edit tokens.css langsung
  hooks/             → useRipple, useFocusTrap, useMounted, useClipboard
  store/             → appStore.ts (Zustand)
  constants.ts       → APP_NAME, APP_VERSION ← SUMBER VERSI (lihat bagian Versioning)
  crypto.ts          → AES-256-GCM, PBKDF2, format vault2 (FROZEN)
  format.ts          → Utilitas format (id-ID locale)
  logger.ts          → Logger terpusat (dev only)
  storage.ts         → localStorage abstraction (lsGet, lsSet, lsRemove)
  types.ts           → TypeScript types & interfaces
  utils.ts           → generateId, formatDate, helper
  vaultService.ts    → CRUD vault (enkripsi/dekripsi/backup/export/import)

scripts/
  generate-tokens.ts     → Generate styles/tokens.css dari lib/design-tokens.ts
                           (`npm run tokens`, juga jalan otomatis via hook prebuild)
  generate-sw-version.ts → Sinkronkan CACHE_VER di public/sw.js dari APP_VERSION
                           (`npm run sw-version`, juga jalan otomatis via hook prebuild)

public/
  sw.js              → Service Worker (CACHE_VER auto-sync dari APP_VERSION,
                       JANGAN edit manual — lihat scripts/generate-sw-version.ts)
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
| Verifikasi 2 Langkah (kategori Email) | Toggle, telepon/email pemulihan, 10 kode cadangan (grid atau teks, pola input identik seed phrase) |
| Lock/unlock kategori | Kategori default & custom bisa dikunci dari edit/hapus tak sengaja |
| Field kategori dinamis | Field form per kategori bisa dikustomisasi lewat Pengaturan (default maupun custom) |
| Tema | Light / Dark (anti-flash: tema langsung benar dari paint pertama) |
| PWA offline | 100% offline setelah install pertama |
| Empty state + action | Vault kosong punya tombol "+ Tambah Entri" langsung |

---

## Versioning

**v1.9.1: BUG FIX dokumentasi** — bagian ini sebelumnya menyebut nilai
contoh `'1.6.3'` di ketiga tempat (basi, tertinggal beberapa minor
version) DAN secara implisit menyuruh mengedit ketiganya secara manual
— padahal sejak v1.9.0, `public/sw.js` sudah disinkronkan **otomatis**
lewat `scripts/generate-sw-version.ts` + hook `"prebuild"` di
`package.json`. Dokumentasi lama ini bertentangan dengan mekanisme yang
sudah dibangun sendiri di proyek — diperbaiki di sini, bukan cuma
angkanya.

**Yang perlu diedit MANUAL saat rilis versi baru (2 tempat):**

```
lib/constants.ts  → export const APP_VERSION = '1.9.0';   ← edit ini DULUAN
package.json      → "version": "1.9.0",                    ← lalu samakan manual
```

**Disinkronkan OTOMATIS, JANGAN edit manual:**

```
public/sw.js      → const CACHE_VER = 'v1.9.0';
```

`CACHE_VER` ditulis ulang dari `APP_VERSION` setiap `npm run build`
(lewat hook `prebuild`), atau jalankan `npm run sw-version` untuk
menyinkronkan tanpa build penuh. Mengedit `CACHE_VER` di `sw.js` secara
manual akan tertimpa oleh build berikutnya — komentar di file itu
sendiri juga sudah menandainya.

Verifikasi sinkron: `lib/__tests__/swVersion.test.ts` menjaga
`CACHE_VER` selalu sama dengan `APP_VERSION` — gagal di CI/test run
kalau pernah tidak sinkron lagi.

`package.json` belum punya mekanisme otomatis serupa — tetap harus
disamakan manual dengan `APP_VERSION` setiap rilis. (Catatan untuk
sesi mendatang: kandidat untuk disatukan lewat mekanisme yang sama
seperti `sw-version`, belum dikerjakan.)

### Konvensi

```
MAJOR (x.0.0)  → Breaking change: ganti format data, crypto engine
MINOR (1.x.0)  → Fitur baru, refactor signifikan, ATAU multi-bug-fix
                 (2+ temuan independen dalam satu sesi)
PATCH (1.1.x)  → Hotfix bug spesifik tunggal
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

### v1.10.1 — Bug Fix: Dropdown Tipe Field Rusak Visual + Fitur Field Multi-Isian (2026-08-11)

**Konteks:** pengguna melaporkan lewat 3 screenshot: dropdown pemilih
tipe field (di editor field kategori custom, fitur v1.10.0) tampil
rusak — kotak menciut kosong tak terbaca, badge "Bawaan" terlihat
menyatu ke input di sampingnya, sulit diklik. Sekaligus meminta field
kustom bisa dibuat benar-benar bebas namanya (bukan cuma memilih dari
tipe bawaan), dan kategori Email default bisa punya field 10-isian
mirip seed phrase crypto untuk 2FA — bukan cuma toggle sederhana.

**Diagnosis:** dropdown tipe field sebelumnya `<select>` HTML native
di dalam flex container. Meski sudah diberi `flex-shrink: 0`, elemen
form native ini tidak stabil ukuran dan rendering teksnya di WebView
Android — beberapa hipotesis diuji dan ditolak sebelum sampai ke akar
masalah (bukan cuma soal lebar minimum; kuirk User Agent Stylesheet
browser untuk elemen `<select>` di dalam flexbox tidak sepenuhnya bisa
diprediksi dari CSS statis semata). Diperbaiki dengan mengganti
`<select>` sepenuhnya dengan **dropdown kustom** (tombol trigger +
popup absolute + backdrop) — pola IDENTIK dengan `.vault-sort-menu`
yang sudah terbukti stabil di `VaultListView.tsx` sejak versi lama,
bukan pola baru yang belum teruji.

**Field kustom "benar-benar custom":** mekanisme mengetik nama field
bebas sebenarnya sudah ada sejak v1.10.0 (`<input>` untuk label, bukan
elemen statis) — placeholder-nya diperjelas dari "Nama field, mis.
Nomor Meja" menjadi "Nama field kamu sendiri, mis. Nomor Meja" supaya
lebih jelas menunjukkan field itu memang bebas dinamai, bukan terbatas
ke nama tipe seperti yang terlihat rusak di screenshot.

**Field multi-isian (permintaan baru dalam laporan yang sama):** tipe
field `'multi'` ditambahkan ke dropdown tipe — grid multi-kotak
bernomor ATAU mode teks satu blok, pola input IDENTIK dengan
`renderTwoFASection`'s backup codes (Bagian 1, sesi v1.10.0) tapi
GENERIK untuk field key apa pun (bukan hardcode ke satu field 2FA),
sehingga bisa dipakai berkali-kali untuk beberapa field multi berbeda
dalam satu kategori. Jumlah isian bisa diatur pengguna (2–30, default
10) lewat input baru yang muncul saat tipe "Multi-isian" dipilih.
Nilainya tetap disimpan sebagai satu string di
`VaultEntry.customFields[key]` (dipisah newline saat serialisasi,
dipecah lagi saat render) — TIDAK mengubah tipe `customFields` yang
sudah dipakai luas di banyak tempat sejak v1.10.0.

**Perubahan skema:** `CategoryFieldDef.type` (`lib/types.ts`) menambah
opsi `'multi'`, plus `CategoryFieldDef.multiCount?: number`. Field
baru, opsional — backward-compat penuh dengan `defaultCatFieldOverrides`/
`CustomCategory.fields` yang sudah tersimpan dari v1.10.0.

**Test:** 14 test baru — 8 untuk dropdown kustom (`CategoryManager.test.tsx`:
label trigger, buka/tutup menu, pilih tipe, klik backdrop, toggle
buka-tutup via trigger yang sama, input jumlah isian muncul/hilang/
dibatasi 2–30) dan 6 untuk rendering field multi di form entri
(`EntryForm.test.tsx`: label & jumlah isian benar, grid sesuai
`multiCount` bukan default 10, isolasi antar kotak, toggle mode
grid↔teks mempertahankan isi, parsing teks-ke-array, reset saat ganti
kategori). Satu gap cakupan ditemukan & ditutup di tengah proses:
test awal untuk dropdown tidak menguji kemampuan **toggle-tutup**
(klik trigger yang sedang terbuka untuk menutupnya lagi) — dibuktikan
dengan sengaja merusak logika toggle dan mendapati semua test tetap
lolos; ditambahkan test khusus untuk skenario itu, divalidasi ulang
dengan cara yang sama. Setiap fix lain juga divalidasi dengan sengaja
merusak logikanya lebih dulu dan mengonfirmasi test yang relevan gagal
tepat sasaran. 149→163 test, semuanya lolos.

**Verifikasi:** `tsc --noEmit` 0 error, `eslint --max-warnings 0` 0
error/warning, `vitest run` 163/163 lolos.

### v1.10.0 — Fitur Besar: Verifikasi 2 Langkah, Lock/Unlock Kategori, Field Kategori Dinamis (2026-08-10)

**Konteks:** permintaan fitur baru dari pengguna (bukan bug fix) —
(1) field Verifikasi 2 Langkah untuk kategori Email dengan pola input
kode cadangan identik seed phrase crypto; (2) kemampuan mengunci
kategori (default maupun custom) dari edit/hapus tidak sengaja,
dengan indikator lock/unlock; (3) field form per kategori bisa
dikustomisasi pengguna lewat Pengaturan, bukan hardcode di kode,
berlaku untuk kategori default maupun custom secara setara.

#### 1. Verifikasi 2 Langkah (kategori Email)

Field baru di `VaultEntry` (menghormati aturan Schema BEKU di
`lib/types.ts` — field baru ditambahkan, field lama tidak diubah):
`twoFAEnabled`, `twoFAPhone`, `twoFARecoveryEmail`,
`twoFABackupCodes`. Toggle Aktif/Nonaktif menyembunyikan/menampilkan
field pemulihan. Kode cadangan (selalu 10 kode, tanpa opsi
ganti-panjang seperti seed phrase 12/24) memakai pola input yang
IDENTIK dengan `renderSeedSection()` — mode grid per-kode bernomor
atau mode teks satu blok (pemisah baris atau spasi), dengan konversi
dua arah. Data 2FA di-reset otomatis saat kategori diganti (tidak
"menempel" dari kategori sebelumnya), konsisten dengan penanganan
`seedWords` yang sudah ada. 10 test baru di `EntryForm.test.tsx`.

#### 2. Lock/Unlock Kategori

State `lockedCatIds` ditambahkan paralel dengan `lockedIds` (yang
sudah ada untuk entri), mengalir lewat seluruh siklus hidup vault
(setup, unlock, save, export, import, sync antar perangkat) —
tersimpan di dalam payload vault terenkripsi, bukan localStorage
plain, konsisten dengan `customCats`.

**Temuan & perbaikan penting selama implementasi:** audit menyeluruh
menemukan **11 titik** pemanggilan `saveVault`/`exportBackup` di 6
file (`VaultListView`, `EntryForm`, `EntryCard`, `DetailView`,
`BackupModal`, `CategoryManager`) yang awalnya tidak menyertakan
`lockedCatIds` — setiap aksi sehari-hari terhadap entri (favorit,
hapus, pulihkan, kunci) akan diam-diam menimpa data kategori terkunci
jadi kosong. Diperbaiki di seluruh titik, diverifikasi dengan script
penghitung argumen struktural (menangani nested parentheses dan
multi-line call dengan benar) — bukan grep manual yang rawan
melewatkan satu titik.

UI: tombol Lock/Unlock (icon biru saat terkunci, komponen `IconButton`
dengan varian `colorHover="lock"` yang sudah disiapkan di kode sejak
sebelumnya tapi belum pernah dipakai) muncul di setiap kategori —
default maupun custom. Tombol Edit & Hapus kategori custom otomatis
nonaktif saat terkunci, dengan proteksi berlapis: atribut `disabled`
di UI, guard eksplisit di dalam fungsi handler itu sendiri (diekstrak
sebagai pure function `isCategoryLocked` di `lib/utils.ts`, bukan
inline), dan `pointer-events: none` di CSS.

**Pelajaran metodologi test yang ditemukan sesi ini:** dua test awal
yang mengklaim menguji "guard lapis kedua" di dalam handler ternyata
tidak menguji apa pun secara berarti — dibuktikan dengan sengaja
menghapus guard-nya dan test tetap lolos, dua kali dengan pendekatan
berbeda. Akar masalah: React mencegah `onClick` terpanggil sama
sekali pada elemen dengan prop `disabled=true`, berdasarkan prop
render internal, bukan atribut DOM — sehingga tidak ada cara
memicu lapisan guard lewat simulasi klik UI. Diperbaiki dengan
mengekstrak logika guard sebagai pure function yang diuji unit secara
langsung (`lib/__tests__/utils.test.ts`), tervalidasi dengan sengaja
merusak fungsi itu sendiri dan mengonfirmasi test gagal tepat
sasaran. 9 test UI + 5 test unit baru.

#### 3. Field Kategori Dinamis

Perubahan arsitektur paling signifikan sesi ini — field per kategori
sebelumnya hardcode statis (`FIELDS_BY_CAT` di `EntryForm.tsx`),
sekarang data yang bisa dikustomisasi pengguna:

- `CategoryFieldDef` (interface baru di `lib/types.ts`) — definisi satu
  field (key, label, type). Field bawaan tetap memetakan ke properti
  `VaultEntry` asli (backward-compat penuh dengan data lama); field
  kustom baru disimpan generik di `VaultEntry.customFields` (field
  baru, Schema BEKU dihormati).
- `defaultCatFieldOverrides` (state store baru, tersimpan di vault
  terenkripsi) menyimpan kustomisasi field kategori DEFAULT.
  `CustomCategory.fields` (field baru, opsional) menyimpan field
  kategori CUSTOM. **Keputusan desain yang dipertimbangkan lalu
  dibatalkan:** sempat mempertimbangkan menyimpan override kategori
  default sebagai "entri bayangan" di dalam `customCats` — dibatalkan
  setelah audit menunjukkan ini akan menyebabkan duplikasi ID dan
  render ganda di banyak tempat (Sidebar, VaultListView,
  CategoryManager yang semuanya mengasumsikan `customCats` murni
  berisi kategori custom asli).
- `getFieldsForCat()` digabung ulang total — menggabungkan field
  bawaan dengan override dari pengguna, fallback ke perilaku lama
  persis jika belum ada override (tidak ada perubahan untuk pengguna
  yang belum menyentuh fitur ini). 14 test unit di
  `dynamicFields.test.ts` mencakup setiap kombinasi.
- Field kustom (key bebas, di luar `keyof VaultEntry`) butuh mekanisme
  render terpisah — `FieldKey` diubah jadi "branded string"
  (`keyof VaultEntry | (string & {})`) untuk mempertahankan
  type-safety field bawaan sambil menerima key bebas. State React
  terpisah (`customFieldValues`) menampung nilai field kustom karena
  `values` (bertipe `Partial<VaultEntry>`) tidak bisa menerima key
  sembarang secara type-safe.
- UI editor field (`CategoryManager.tsx`, mode baru `'edit-fields'`):
  tombol "Kelola Field" di setiap kategori (dinonaktifkan saat
  terkunci, terintegrasi dengan fitur lock/unlock di atas). Field
  bawaan ditandai badge "Bawaan", tidak bisa dihapus tapi labelnya
  bisa diubah. Field kustom baru mendapat key otomatis dari slug
  labelnya (prefix `custom_`, disinkronkan real-time saat mengetik —
  berhenti disinkronkan begitu field pernah tersimpan, supaya key
  tidak berubah-ubah setelah data mulai terisi). Validasi mencegah
  field tanpa nama dan key duplikat. Tombol "Kembalikan ke bawaan"
  mengisi ulang draft tanpa langsung menghapus data tersimpan.
  10 test UI di `CategoryManager.test.tsx`.
- **Refactor signature `saveVault`/`exportBackup` yang dipertimbangkan
  lalu ditolak:** sempat mempertimbangkan mengubah kedua fungsi ini
  jadi menerima satu objek parameter (bukan terus menambah parameter
  posisional), untuk mencegah kelas bug "titik pemanggilan lupa
  diupdate" terulang lagi setelah insiden `lockedCatIds` di atas.
  Ditolak untuk sesi ini — risiko mengedit kembali 17 titik pemanggilan
  sekaligus dinilai lebih besar dari manfaatnya untuk menambah satu
  parameter lagi; dicatat sebagai kandidat kerja mendatang jika pola
  ini terus berulang.
- Sengaja TIDAK diimplementasikan: drag-and-drop reorder field. Sempat
  ditulis CSS yang menyiratkannya (`cursor: grab` pada handle icon)
  lalu diperbaiki jadi `cursor: default` murni dekoratif — UI tidak
  boleh menjanjikan interaksi yang logikanya belum ada.

**Test baru total sesi ini: 48** (10 EntryForm 2FA + 9 UI lock/unlock +
5 unit `isCategoryLocked` + 14 unit `getFieldsForCat` + 10 UI field
editor). 101→149 test, semuanya lolos.

**Verifikasi:** `tsc --noEmit` 0 error, `eslint --max-warnings 0` 0
error/warning, `vitest run` 149/149 lolos.

### v1.9.1 — Audit Penuh: Icon Kategori Hilang, Token Z-Index Tidak Terdefinisi, Integritas Dokumentasi README (2026-08-09)

**Konteks:** pengguna melaporkan lewat screenshot: (1) icon kategori
kosong/polos di semua entri vault, (2) membuka sidebar navigasi membuat
tampilan "Semua Entri" di baliknya tetap terlihat tumpang-tindih dan
sidebar sulit diklik, dan secara terpisah menegur README.md tidak
akurat soal versi proyek saat ini.

**Bug fix nyata (2 akar masalah independen, ditemukan sudah ada sejak
sebelum sesi-sesi audit sebelumnya — bukan regresi dari perubahan
Claude, tapi tanggung jawab tetap diperbaiki tuntas):**

- **Icon kategori 100% tidak terlihat di semua entri default** —
  `components/entries/CategoryIcon.tsx`: warna icon (`CAT_ICON_COLORS`)
  memakai string literal `var(--cat-sosmed)` dst untuk prop `color`
  Lucide (diteruskan ke atribut SVG `stroke`), tapi token `--cat-*`
  **tidak pernah didefinisikan** di `styles/tokens.css` maupun
  `lib/design-tokens.ts` di seluruh proyek — komentar kode lama
  menyebut sesi "F2-02" yang rupanya tidak pernah menuntaskan
  pembuatan tokennya. `stroke` yang gagal resolve membuat SVG
  ter-render tanpa warna sama sekali (kotak latar tetap tampil karena
  itu `rgba()` konkret terpisah, hanya icon-nya yang hilang).
  Diperbaiki dengan `CAT_HEX`, satu peta warna solid per kategori
  (nilai hex sama persis dengan RGB yang sudah dipakai warna latar —
  dikonfirmasi ulang, bukan warna baru) yang menjadi sumber tunggal
  untuk warna latar (alpha rendah) MAUPUN warna icon (solid),
  sehingga keduanya tidak mungkin drift lagi.
  Ditemukan bersamaan: kategori **"Catatan"** (`note` — kategori aktif
  dengan field form sendiri di `EntryForm.tsx`, bukan sisa kode mati)
  ternyata sama sekali tidak terdaftar di peta icon manapun,
  jatuh ke fallback ikon "lainnya" yang salah makna. Ditambahkan
  `StickyNote` sebagai ikonnya. Diverifikasi terprogram (bukan hitung
  manual) bahwa seluruh 9 kategori di `DEFAULT_CATEGORIES` sekarang
  tercakup penuh.
- **Sidebar tumpang-tindih dengan konten & sulit diklik** — ternyata
  gejala dari masalah yang jauh lebih luas: seluruh sistem token
  `z-index` proyek (`--z-sticky`, `--z-content`, `--z-dropdown`,
  `--z-sidebar`, `--z-modal`, `--z-toast`, `--z-top`) dipakai di **11
  file CSS berbeda** tapi **tidak satu pun pernah didefinisikan
  nilainya** — pola bug yang identik dengan kasus `--cat-*` di atas.
  `z-index` yang gagal resolve jatuh ke initial value `auto`, sehingga
  stacking order elemen-elemen ini ditentukan urutan DOM, bukan
  hierarki yang dimaksud — inilah sebabnya konten halaman utama bisa
  tampil di atas sidebar dan menerima klik lebih dulu. Ditambahkan
  `zIndex` ke `lib/design-tokens.ts` sebagai sumber kebenaran,
  di-generate ke `tokens.css` lewat `scripts/generate-tokens.ts` yang
  sudah ada. Nilai `--z-modal` (200) dan `--z-top` (9999) BUKAN angka
  baru — keduanya dikonfirmasi dari komentar sejarah eksplisit di
  `styles/components/modal.css` dan `styles/components/lock.css` yang
  menyebutkan literal lama sebelum standarisasi ke token; level
  lainnya disusun logis dari konteks pemakaian yang sudah tersirat di
  setiap selector. Sekalian ditemukan dan diperbaiki: `.sidebar` &
  `.sidebar-overlay` memakai token yang salah pilih secara semantik
  (`--z-toast`, bukan `--z-sidebar` yang namanya sudah persis cocok
  dan sudah dipakai versi mobile `.drawer-overlay` untuk komponen
  yang sama).

**Integritas dokumentasi README (teguran pengguna, dikonfirmasi
akurat):** badge "Versi saat ini" di baris 6 masih menyatakan `v1.7.0`
— tidak pernah diperbarui sejak sesi v1.8.0, dua rilis tertinggal.
Bagian "Versioning" masih menyebut nilai contoh `1.6.3` di ketiga
tempat DAN secara implisit menyuruh mengedit `public/sw.js` secara
manual — bertentangan dengan mekanisme auto-sync `prebuild` yang sudah
dibangun sejak v1.9.0; ini bukan cuma angka basi, tapi dokumentasi
yang salah secara konseptual. Bagian "Struktur Folder" tidak menyebut
`lib/design-tokens.ts` maupun folder `scripts/` sama sekali, padahal
keduanya adalah bagian inti dari sistem token proyek. Ketiganya
ditulis ulang: badge dinaikkan ke versi aktual, bagian Versioning
membedakan tempat yang harus diedit manual (`constants.ts`,
`package.json`) vs otomatis (`sw.js`, dengan catatan `package.json`
belum punya mekanisme otomatis serupa — dicatat sebagai kandidat kerja
mendatang, bukan diklaim selesai), dan Struktur Folder melengkapi
`design-tokens.ts` + `scripts/`.

**Test baru:**
- `components/entries/__tests__/CategoryIcon.test.tsx` — 12 test:
  satu per kategori default (`it.each` atas `DEFAULT_CATEGORIES`
  langsung, bukan daftar hardcode terpisah yang bisa basi lagi) yang
  memverifikasi `stroke` SVG selalu hex/rgb solid, source file bebas
  dari `var(--cat-` di kode aktif (komentar penjelas dikecualikan),
  ikon "note" spesifik memakai `StickyNote`, dan guard jumlah kategori.
- `lib/__tests__/zIndexTokens.test.ts` — 10 test: ketujuh token
  `--z-*` ada di `tokens.css` dengan nilai yang sama dengan
  `lib/design-tokens.ts`, urutan hierarki logis (sticky/content <
  dropdown < sidebar < modal < toast < top), dan `.sidebar`/
  `.sidebar-overlay` memakai token yang benar.

Total proyek naik dari 79 menjadi **101 test**, semuanya lolos. Setiap
fix divalidasi dengan sengaja mereproduksi kondisi gagalnya lebih
dulu (token lama, kategori hilang, token sidebar salah) untuk
memastikan test barunya benar-benar mendeteksi regresi, baru
dikembalikan ke keadaan benar.

**Verifikasi:** `tsc --noEmit` 0 error, `eslint --max-warnings 0` 0
error/warning, `vitest run` 101/101 lolos.

**Audit 13-kategori test (diminta eksplisit oleh pengguna) — dilaporkan
apa adanya, termasuk yang TIDAK applicable atau TIDAK ada test-nya,
bukan diklaim lolos semua:**

| # | Kategori | Hasil |
|---|---|---|
| 1 | Typecheck | ✅ 0 error |
| 2 | ESLint | ✅ 0 error/warning |
| 3 | Vitest Unit Test | ✅ 101/101 lolos, 15 file |
| 4 | Crypto/Encryption | ✅ 11/11 lolos (`lib/__tests__/crypto.test.ts`) |
| 5 | Secret-handling | ⚠️ 41 test terkait (vaultService, storage, crypto) lolos, tapi tidak ada test khusus yang memverifikasi tidak ada kebocoran plaintext secret ke log/storage |
| 6 | Integration | ❌ Tidak ada suite berlabel "integration" secara eksplisit (vaultService.test.ts bersifat integration-like tapi tidak diberi label demikian) |
| 7 | IndexedDB/Storage | ❌ Proyek tidak memakai IndexedDB sama sekali (murni `localStorage`, dikonfirmasi nihil di seluruh kode) — Storage test yang applicable (poin 5) lolos 22/22 |
| 8 | Data Integrity & Migration | ⚠️ `lib/crypto.ts` punya `decryptLegacy` untuk migrasi dari format lama (vault-private-offline), **tidak ada test sama sekali** untuk fungsi ini |
| 9 | PWA/Service Worker | ⚠️ Hanya sinkronisasi versi (`swVersion.test.ts`, 2 test) yang teruji; perilaku fetch handler/cache strategy/auto-update SW tidak punya test otomatis |
| 10 | Playwright E2E | ❌ Tidak ada `playwright.config.ts` atau file `.spec.ts` sama sekali di proyek — tidak ada E2E suite untuk dijalankan |
| 11 | Dependency + Secret Scan | ⚠️ `npm audit` menemukan 6 kerentanan nyata (4 high: undici, vite, js-yaml, brace-expansion; 2 low: @babel/core, esbuild) — semuanya di rantai dependency dev-only (vite/vitest tooling), TIDAK ada di `dependencies` produksi (next, react, zustand, framer-motion, lucide-react, pdf-lib, clsx). Tidak dijalankan `npm audit fix` tanpa persetujuan eksplisit karena berisiko mengubah versi vitest yang bisa memengaruhi 101 test yang sudah lolos. Secret scan kode sumber (regex untuk pola API key/token/password hardcode): bersih, tidak ditemukan. Tidak ada file `.env` di proyek |
| 12 | Production Build | ⚠️ `npm run build` gagal — bukan di kode, tapi di titik fetch font Google (`fonts.googleapis.com` tidak ada di allowlist jaringan sandbox). Hook `prebuild` (sinkronisasi token & versi) dikonfirmasi sukses berjalan lebih dulu sebelum kegagalan itu terjadi |
| 13 | Offline Smoke Test | ⚠️ Tidak bisa dijalankan end-to-end di browser sungguhan (bergantung pada Production Build yang gagal di poin 12). Audit statis dilakukan sebagai gantinya: (a) `sw.js` memakai pola network-first-dengan-fallback-cache untuk navigasi — pola offline-capable yang benar; (b) dikonfirmasi nihil pemanggilan `fetch`/network apa pun di `vaultService.ts`, `crypto.ts`, `storage.ts` — alur unlock-decrypt-baca vault 100% lokal; (c) `next/font/google` men-download font SEKALI saat build time lalu di-hosting sendiri sebagai asset statis (bukan fetch runtime) — kegagalan di poin 12 murni soal build-time di sandbox ini, BUKAN indikasi aplikasi akan rusak saat offline setelah build berhasil di lingkungan dengan akses internet; (d) `manifest.json` valid dan lengkap field wajib PWA |

**Kesimpulan audit:** kategori 1–4 dan sebagian besar 3 (unit test)
sungguh-sungguh solid dan terverifikasi. Kategori 5, 8, 9 punya
cakupan test parsial dengan gap yang dilaporkan jujur, bukan
disembunyikan. Kategori 6, 7, 10 tidak applicable atau tidak ada
infrastrukturnya sama sekali di proyek — bukan gagal dijalankan,
memang belum pernah dibangun. Kategori 11 dan 12 membuahkan temuan
nyata (kerentanan dependency dev-only, keterbatasan jaringan sandbox)
yang dilaporkan lengkap tanpa tindakan sepihak mengubah dependency.
Kategori 13 diganti audit statis dengan alasan eksplisit kenapa E2E
sungguhan tidak bisa dijalankan di lingkungan ini.

### v1.9.0 — Sinkronisasi Versi Satu Sumber Kebenaran + Fix Konflik Transform Toggle Password (2026-08-09)

**Konteks:** sesi terpisah dari v1.8.0 di atas — user menegaskan penomoran
versi proyek harus punya satu sumber kebenaran mutlak, dan melaporkan
rasa tidak nyaman (tanpa bisa menunjuk persis apanya) saat menekan ikon
mata show/hide password di form tambah/edit entri.

**Bug fix nyata (2 laporan independen, semua diverifikasi dengan test baru):**

- **`CACHE_VER` di `public/sw.js` tertinggal dari `APP_VERSION`:**
  ditemukan saat audit v1.8.0 (`CACHE_VER='v1.6.3'` padahal `APP_VERSION`
  sudah `'1.8.0'`), sempat sengaja tidak diubah dulu karena di luar scope
  laporan bug saat itu. Sekarang ditangani sebagai fix permanen:
  `scripts/generate-sw-version.ts` membaca `APP_VERSION` dari
  `lib/constants.ts` dan menulis ulang `CACHE_VER` secara otomatis,
  dipanggil lewat hook `"prebuild"` baru di `package.json` — setiap
  `npm run build` selalu menyinkronkan keduanya tanpa langkah manual.
  `lib/constants.ts` sekarang satu-satunya sumber kebenaran untuk versi
  di seluruh proyek — kenaikan `1.8.0 → 1.9.0` di sesi ini adalah
  pemakaian pertama mekanisme ini untuk tujuan aslinya (sebelumnya hanya
  diuji dengan drift simulasi).
- **Konflik `transform` pada tombol toggle show/hide password:** tombol
  mata (`className="form-pw-toggle btn-icon"`) punya DUA rule CSS yang
  sama-sama menulis `transform` pada elemen yang sama —
  `.form-pw-toggle { transform: translateY(-50%) }` untuk positioning
  vertikal, dan `.btn-icon:active { transform: scale(0.93) }` untuk
  press-feedback. CSS tidak menggabungkan dua `transform` dari sumber
  berbeda; nilai yang menang menimpa total. Setiap tombol ditekan,
  `translateY(-50%)` hilang sesaat, tombol meloncat posisi vertikalnya
  secara mikro (~150ms) lalu meloncat balik saat dilepas — inilah sumber
  laporan "rasanya tidak nyaman saat ditekan" yang sulit dijelaskan
  persis. Diperbaiki dengan mengganti positioning `.form-pw-toggle` dari
  `transform: translateY(-50%)` ke `margin-top: -16px` (matematis
  identik untuk elemen bertinggi tetap 32px, diverifikasi lewat
  `getComputedStyle` di `jsdom`), sehingga `transform` sepenuhnya milik
  state `:active` tanpa kemungkinan konflik properti apa pun. Sekalian
  ditambahkan `transition: transform 120ms var(--ease-spring)` eksplisit
  ke `.btn-icon:active` (sebelumnya tidak ada sama sekali, sehingga
  `scale(0.93)` muncul/hilang secara instan/patah) — perbaikan di level
  base class ini otomatis berlaku untuk semua tombol icon lain di
  proyek yang memakai `.btn-icon`, tidak cuma toggle password.

**Test baru:**
- `lib/__tests__/swVersion.test.ts` — contract test yang memverifikasi
  `CACHE_VER` di `sw.js` selalu sama dengan `APP_VERSION`, dan bahwa
  hook `prebuild` benar-benar merujuk `sw-version` (2 test).
- `lib/__tests__/pwToggleCss.test.ts` — regression test yang
  memverifikasi `.form-pw-toggle` tidak pernah mendeklarasikan
  `transform` lagi, dan `.btn-icon:active` selalu punya `transition`
  untuk `transform`-nya (3 test).

Total proyek naik dari 74 menjadi **79 test**, semuanya lolos. Kedua fix
di atas divalidasi dengan sengaja mereproduksi kondisi gagalnya lebih
dulu (drift versi, transform lama) untuk memastikan test barunya
benar-benar mendeteksi regresi, baru dikembalikan ke keadaan benar.

**Verifikasi:** `tsc --noEmit` 0 error, `eslint --max-warnings 0` 0
error/warning, `vitest run` 79/79 lolos. `npm run build` dikonfirmasi
memicu hook `prebuild` secara otomatis (diuji dengan sengaja merusak
`CACHE_VER` lalu menjalankan `npm run build` — `prebuild` memperbaikinya
sebelum `next build` sungguhan mulai). Build produksi penuh tidak bisa
diselesaikan sampai tuntas di sandbox sesi ini karena `next/font/google`
butuh akses jaringan ke `fonts.googleapis.com` yang tidak tersedia di
lingkungan tersebut — bukan berkaitan dengan perubahan di sesi ini
(`app/layout.tsx` tidak disentuh); perlu dicoba di mesin lokal atau saat
deploy ke Vercel.

### v1.8.0 — Audit UI: Konsistensi Ikon Filter, Urutan Settings, Bug Tombol "Lainnya" (2026-08-08)

**Bug fix nyata (3 laporan independen, semua diverifikasi dengan test baru):**

- **Filter chips `VaultListView`:** sebelumnya label `fav`/`locked` diberi
  emoji `★`/`🔒` hardcode di dalam string, sementara `all`/`no_pass` tidak
  punya penanda visual sama sekali — tidak konsisten. Diganti dengan
  `FILTER_META`, peta `{icon, label}` module-level (pola sama dengan
  `IMETA` di `HealthCheckPanel`) memakai ikon Lucide yang sama persis
  dengan badge favorit/terkunci di `EntryCard` (`Star`, `Lock`), ditambah
  `LayoutGrid` untuk "Semua" dan `ShieldOff` untuk "Tanpa Pass". Semua 4
  chip sekarang konsisten.
- **Urutan section `SettingsView`:** "Info Vault" sebelumnya dirender
  sebelum "Kesehatan Password". Ditukar — Info Vault sekarang section
  paling bawah, sesuai maksud halaman (ringkasan vault sebagai penutup).
  `openSections` initial state dirapikan urutannya agar sinkron dengan
  urutan render.
- **Tombol "+N masalah lainnya" `HealthCheckPanel`:** root cause — elemen
  ini sebelumnya `<p>` statis tanpa `onClick` atau state apa pun; klik
  tidak melakukan apa-apa sama sekali (fitur belum pernah
  diimplementasikan, bukan regresi). Ditambahkan state `expanded`,
  diganti jadi `<button aria-expanded>` yang toggle antara 6 item
  (`VISIBLE_ISSUES_LIMIT`) dan daftar lengkap, dengan label berubah jadi
  "Tampilkan lebih sedikit" + chevron rotate saat terbuka. `key` daftar
  masalah diganti dari index array (`key={i}`) menjadi
  `${issue.entryId}-${issue.type}-${i}` karena panjang list kini dinamis.

**Test baru:** `components/settings/__tests__/HealthCheckPanel.test.tsx`
— file test React pertama untuk komponen ini (5 test: batas 6 item
default, expand ke semua item, collapse kembali, tombol tidak muncul
saat masalah ≤6, `aria-expanded` mencerminkan state). Total proyek naik
dari 69 menjadi 74 test, semuanya lolos.

**Ditemukan saat audit, ditangani di v1.9.0 (lihat entri di atas):**
`public/sw.js` — `CACHE_VER` masih `'v1.6.3'`, tertinggal dari
`APP_VERSION`. Sengaja tidak diubah di sesi v1.8.0 karena di luar scope
laporan bug saat itu dan menaikkan `CACHE_VER` memaksa cache-busting
penuh untuk semua pengguna — dampaknya lebih besar dari sekadar
penomoran, jadi diperlakukan sebagai keputusan sadar terpisah.

**Verifikasi:** `tsc --noEmit` 0 error, `eslint --max-warnings 0` 0
error/warning, `vitest run` 74/74 lolos. `next build` tidak bisa
dijalankan sampai selesai di sandbox sesi ini karena `next/font/google`
butuh akses jaringan ke `fonts.googleapis.com` yang tidak tersedia di
lingkungan tersebut — bukan berkaitan dengan perubahan di sesi ini
(`app/layout.tsx` tidak disentuh).

### v1.7.0 — Audit Penuh: 6 Bug Terverifikasi + Integritas Dokumentasi + Next.js 16.3.0 (2026-08-07)

**Catatan penomoran versi:** sesi ini awalnya dirilis sebagai draft
`v1.6.4`, mengikuti kontinuitas rantai hotfix `v1.6.x` yang sudah ada.
Dikoreksi ke `v1.7.0` karena konvensi versioning proyek ini sendiri
(lihat `lib/constants.ts`) mendefinisikan MINOR sebagai "multi-bug fix"
— sesi ini mencakup 6 bug fix independen, bukan satu hotfix spesifik
(PATCH). Aturan diikuti secara ketat, bukan sekadar kontinuitas nomor.

**Latar belakang:** audit menyeluruh atas seluruh codebase (bukan hotfix reaktif atas satu laporan bug seperti versi-versi sebelumnya). Setiap temuan di bawah dibuktikan lewat eksekusi nyata (test terisolasi) sebelum diperbaiki — beberapa dugaan awal audit ternyata *bukan* bug setelah diverifikasi (lihat catatan di masing-masing bagian) dan tidak diubah.

**🔴 Kritis 1 — Rate-limiting PIN bisa di-bypass total lewat refresh halaman:**
- Root cause: `pinAttempts` dan `pinLockedUntil` hanya tersimpan di Zustand
  store (in-memory) — tidak pernah ditulis ke localStorage, tidak seperti
  `autoLockMinutes`/`customCats`/dll di store yang sama yang memang dibaca
  dari localStorage saat inisialisasi
- Dampak: reload halaman atau PWA tab di-kill OS lalu dibuka lagi
  menghapus counter percobaan dan waktu lockout tanpa jejak — lockout
  5-menit-setelah-5x-salah bisa dilewati semata-mata dengan refresh
- Fix: `LS_PIN_ATTEMPTS`/`LS_PIN_LOCKED_UNTIL` baru di `lib/storage.ts`,
  dibaca saat inisialisasi store (pola sama seperti field lain),
  ditulis di setiap perubahan (`incrementPinAttempts`, `setPinLocked`,
  `resetPinAttempts`, `unlock`), dibersihkan saat `clearAllVaultData`
- Diverifikasi via test: `lib/__tests__/appStore.test.ts` — termasuk
  simulasi reload sungguhan (re-evaluasi modul store dari localStorage,
  bukan sekadar assert nilai di memori)
- **Catatan:** proteksi hash PIN (`sha256` polos tanpa iterasi, dipakai
  sebagai quick-reject sebelum dekripsi PBKDF2 mahal) secara teoretis
  tetap melemahkan proteksi PBKDF2 di skenario *offline* (attacker punya
  salinan localStorage device). Ini keputusan desain yang ada sejak awal,
  bukan regresi, dan TIDAK diubah di sesi ini — didiskusikan tapi
  disepakati bukan prioritas mengingat auto-lock `never` dan PIN
  dipakai sekali saat login, master password sebagai lapisan keamanan
  utama.

**🔴 Kritis 2 — Auto-reload paksa 3 detik saat deploy versi baru:**
- Root cause: service worker `skipWaiting()` tanpa syarat saat instal,
  klien auto-reload 3 detik tanpa opsi tunda maupun pengecekan apakah
  user sedang mengisi form
- Dampak: deploy yang terjadi saat user mengisi form panjang (mis. seed
  phrase) berisiko membuat input yang belum tersimpan hilang
- Fix: `AppShell.tsx` sekarang mengecek `document.activeElement` (input/
  textarea/contenteditable) — auto-reload ditunda kalau user sedang
  mengetik; tombol "Perbarui sekarang" eksplisit selalu tersedia di
  notifikasi, menggantikan reload buta

**🟡 Sedang 3 — Focus-steal di BackupModal saat mengetik:**
- Root cause: `AutoLockManager` memasang listener `keydown` global yang
  update `lastActivityAt` di Zustand di setiap keystroke → `AppShell`/
  `SettingsView` re-render → prop `onClose` yang diteruskan ke
  `BackupModal` jadi closure baru tiap render → `useFocusTrap`'s
  `useEffect` (dependency lama: `[active, onEscape]`) re-run efeknya →
  `firstFocusable?.focus()` merebut fokus dari textarea sync manual
- Fix berlapis: (1) `onEscape` dipindah ke `useRef` di dalam
  `lib/hooks/useFocusTrap.ts` sendiri — efek utama kini hanya bergantung
  pada `active`, jadi hook ini kebal terhadap referensi tidak stabil
  dari pemanggil manapun (perbaikan struktural, bukan cuma di titik
  pemanggilan); (2) `useCallback` ditambahkan di 3 pemanggil
  (`AppShell.tsx`, `SettingsView.tsx`, `BackupReminderModal.tsx`)
  sebagai defense-in-depth
- Diverifikasi via test: `lib/hooks/__tests__/useFocusTrap.test.tsx` —
  membuktikan fokus tidak direbut saat `onEscape` berubah referensi
  tapi `active` tetap sama, sambil memverifikasi fokus-trap awal dan
  `onEscape` (versi terbaru) tetap berfungsi normal

**🟡 Sedang 4 — `handleEmptyBin` di VaultListView.tsx: catch kosong total:**
- Root cause: `catch {}` benar-benar kosong (tanpa rollback, tanpa
  toast error), dan toast sukses ("Sampah dikosongkan") selalu tampil
  di luar try/catch, terlepas dari hasil `saveVault` yang sebenarnya
- **Catatan integritas dokumentasi:** entri changelog v1.6.0 sebelumnya
  mengklaim alur ini "kini menampilkan toast error saat rollback
  terjadi" — klaim itu tidak sesuai kode yang ada di ZIP v1.6.3.
  Kemungkinan regresi di iterasi berikutnya atau disconnect ZIP vs
  commit GitHub (pola serupa catatan lama soal v1.4.6–v1.5.1 yang
  "exist in ZIP output only"). GitHub repo:
  13angganh/vault-next (dikonfirmasi oleh pemilik proyek — sempat
  salah dicatat sebagai karangsengon-03/vault-next di sesi audit ini,
  dikoreksi).
- Fix: `prevRecycleBin` disimpan sebelum diubah; `catch` sekarang
  rollback ke nilai itu dan menampilkan toast error; toast sukses
  hanya tampil kalau memang berhasil (atau autoSave memang nonaktif)
- Diverifikasi via test: **file test komponen React pertama di
  proyek ini**, `components/vault/__tests__/VaultListView.test.tsx` —
  membuktikan rollback+toast error saat `saveVault` gagal (localStorage
  penuh disimulasikan), dan toast sukses saat berhasil
- Efek samping: menemukan `@testing-library/jest-dom` sudah jadi
  dependency tapi `setupFiles: []` di `vitest.config.ts` kosong —
  matcher seperti `toBeInTheDocument()` tidak pernah aktif. Diperbaiki
  (`vitest.setup.ts` baru) — berlaku untuk seluruh test suite ke depan.

**🟡 Sedang 5 — `addCustomCat` melempar exception tak tertangkap:**
- Root cause: `addCustomCat(newCat)` dipanggil telanjang di
  `CategoryManager.tsx` `handleSave`, di luar try/catch manapun — kalau
  `lsSetJson` gagal (localStorage penuh), exception lolos sebagai
  uncaught error di `onClick` handler React
- **Catatan koreksi analisis:** dugaan awal audit bahwa "state memori
  jadi tidak sinkron dengan disk" TIDAK akurat — `set()` Zustand di
  ketiga action kategori (`addCustomCat`/`removeCustomCat`/
  `setCustomCats`) hanya tercapai *setelah* `lsSetJson` sukses, jadi
  urutan yang sudah ada sejak awal sudah mencegah state korup. Yang
  benar-benar diperbaiki murni exception yang tidak tertangkap.
- Fix: try/catch dengan logging ditambahkan di ketiga action di
  `lib/store/appStore.ts` (re-throw setelah logging — perilaku
  pemanggil yang sudah benar seperti `CategoryManager.tsx` tidak
  berubah, cuma jejak diagnostiknya); `handleSave` di
  `CategoryManager.tsx` sekarang membungkus panggilan `addCustomCat`
  dalam try/catch dan menampilkan toast error
- Diverifikasi via test: 3 test baru di `appStore.test.ts` (throw +
  state tidak berubah untuk ketiga action), 1 test komponen baru di
  `components/settings/__tests__/CategoryManager.test.tsx`

**🟡 Sedang 6 — Double-submit PIN via race Enter vs auto-submit:**
- Root cause: auto-submit (`setTimeout(onSubmit, 80)` setelah digit
  ke-`maxLen`) dan Enter key handler bisa sama-sama memicu `onSubmit`
  untuk PIN yang sama, kalau user menekan Enter dalam window 80ms itu
  — di `LockScreen.tsx`, satu kesalahan PIN akhirnya dihitung sebagai
  dua percobaan lewat `incrementPinAttempts`, mempercepat lockout
  secara tidak adil
- Fix: guard idempotency (`submittedForValue` ref + `submitOnce`) di
  `PINPad.tsx` — hanya panggilan pertama untuk setiap pengisian PIN
  yang lolos ke `onSubmit`; guard direset otomatis saat `value.length`
  turun dari `maxLen` (user mulai mengisi ulang), supaya PIN identik
  di percobaan berikutnya tetap bisa disubmit, bukan terblokir permanen
- Diverifikasi via test: `components/lock/__tests__/PINPad.test.tsx` —
  race Enter+auto-submit hanya sekali panggil, auto-submit normal tetap
  jalan, PIN identik di percobaan berikutnya tetap bisa submit, dan
  mengisi-ulang-sebelum-auto-submit-selesai membatalkan submit lama

**🟢 Integritas Dokumentasi — klaim test yang tidak pernah didukung file test nyata:**
- Audit menemukan **0 file `.test.tsx`** di seluruh proyek pada titik
  ini, meski changelog v1.6.2 dan v1.6.3 (lihat di bawah) mengklaim
  fix masking password "diverifikasi via test isolasi, elemen DOM node
  identik (`toBe`, bukan `toEqual`)" dan sejenisnya
- Reasoning teknis fix-fix itu sendiri tetap valid (dikonfirmasi ulang
  lewat MDN dan React docs) — yang tidak berdasar murni klaim
  verifikasinya
- Ditutup dengan bukti nyata, bukan sekadar koreksi teks:
  `components/entries/__tests__/EntryForm.test.tsx` (5 test) membuktikan
  persis klaim yang dulu tidak berdasar — identitas DOM node via `toBe`,
  `type` selalu `'text'`, className masking sesuai state, fokus & value
  bertahan lewat toggle (termasuk simulasi urutan `mousedown` sebelum
  `click` seperti browser sungguhan, memverifikasi fix `preventDefault`
  v1.6.3)
- Dua klaim serupa lain (soal `key` dinamis memicu remount, dan
  pendekatan custom-masking yang dibatalkan) diberi catatan integritas
  di tempatnya masing-masing — tidak ditutup test baru karena kodenya
  sendiri sudah tidak ada di codebase saat ini (dihapus di v1.6.3 atau
  memang tidak pernah di-commit)
- **Ditutup di sesi lanjutan (masih v1.7.0):** klaim serupa "diverifikasi
  dengan test yang men-spy `PDFPage.drawText`" untuk `lib/exportPdf.ts`
  — awalnya dicatat sebagai "belum ditutup, di luar cakupan sesi ini",
  lalu diperbaiki menyusul permintaan eksplisit. `lib/__tests__/exportPdf.test.ts`
  (4 test baru) membuktikan klaim itu: karakter `⚠`/`★` tidak pernah
  dikirim ke `drawText`, seed phrase 24 kata dan wallet address panjang
  tertulis utuh tanpa elipsis truncation. Setiap assertion divalidasi
  lewat mutation check manual sebelum dianggap final — termasuk
  menemukan dan memperbaiki data uji wallet address yang semula terlalu
  pendek (74 karakter) untuk benar-benar memicu ambang truncation lama
  (90 karakter), yang berarti test versi pertama lulus karena kebetulan,
  bukan karena benar-benar menguji fix-nya.

**⚙️ Upgrade Next.js 16.2.4 → 16.3.0:**
- Rilis resmi 2026-08-03. Peningkatan inti (memori dev, kecepatan build,
  throughput SSR) zero perubahan kode; fitur besar (Instant Navigations,
  Cache Components) opt-in via flag, tidak diaktifkan di sesi ini
- Dipertimbangkan juga: security patch terpisah di 16.2.6 (2026-05-07,
  7 CVE High severity — DoS Server Components, middleware/proxy bypass,
  dll). Dinilai exposure minimal untuk proyek ini karena arsitekturnya
  100% client-rendered (tidak ada `'use server'`, Route Handler, atau
  `middleware.ts` di kode aplikasi) — tapi upgrade ke 16.3.0 sekaligus
  membawa proyek ini melewati batas versi aman itu juga
- `react`/`react-dom` **tidak perlu diubah** — dikonfirmasi langsung dari
  `npm view next@16.3.0 peerDependencies`: range mencakup `^19.0.0`,
  `19.2.4` yang terpasang sudah kompatibel
- `eslint-config-next` dinaikkan bersamaan ke `^16.3.0`
- Diverifikasi: `npm install` tanpa peer-dependency warning, typecheck
  bersih, lint bersih, 65/65 test lulus, production build sehat
  struktural (`next build` menghasilkan output identik — kegagalan
  build di lingkungan audit murni network-restricted terhadap Google
  Fonts, tervalidasi dengan bypass sementara lalu dikembalikan)

**Ringkasan verifikasi akhir sesi:** typecheck 0 error, lint 0 warning,
69/69 test lulus di 10 file (naik dari 41 test di 3 file sebelum sesi
ini — 7 file test baru: 4 file test komponen React pertama di proyek
ini (`VaultListView`, `CategoryManager`, `PINPad`, `EntryForm`), 1 file
test hook (`useFocusTrap`), dan 2 file test unit/lib
(`appStore`, `exportPdf`).

---

### v1.6.3 — Hotfix: Efek Samping dari Fix v1.6.2 (Fokus Hilang & Animasi Tak Diinginkan) (2026-07-25)

**Hotfix: toggle mata kadang tidak merespons saat sedang mengetik + animasi "turun keluar kotak" tak diinginkan setiap toggle:**
- Root cause: `key` dinamis yang ditambahkan di v1.6.2 sebagai lapisan
  pengaman tambahan (dijaga-jaga, bukan berdasarkan bukti nyata bahwa
  itu diperlukan) memaksa React unmount+mount ulang elemen `<input>`
  sepenuhnya setiap toggle — bukan sekadar update `className` di
  elemen yang sama
- Efek samping 1 (fokus tidak konsisten): remount di tengah elemen
  sedang fokus (saat pengguna mengetik) membuat fokus hilang lalu
  browser harus memutuskan ulang siapa yang fokus — race dengan
  keyboard virtual Android menghasilkan gejala "kadang bisa kadang
  tidak" tepat seperti dilaporkan
- Efek samping 2 (animasi tak diinginkan): remount elemen memicu efek
  visual seolah elemen baru "muncul" — terlihat seperti kotak bergerak
  turun keluar container, kemungkinan terkait auto-scroll browser
  Android saat elemen fokus di-recreate ketika keyboard virtual aktif
- Fix: `key` dinamis DIHAPUS sepenuhnya. Ternyata tidak lagi diperlukan
  — root cause asli (konflik `type=password` dengan CSS masking, fix
  v1.6.2) sudah teratasi murni lewat `type` yang selalu `'text'`;
  perubahan `className` pada elemen yang sama sudah cukup untuk browser
  menerapkan ulang CSS tanpa perlu remount sama sekali
- Tambahan: tombol toggle mata (`form-pw-toggle`) diberi
  `onMouseDown={(e) => e.preventDefault()}` — mencegah button mengambil
  alih fokus dari input saat ditekan (mousedown pada button biasanya
  blur input dulu sebelum onClick jalan), memastikan fokus tetap di
  input sepanjang toggle terjadi, bukan cuma karena elemen tidak lagi
  di-remount
- Diverifikasi via test: elemen DOM node input terbukti identik
  (`toBe`, bukan `toEqual`) sebelum dan sesudah toggle — konfirmasi
  tidak ada remount; fokus dan value yang sedang diketik terbukti tidak
  terganggu oleh toggle. **[Catatan integritas dokumentasi, v1.7.0]**:
  klaim ini ditulis di sini sebelum ada test aktual yang membuktikannya —
  audit penuh (Agu 2026) menemukan proyek ini 0 file `.test.tsx` di titik
  itu. Sudah diperbaiki: lihat
  `components/entries/__tests__/EntryForm.test.tsx`, yang membuktikan
  persis klaim di atas (identitas DOM node, `type` selalu `'text'`,
  fokus & value bertahan lewat toggle).

### v1.6.2 — Hotfix Lanjutan: Root Cause Sesungguhnya dari Bug Masking Password (2026-07-25)

**Hotfix: fix v1.6.1 (CSS `-webkit-text-security`) masih gagal — field selalu tampak ter-mask apa pun state toggle-nya:**
- Dikonfirmasi dari laporan pengguna dengan 6 screenshot: baik saat ikon
  mata terbuka maupun tertutup, titik-titik password di form Edit Entri
  tetap tampil identik — CSS masking v1.6.1 tidak pernah "lepas"
- Root cause sesungguhnya (dikonfirmasi via dokumentasi resmi MDN):
  `-webkit-text-security` secara eksplisit **"only affects fields that
  are not of type=password"**. Kode v1.6.1 masih men-set
  `type="password"` saat state tersembunyi (`isPw && !isFieldVisible`),
  sehingga browser berhak mengabaikan CSS masking sepenuhnya dan
  mengandalkan masking native `type=password` — yang kemungkinan tidak
  konsisten ter-refresh saat `type` berganti ke `text` di state
  terlihat, persis pola bug yang sudah dua kali muncul di v1.6.0
- Fix: `type` sekarang **SELALU** `'text'` untuk field password, tidak
  pernah `'password'` lagi — menghilangkan total kondisi di mana browser
  boleh mengabaikan CSS masking. Masking 100% dikendalikan class
  `form-pw-input--masked`, tanpa ambiguitas dengan atribut `type`.
  `key` dinamis (dihapus di v1.6.1 karena dikira tidak perlu) dikembalikan
  untuk memaksa remount elemen saat toggle, sebagai lapisan tambahan
  terhadap kemungkinan sisa rendering font yang tidak ter-refresh
- Diverifikasi via test: `type` konsisten `'text'` sepanjang toggle,
  class masking toggle benar sesuai state, value input tidak pernah
  dimanipulasi (tidak ada risiko korupsi data). **[v1.7.0]**: sama
  seperti catatan di v1.6.3 di atas — klaim ini juga baru benar-benar
  ditutup test di `EntryForm.test.tsx` (test "type atribut SELALU text"
  dan "masking dikendalikan className") pada saat perbaikan v1.7.0,
  bukan saat entri changelog ini ditulis.
- **Catatan jujur:** verifikasi di atas mencakup struktur DOM dan logika
  React saja. Rendering visual CSS di Chrome Android sungguhan TIDAK
  bisa diverifikasi langsung dari environment pengembangan ini (tidak
  ada akses browser bergrafis). Fix ini didasarkan pada root cause yang
  terdokumentasi resmi di MDN, bukan hasil observasi visual langsung —
  mohon konfirmasi di device setelah update sebelum dianggap final

### v1.6.1 — Hotfix: Masking Password di EntryForm & Kejelasan Ikon Salin (2026-07-25)

**Hotfix: fix toggle password v1.6.0 ternyata tidak menyelesaikan akar masalah:**
- v1.6.0 menambah `key` dinamis pada `<input>` untuk memaksa React remount
  saat toggle visibility, dengan asumsi akar masalah ada di reconciliation
  React. Diverifikasi dengan test terisolasi: asumsi ini BENAR secara React
  internals (key dinamis pada elemen tunggal di luar `.map()` memang
  memicu remount di React 19) — tapi ternyata bukan itu akar masalahnya.
  **[Catatan integritas dokumentasi, v1.7.0]**: seperti entri v1.6.2/v1.6.3
  di atas, "test terisolasi" ini juga tidak pernah benar-benar ada sebagai
  file `.test.tsx` di proyek ini pada saat itu. Klaimnya sendiri (key
  dinamis memicu remount di React) adalah perilaku React yang terdokumentasi
  resmi, jadi kemungkinan tetap akurat — tapi tidak lagi relevan untuk
  ditutup test permanen sekarang karena kode `key` dinamis yang dimaksud
  sudah dihapus total di fix v1.6.3; tidak ada apa pun di codebase saat
  ini yang perlu diproteksi test untuk klaim ini.
- Root cause sesungguhnya: perbandingan "EntryCard selalu benar vs
  EntryForm selalu salah" keliru sejak awal — `EntryCard.tsx` (mode
  expand entri) sama sekali tidak memakai `<input type="password">`,
  hanya teks statis (`'••••••••'` vs `value`) yang diganti kondisional.
  Jadi `EntryCard` "selalu benar" bukan bukti masalahnya ada di React —
  itu murni karena tidak pernah menyentuh masking browser sama sekali.
  Masalah sesungguhnya: sebagian Chrome Android tidak konsisten
  me-refresh visual masking titik-titik saat atribut `type` sebuah
  `<input>` berubah, bahkan setelah remount elemen
- Sempat dicoba: custom masking dengan diff logic (memisahkan value asli
  dari presentation value ter-mask). DIBATALKAN setelah test membuktikan
  pendekatan ini bisa merusak data pengguna pada kasus select-and-replace
  (mis. select semua lalu ketik ulang) — risiko tidak sepadan untuk
  aplikasi password manager. **[Catatan integritas dokumentasi, v1.7.0]**:
  "test" di sini juga tidak pernah ada sebagai file nyata. Berbeda dari
  entri lain di atas, klaim ini TIDAK bisa dan tidak perlu ditutup test
  permanen sekarang — pendekatan yang diklaim gagal ini sengaja tidak
  pernah masuk ke codebase final (dibatalkan sebelum commit), jadi tidak
  ada kode yang bisa diuji. Dicatat di sini murni demi kejujuran riwayat,
  bukan sesuatu yang diperbaiki.
- Fix final: CSS `-webkit-text-security: disc` (`.form-pw-input--masked`
  di `entries.css`) — masking murni visual di level CSS, sepenuhnya
  independen dari bagaimana browser menangani perubahan atribut `type`.
  Value `<input>` tidak pernah dimanipulasi, dikontrol React 100% seperti
  biasa. `type` HTML tetap dipertahankan sebagai fallback semantik untuk
  browser yang tidak dukung properti ini (mis. Firefox Android); `key`
  dinamis dari v1.6.0 dihapus karena tidak lagi diperlukan
- Didukung Chrome Android sejak versi 18 (2012) — diverifikasi via data
  caniuse; CSS akhir dikonfirmasi sampai utuh ke output build (bukan
  dibuang oleh Turbopack)

**Fix: ikon Key pada quick-copy password (EntryCard collapsed) tidak jelas maknanya:**
- Bukan bug fungsional — `Key` memang representasi field password
  (berpasangan dengan `User` untuk username), menekannya memang
  menyalin password sesuai desain awal (lihat changelog v1.5.0)
- Masalahnya murni tidak ada indikasi visual "salin" yang terlihat mata
  biasa — sebelumnya hanya ada `aria-label` (screen reader only)
- Fix: tambah `title="Salin Password"` / `title="Salin Username"` pada
  kedua tombol quick-copy (`EntryCard.tsx`) — tooltip native browser
  yang terlihat saat tap-tahan/hover

### v1.6.0 — Fix Toggle Password, Crash Backup/PDF, & Health Check Tidak Lengkap (2026-07-25)

**Bug fix: toggle visibility password di EntryForm tidak sinkron dengan tampilan:**
- Root cause: `<input type>` diganti di elemen DOM yang sama saat toggle Eye/EyeOff,
  tapi beberapa browser mobile (Chromium Android) tidak selalu me-refresh
  masking titik-titik saat atribut `type` diganti tanpa remount elemen
- Fix: tambah `key` dinamis (`${id}-${isFieldVisible ? 'text' : 'password'}`)
  di `renderField()` `EntryForm.tsx` — paksa React remount `<input>` saat toggle

**Bug fix: potensi crash "Maximum call stack size exceeded" saat vault membesar:**
- Root cause: `bufToB64()` di `lib/crypto.ts` memakai
  `String.fromCharCode(...new Uint8Array(buf))` — spread argumen ke fungsi
  punya batas jumlah elemen di JS engine; ciphertext vault (seluruh entri
  dienkripsi jadi satu buffer) makin besar seiring bertambahnya entri/catatan
  panjang/seed phrase, dan bisa melewati batas itu
- Fix: `bufToB64` diubah ke loop chunked (32KB per chunk) — hasil base64
  akhir **identik byte-per-byte** dengan versi lama, jadi ini BUKAN
  perubahan format data dan tidak butuh migrasi (lihat `lib/crypto.ts`
  FROZEN di bawah — `b64ToBuf`/dekripsi tidak disentuh sama sekali)
- Pola sama juga diperbaiki di `LockScreen.tsx` dan `BiometricHintModal.tsx`
  (2 lokasi: `xorObfuscate` dan `bufToB64` lokal) untuk konsistensi

**Bug fix: kegagalan simpan (localStorage penuh) diam-diam ditelan, UI berbohong soal status tersimpan:**
- Root cause: `lsSet()` di `lib/storage.ts` hanya `console.warn` saat
  `localStorage.setItem` gagal (mis. `QuotaExceededError`), sementara
  caller (`EntryForm`, `CategoryManager`) sudah mengubah state in-memory
  SEBELUM tahu hasil penyimpanan — jika gagal, perubahan terlihat sukses
  di UI tapi hilang begitu app di-reload
- Fix: `lsSet` sekarang melempar error deskriptif saat gagal
- `EntryForm.tsx`: `doSave` menyimpan vault sebelumnya, rollback
  `store.setVault(prevVault)` + tampilkan pesan error (`saveError` state,
  pola `form-error` yang sudah ada) saat `saveVault` gagal — form tidak
  lagi tertutup seolah berhasil
- `CategoryManager.tsx`: tambah/edit/hapus kategori kini rollback
  `setCustomCats(prevCats)` + toast error (`useToast`, sebelumnya belum
  dipakai di komponen ini) saat gagal simpan; transisi ke list ditunda
  sampai hasil simpan diketahui
- `VaultListView.tsx`: `handleEmptyBin` dan unlock-entry flow kini
  menampilkan toast error saat rollback terjadi (sebelumnya rollback
  senyap tanpa pemberitahuan ke pengguna)

**Bug fix: fitur Export PDF (`lib/exportPdf.ts`) crash total:**
- Root cause: karakter `⚠` (cover page, selalu ditulis di setiap export)
  dan `★` (penanda entri favorit) tidak bisa di-encode oleh
  `StandardFonts` WinAnsi encoding milik `pdf-lib` — diverifikasi crash
  konsisten di Node.js murni dengan versi `pdf-lib` yang dipakai project
- Fix: `⚠` → `!`, `★` → `[FAV]` — teks ASCII aman, makna tetap sama
- Root cause kedua: nilai field >90 karakter (`slice(0,90)+'…'`) dipotong
  diam-diam sebelum ditulis — seed phrase 24 kata (`join(' ')` biasa
  >150 karakter), wallet address, dan password panjang bisa kehilangan
  sebagian data di backup PDF tanpa peringatan apa pun
- Fix: value panjang di-wrap ke beberapa baris berdasarkan lebar teks
  sesungguhnya (`font.widthOfTextAtSize`), bukan dipotong — field mono
  (password/kunci) di-wrap per-karakter, field lain per-kata
- Diverifikasi dengan test yang men-spy `PDFPage.drawText`: seed phrase
  24 kata dan wallet address panjang tertulis lengkap tanpa `…`.
  **[Catatan integritas dokumentasi, v1.7.0]**: seperti entri masking
  password di atas, klaim ini juga baru benar-benar ditutup test nyata
  pada v1.7.0 — lihat `lib/__tests__/exportPdf.test.ts` (4 test:
  karakter `⚠`/`★` tidak pernah dikirim ke `drawText`, seed phrase 24
  kata dan wallet address 98-karakter tertulis utuh tanpa elipsis).
  Setiap assertion divalidasi lewat mutation check manual (simulasi
  perilaku truncation lama di luar suite, bukan hanya percaya karena
  lulus di percobaan pertama) untuk memastikan test benar-benar gagal
  terhadap kode lama, bukan lulus karena kebetulan data uji terlalu
  pendek untuk memicu bug yang dimaksud.

**Bug fix: Health Check (Settings → Kesehatan Password) tidak mengecek semua field password:**
- Root cause: `lib/healthCheck.ts` pengecekan duplikat & lemah hanya
  membaca `e.pass` — password Wi-Fi (`wifiPass`) dan Password Wallet
  kripto (`walletPw`) tidak pernah dicek kekuatan atau duplikatnya
  meski keduanya field password sungguhan (`sensitive: true` di
  `EntryForm.tsx`)
- Fix: tambah helper `getEffectivePassword(e)` yang membaca `pass ||
  wifiPass || walletPw`, dipakai konsisten di pengecekan duplikat dan
  lemah; `walletPw` juga ditambahkan ke kondisi `no_password`
  (`cardNo` sengaja tidak disentuh — itu identitas kartu, bukan
  password, jadi tetap mengikuti perilaku lama)



**Tambah opsi sort Per Kategori:**
- Opsi baru `Per Kategori` di dropdown sort
- Entri dikelompokkan dengan sub-header nama kategori di antara grup
  (contoh: BANK → [entri bank], CRYPTO → [entri crypto], dst)
- Sub-header styling: uppercase, muted, letter-spacing — subtle dan bersih
- Sort sekunder dalam grup: alphabetical by name

**Fix icon sort:**
- `ArrowUpDown` (ikon swap/switch akun) → `SortAsc` (ikon sort yang benar)
- `SortAsc` dari Lucide secara universal dikenali sebagai ikon pengurutan

### v1.5.0 — 6 Fitur Baru + Fix Chevron + Fix Ripple (2026-06-29)

**Fix dari v1.4.6:**
- Chevron settings bergetar: `motion.span` → `<span>` dengan CSS `transition: transform`
  murni — tidak ada konflik antara Framer Motion dan React re-render saat klik
- Ripple kuning sidebar: `rgba(240,165,0,0.22)` → `rgba(255,255,255,0.10)` netral

**1. Quick copy di card collapsed:**
- 2 tombol kecil (User icon, Key icon) di kanan card header
- Copy username atau password langsung tanpa expand card
- Feedback visual 1.5 detik: ikon berganti ke Check + warna teal
- Hanya tampil saat card collapsed, tidak terkunci, tidak di recycle bin

**2. Password health check (Settings → Kesehatan Password):**
- `lib/healthCheck.ts`: scan duplikat password, password lemah (<8 karakter
  atau terlalu umum), entri tanpa password, entri tua (>1 tahun tidak diupdate)
- `HealthCheckPanel`: score ring 0–100 dengan warna teal/gold/red
- Summary pills per kategori masalah
- Issue list top 6 dengan detail masalah per entri

**3. Sort & filter vault:**
- Dropdown sort di header dengan 7 opsi: Default, Favorit dulu, Nama A–Z,
  Nama Z–A, Terbaru, Terlama, Per Kategori
- Filter chips 4 opsi: Semua, Favorit, Terkunci, Tanpa Password
- `SortType` disimpan di appStore (persistent selama sesi)

**4. Kosongkan sampah massal:**
- Tombol "Kosongkan" di header saat view Recycle Bin dan ada isi
- ConfirmDialog menampilkan jumlah entri yang akan dihapus permanen
- `saveVault` dipanggil setelah berhasil hapus

**5. Catatan khusus (kategori Note):**
- Kategori baru `note` di `DEFAULT_CATEGORIES`
- Fields: Isi Catatan (textarea panjang) + Referensi/URL
- Tersedia di category picker form tambah/edit entri

**6. Export PDF:**
- `lib/exportPdf.ts` via `pdf-lib` — sepenuhnya client-side, 100% offline
- Cover page gelap dengan info export dan warning SENSITIF
- Halaman entri: dikelompokkan per kategori, field sesuai tipe entri
- Watermark CONFIDENTIAL diagonal di setiap halaman
- Tombol "Export PDF" di BackupModal di bawah tombol Export .vault
- Catatan: `pdf-lib` tidak support password encryption di browser —
  perlindungan melalui: (1) hanya bisa di-generate saat vault terbuka
  (sudah terautentikasi), (2) watermark CONFIDENTIAL di setiap halaman

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
