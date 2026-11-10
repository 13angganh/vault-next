# 🔐 Aurum Vault

**PWA pengelola kata sandi offline** berbasis Next.js (App Router), TypeScript strict, Zustand, dan enkripsi AES-256-GCM.
Nama lama: Vault Next (repo GitHub tetap `vault-next`).

> **Versi saat ini:** v2.0.0 (redesain total, merek Aurum Vault)  
> **Repo:** https://github.com/13angganh/vault-next  
> **Deploy:** Vercel (auto-deploy dari GitHub push)  
> **Riwayat perubahan:** [CHANGELOG.md](CHANGELOG.md)

---

## Apa yang baru di v2.0.0

Redesain total (merek, bahasa visual, navigasi, login, pemilih logo) **tanpa mengubah data pengguna**: backup,
kripto, dan kunci penyimpanan v1.11.0 tetap berfungsi tanpa migrasi. Ringkasan dan daftar lengkap ada di
[CHANGELOG.md](CHANGELOG.md).

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
| Test | Vitest + Testing Library (jsdom) |
| Lint | ESLint 9 (flat config) + TypeScript-ESLint, `--max-warnings 0` |
| Deploy | Vercel |
| Storage | localStorage (terenkripsi) — 100% offline, tanpa server |

---

## Menjalankan Proyek

```bash
npm install        # atau npm ci (memakai package-lock.json apa adanya)
npm run dev        # development server → http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint (0 warning = lolos)
npm test           # vitest run (1077 test, 54 file)
npm run build      # production build (lihat peringatan di bawah)
```

> ⚠️ `npm run build` menjalankan hook `prebuild` yang **menulis ulang** `styles/tokens.css` (dari
> `lib/design-tokens.ts`) dan `public/sw.js` (versi cache dari `APP_VERSION`). Itu disengaja. Jangan menjalankan
> build di pohon kerja bila ingin `public/sw.js` dan `styles/tokens.css` tetap persis seperti yang di-commit.
>
> **Font Google:** `app/layout.tsx` memuat Inter dan JetBrains Mono lewat `next/font/google`, yang mengunduh font
> saat build. Di Vercel/jaringan normal ini berjalan. Di sandbox/jaringan yang memblokir `fonts.googleapis.com`
> build **gagal** di langkah font (bukan bug aplikasi): untuk menguji build di lingkungan seperti itu, bangun
> di SALINAN pohon yang `app/layout.tsx`-nya ditambal memakai font lokal, jangan menambal pohon asli.

---

## Struktur Folder

```
app/
  layout.tsx         → Root layout, font (kelas variable di <html>), anti-flash tema
  page.tsx           → Entry point — splash, LockScreen, atau AppShell
  loading.tsx / error.tsx / global-error.tsx / not-found.tsx

components/
  common/            → LoadingScreen (splash merek)
  entries/           → EntryCard, EntryForm, DetailView, EntryIcon, CategoryIcon,
                       BrandGlyph, BrandIconPicker
  lock/              → LockScreen, PINPad, RecoveryPanel, SetupFlow, BiometricHintModal
  providers/         → ThemeProvider (Light / Dark)
  settings/          → SettingsView, PINSettingsPanel, HealthCheckPanel, AttributionPanel,
                       BackupModal, BackupReminderModal, CategoryManager
  shell/             → AppShell, Header, Sidebar, BottomNav, AutoLockManager
  ui/                → OptionSheet, PanelSheet, PasswordGenerator, PasswordStrengthMeter, Toast
    primitives/      → Button, Input, Textarea, Modal, Toggle, Badge, Skeleton, EmptyState,
                       ErrorState, IconButton, ConfirmDialog
  vault/             → VaultListView

lib/
  constants.ts       → APP_NAME, APP_VERSION ← SUMBER VERSI (lihat Versioning)
  design-tokens.ts   → Sumber tunggal token non-tema; styles/tokens.css DI-GENERATE (`npm run tokens`)
  brand-icons.ts     → Pustaka 155 logo brand (data path SVG) + header sumber/lisensi
  attribution.ts     → Sumber/lisensi per logo untuk layar Atribusi (statis, dikunci test)
  navMode.ts         → Gaya navigasi (bottom/sidebar)    pinLength.ts → Panjang PIN (4/6)
  recoveryPhrase.ts  → Generator 5 kata acak            wordlist.ts  → 2048 kata Inggris
  crypto.ts          → AES-256-GCM, PBKDF2 (BEKU)       storage.ts   → localStorage (BEKU)
  types.ts           → Tipe data (BEKU)
  vaultService.ts    → CRUD vault (enkripsi/dekripsi/backup/export/import)
  healthCheck.ts, exportPdf.ts, utils.ts, animation.ts
  hooks/             → useRipple, useFocusTrap
  store/             → appStore.ts (Zustand)
  __tests__/fixtures → backup & snapshot penyimpanan v1.11.0 untuk test kompatibilitas

scripts/
  generate-tokens.ts     → styles/tokens.css dari lib/design-tokens.ts (`npm run tokens`)
  generate-sw-version.ts → CACHE_VER di public/sw.js dari APP_VERSION (`npm run sw-version`)

public/
  sw.js              → Service Worker (CACHE_VER disinkronkan otomatis, JANGAN edit manual)
  sw-register.js, manifest.json, ikon PWA (icons/), favicon

styles/
  globals.css        → @import semua modul CSS (urutan penting)
  tokens.css         → DI-GENERATE, jangan diedit
  base.css           → Reset, tema light/dark (SATU-SATUNYA sumber warna per tema)
  layout.css, redesign.css (lapisan desain v2), components/*.css
```

Setiap folder fitur punya `__tests__/` di sebelahnya.

---

## Format Data & Kompatibilitas

> ⚠️ Bagian ini **tidak boleh berubah** tanpa migrasi eksplisit. Dijaga test `lib/__tests__/dataCompat.test.ts`.

- **File BEKU** (identik byte-per-byte dengan v1.11.0): `lib/types.ts`, `lib/crypto.ts`, `lib/storage.ts`.
- **Format backup:** `vault2` — identifier tetap; ekstensi `.vault`; `.json` juga diterima saat impor.
- **Crypto engine:** PBKDF2 dua lapis — 600k SHA-256 + 100k SHA-512, `VER_ENHANCED = 0xAB`, AES-256-GCM.
- **Field entri (frozen):** `id`, `cat`, `name`, `user`, `pass`, `url`, `note`, `network`, `walletAddr`,
  `walletPw`, `seedPhrase`, `fav`, `ts`; tambahan `cardNo`, `cardHolder`, `cardExpiry`, `cardCVV`, `wifiSSID`,
  `wifiPass`, `emailAddr`, serta `brandIconSlug?` (hanya referensi slug; slug tak dikenal → ikon kategori).
- **CustomCategory:** `id`, `label`, `emoji`, `iconKey`, `color?`.
- **Manifest PWA:** `id`, `start_url`, `scope` = `/` (mengubahnya memutus identitas PWA yang terpasang).

### Kunci penyimpanan (localStorage kecuali dicatat)

| Kunci | Isi |
|---|---|
| `vault_data`, `vault_meta` | Data terenkripsi; metadata (hint, hash recovery, dll) |
| `vault_pin`, `vault_pin_skip`, `vault_pin_attempts`, `vault_pin_locked_until` | PIN dan lockout |
| `vault_bio_enabled`, `vault_bio_cred`, `vault_bio_sess` | Biometrik (WebAuthn) |
| `vault_ss_mpw` (**sessionStorage**) | Master password sesi |
| `vault_theme`, `vault_autolock`, `vault_autosave` | Preferensi |
| `vault_cats`, `vault_networks` | Kategori dan jaringan kustom |
| `vault_bkp_ts`, `vault_bkp_data`, `vault_bkp_ivl`, `vault_bkp_dism` | Pengingat dan cache backup |
| **`vault_nav_mode`** (baru v2) | `"bottom"` \| `"sidebar"`; bawaan `"bottom"` |
| **`vault_pin_len`** (baru v2) | `"4"` \| `"6"`; ABSEN = PIN lama 4–8 digit |

Dua kunci baru bersifat opsional (tanpa migrasi). Nilai selain yang tercantum diperlakukan sebagai absen/bawaan.
Menambah kunci penyimpanan baru memerlukan keputusan eksplisit.

---

## Fitur

| Fitur | Keterangan |
|---|---|
| PIN 6 digit (4 opsional) | Login cepat; PIN lama 4–8 digit tetap bisa lewat tombol Buka; lockout setelah salah berulang |
| Master Password | Fallback login jika PIN tidak tersedia |
| Recovery Phrase | 5 kata acak otomatis saat membuat vault; vault lama (frasa diketik manual) tetap bisa dipulihkan |
| Biometrik (WebAuthn) | Fingerprint / Face ID via platform authenticator |
| Auto-lock | Timer kunci otomatis (pilihan durasi di Pengaturan) |
| Lock per-entri | Entri dikunci individual dengan PIN |
| Kategori | Pemilih kategori lewat sheet vertikal; kategori kustom (ikon + warna) |
| Logo brand | 155 logo asli dengan pencarian; atribusi di Pengaturan > Tentang |
| Navigasi | Bar bawah atau sidebar (satu saja), dipilih di Pengaturan |
| Recycle Bin | Hapus → pulihkan sebelum benar-benar dihapus |
| Backup / Restore | Export `.vault` (juga PDF/ZIP), import `.vault` atau `.json` |
| Sync antar perangkat | Via teks terenkripsi (salin-tempel manual) |
| Kesehatan password | Panel Kesehatan Password; generator password + strength meter |
| Verifikasi 2 Langkah, kategori dinamis | Lihat CHANGELOG (v1.10.x) |
| Tema | Light / Dark (anti-flash) |
| PWA offline | 100% offline setelah install pertama |

---

## Keamanan dan batas yang diketahui

- **Enkripsi data:** AES-256-GCM; kunci diturunkan dari master password dengan PBKDF2 dua lapis (SHA-256 600k
  + SHA-512 100k), salt acak per enkripsi. Semua di perangkat; tidak ada server.
- **Recovery phrase = 5 kata dari 2048 = 55 bit entropi** (5 × log₂ 2048 = 55; ≈ 3,6 × 10¹⁶ kemungkinan).
  Keputusan desain (D4): panjang 5 kata dipertahankan. Frasa dipakai untuk (a) `recoveryHash` dan
  (b) `encMasterBySeed` (master password dienkripsi dengan frasa), keduanya di `vault_meta`.
- **Batas yang diketahui (dibaca dari kode, estimasi kasar; TIDAK diukur):** `recoveryHash` adalah SHA-256
  polos tanpa salt dan tanpa iterasi (`lib/crypto.ts`, BEKU). Karena itu pihak yang berhasil menyalin isi
  penyimpanan browser perangkat (malware, profil browser bersama, akses fisik tanpa enkripsi disk) dapat
  menguji tebakan frasa pada kecepatan hash biasa, jauh lebih murah daripada menebak master password lewat
  PBKDF2. Dengan orde 10¹⁰–10¹¹ hash/detik pada GPU kelas atas, ruang 55 bit setara orde hari sampai minggu
  per GPU. Artinya kekuatan vault terhadap penyerang yang memegang penyimpanan perangkat dibatasi oleh
  recovery phrase, bukan hanya master password. Skema ini sama dengan v1.11.0 (frasa lama diketik manual, bisa
  lebih lemah); v2 tidak mengubah perilaku recovery.
- **Mitigasi bagi pengguna:** jaga perangkat (enkripsi disk, kunci layar, tanpa malware), simpan frasa 5 kata
  di tempat aman terpisah dari perangkat, jangan difoto atau dibagikan.
- **Usulan penguatan (belum dikerjakan, perlu keputusan karena menyentuh file BEKU dan migrasi):** simpan hash
  recovery dengan KDF lambat, atau tambah jumlah kata. Lihat LAPORAN Tahap 5 (USULAN U31).

---

## Atribusi dan lisensi

- **Aplikasi:** "Seluruh hak dilindungi." (tidak ada file LICENSE open source di repo).
- **Logo brand (155):** milik pemegang merek masing-masing. Pustaka logo bersumber dari:

| Sumber | Lisensi | Logo |
|---|---|---|
| Simple Icons | CC0 1.0 | 111 |
| SVG Logos (MetaMask) | CC0 1.0 | 1 |
| Web3 Icons | MIT | 9 |
| Remix Icon (Grok) | Apache 2.0 | 1 |
| Arcticons | CC BY-SA 4.0 | 6 |
| idn-finlogos 2.5.0 | **CC BY-NC 4.0 (hanya nonkomersial)** | 27 |

  Peta per-slug dan tautan ada di layar **Pengaturan > Tentang > Atribusi & lisensi** (`lib/attribution.ts`),
  dikunci `lib/__tests__/attribution.test.ts`: menambah logo `mono`/`line`/`color` tanpa mendaftarkan sumbernya
  menggagalkan test. Teks lengkap lisensi tidak disalin; layar menampilkan nama lisensi + tautan.
- ⚠️ **27 logo CC BY-NC** tidak boleh dipakai komersial tanpa izin pemegang merek. Tinjau ulang sebelum
  memonetisasi aplikasi.

---

## Versioning

**Yang diedit MANUAL saat rilis versi baru (2 tempat):**

```
lib/constants.ts  → export const APP_VERSION = '2.0.0';   ← edit ini DULUAN
package.json      → "version": "2.0.0",                    ← lalu samakan manual
```

**Disinkronkan OTOMATIS, JANGAN edit manual:** `public/sw.js` → `const CACHE_VER = 'v2.0.0';`
(ditulis ulang dari `APP_VERSION` oleh `npm run sw-version`, juga otomatis lewat `prebuild`).
`lib/__tests__/swVersion.test.ts` menjaga keduanya tetap sama.

```
MAJOR (x.0.0)  → Perubahan besar (mis. redesain total v2.0.0) atau perubahan format data/kripto
MINOR (1.x.0)  → Fitur baru, refactor signifikan, ATAU multi-bug-fix
PATCH (1.1.x)  → Hotfix bug spesifik tunggal
```

v2.0.0 adalah MAJOR karena redesain total, **bukan** karena format data (format data tidak berubah).
Zip rilis: `aurum-vault-v{APP_VERSION}.zip` dengan folder akar `vault-next-main/`.

---

## Pengujian

- `npm test` → 1077 test di 54 file. Test penjaga: `dataCompat` (kontrak data v1.11.0 → v2),
  `designSystem` (token/tema/font), `screenStandards` (teks ≥ 13 px, target ≥ 44 px, kontras terang ≥ 4,5:1,
  tanpa literal warna), `zIndexTokens`, `swVersion`, `attribution`.
- Konvensi test: cari elemen lewat role/label/teks (bukan class CSS); data acak diuji pada banyak
  pembangkitan; jsdom tidak punya `matchMedia` dan tidak merender CSS (pemeriksaan CSS memakai parser postcss);
  tanpa `user-event`; WebAuthn hanya di-stub (bukan bukti sensor bekerja).
- Test baru divalidasi dengan **mutation check**: fitur sengaja dirusak untuk memastikan test benar-benar
  gagal. Alat mutasi bukan bagian repo.

---

## Arsitektur CSS

Semua nilai visual via CSS custom properties. Warna hanya lewat `var(--token)` atau
`color-mix(in srgb, var(--token) N%, transparent)`; **tanpa literal hex/rgb/hsl** di CSS selain blok tema
`styles/base.css` (dijaga `screenStandards.test.ts`). Pengecualian terdokumentasi: warna aset logo brand,
definisi token di blok tema, dan palet warna kategori buatan pengguna.

| Sumber | Isi |
|---|---|
| `lib/design-tokens.ts` | Token non-tema (spacing, radius, font, z-index 13 level, layout). `styles/tokens.css` digenerate: edit sumbernya lalu `npm run tokens`, jangan edit `tokens.css` |
| `styles/base.css` | Warna per tema (dark dan light harus mendefinisikan himpunan nama yang SAMA), glow latar |
| `styles/redesign.css` | Lapisan desain v2; **tidak boleh** mendefinisikan/menimpa token global |

- Skala teks 12 / 13,5 / 15 / 16,5 / 19 / 24 / 30 px (token `--text-xs` 12 px sengaja tidak dipakai: standar teks ≥ 13 px).
- Z-index selalu `var(--z-*)` (`calc(var(--z-x) + n)` untuk selisih kecil). Sheet (300) di atas modal (200).
- Font: kelas `variable` `next/font` dipasang pada `<html>`; kontrol form mewarisi font; jangan menulis
  `font-family` literal (pakai `var(--font-sans)` / `var(--font-mono)`).
- Aksesibilitas: cincin fokus `outline: 2px solid var(--gold)`; `prefers-reduced-motion` meredam animasi.
- Teks di atas emas solid memakai `--on-gold`. Inline style dilarang kecuali nilai dinamis (warna dari data).
- Framer Motion: pakai `DUR.*`/`EASE.*` dari `lib/animation.ts`. Zustand: named action + selector spesifik.

---

## Deploy

Langkah rilis GitHub → Vercel, pengecekan pasca-deploy, dan rencana rollback ada di `CHECKLIST-DEPLOY.md`.

---

## Catatan Penting

**Custom CSS bukan Tailwind** — design system via CSS variables + modul di `styles/`.

**Tanpa Firebase / Cloud** — 100% offline, semua di localStorage (terenkripsi AES-256-GCM). Format backup `vault2` beku
untuk kompatibilitas.

**`lib/crypto.ts`, `lib/types.ts`, `lib/storage.ts` BEKU** — jangan ubah tanpa migrasi data eksplisit. Perubahan di
sini bisa membuat backup dan data lama tidak bisa dibuka.
