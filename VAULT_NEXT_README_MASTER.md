# 🔐 Vault Next — Master README

> **Versi:** v1.0
> **Status Saat Ini:** ✅ Sesi 6 Selesai — Vault Next LENGKAP 🎉
> **Repo:** https://github.com/13angganh/vault-next
> **Deploy:** Vercel (auto-deploy dari GitHub push)

---

## 🔒 VISI YANG TIDAK BOLEH BERUBAH

> Dokumen ini adalah kontrak antar sesi. Setiap sesi WAJIB membaca bagian ini sebelum eksekusi.

### Data & Kompatibilitas
- Format backup: **`vault2`** — TIDAK BOLEH BERUBAH
- Crypto engine: **PBKDF2 dua lapis** (600k SHA-256 + 100k SHA-512, `VER_ENHANCED = 0xAB`) — TIDAK BOLEH BERUBAH
- Field entri LAMA wajib dipertahankan: `id`, `cat`, `name`, `user`, `pass`, `url`, `note`, `network`, `walletAddr`, `walletPw`, `seedPhrase`, `fav`, `ts`
- Field entri BARU (ditambahkan, tidak mengganti): `cardNo`, `cardHolder`, `cardExpiry`, `cardCVV`, `wifiSSID`, `wifiPass`, `emailAddr`
- File `.vault` dari apps lama HARUS bisa diimport di Vault Next

### Fitur — Tidak Ada yang Boleh Hilang
| Fitur | Status |
|---|---|
| Recycle Bin (hapus → restore) | Wajib ada |
| Kategori custom (buat, edit, emoji picker) | Wajib ada |
| Lock entri individual | Wajib ada |
| Sync antar perangkat (teks terenkripsi) | Wajib ada |
| Backup reminder otomatis | Wajib ada |
| Export/Import file `.vault` | Wajib ada |
| Auto-lock timer dengan countdown | Wajib ada |
| Install guide PWA | Wajib ada |

### Fitur Baru yang Disepakati
| Fitur | Status |
|---|---|
| Password Strength Meter (bar visual 7 level) | Akan dikerjakan Sesi 4 |
| Biometric Hint UI (tombol + modal info) | ✅ Selesai Sesi 2 |
| Auto-lock timer (sudah ada di lama, dipertahankan) | Dipertahankan |

### Identitas
- **Nama:** Vault Next
- **Versi di dalam app:** v1.0 (fresh start)
- **Bahasa:** Full Indonesia — KECUALI: Email, Game, Crypto, Vault, PIN (tetap)
- **Font:** Outfit (sans) + JetBrains Mono (mono)
- **Warna utama:** Gold `#f0a500` / `#ffcc44`, Dark `#07080f`
- **100% offline** — tidak ada Firebase, tidak ada backend, tidak ada server call
- **Deploy:** Vercel via GitHub push
- **PWA:** next-pwa, skipWaiting, clientsClaim

### Kategori Default (ID + Label final)
| ID | Label | Keterangan |
|---|---|---|
| `sosmed` | Sosmed | dari lama |
| `email` | Email | dari lama (tetap, familiar) |
| `bank` | Bank | dari lama |
| `game` | Game | dari lama (tetap, familiar) |
| `crypto` | Crypto | dari lama (tetap, familiar) |
| `lainnya` | Lainnya | dari lama |
| `kartu` | Kartu | BARU — kartu debit/kredit |
| `wifi` | Wi-Fi | BARU — kredensial jaringan |

### Schema Entri (BEKU setelah Sesi 4)
```typescript
interface VaultEntry {
  // ── Field LAMA — tidak boleh diubah ──
  id:          string;
  cat:         string;        // ID kategori (bisa custom)
  name:        string;        // nama/judul akun
  user?:       string;        // username
  pass?:       string;        // password
  url?:        string;        // URL / website
  note?:       string;        // catatan
  network?:    string;        // crypto: nama network
  walletAddr?: string;        // crypto: alamat wallet
  walletPw?:   string;        // crypto: password wallet
  seedPhrase?: string[];      // crypto: seed phrase (array kata)
  fav?:        boolean;       // favorit
  ts?:         number;        // timestamp buat/edit

  // ── Field BARU — ditambahkan, tidak mengganti ──
  cardNo?:     string;        // kartu: nomor kartu
  cardHolder?: string;        // kartu: nama pemegang
  cardExpiry?: string;        // kartu: masa berlaku
  cardCVV?:    string;        // kartu: CVV
  wifiSSID?:   string;        // wifi: nama jaringan
  wifiPass?:   string;        // wifi: password wifi
  emailAddr?:  string;        // field email tambahan
}
```

### Format Backup (BEKU)
```json
{
  "format": "vault2",
  "hint": "...",
  "data": "...",
  "count": 17,
  "exportedAt": "2026-04-07T..."
}
```
`data` adalah string terenkripsi yang berisi:
```json
{
  "vault": [...],
  "meta": { "hint": "", "recoveryHash": "", "recovery": "", "encMasterBySeed": "" },
  "customCats": [...],
  "lockedIds": [...],
  "recycleBin": [...]
}
```

---

## 🏗️ Arsitektur & Stack

| Aspek | Detail |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| State | Zustand |
| PWA | next-pwa (skipWaiting + clientsClaim) |
| Icons | Lucide React |
| Font | Outfit + JetBrains Mono via Google Fonts CDN |
| Storage | localStorage (SSR-safe) |
| Enkripsi | Web Crypto API — PBKDF2 dua lapis + AES-256-GCM |
| Deploy | Vercel |
| Backend | ❌ Tidak ada |

---

## 🗓️ Rencana Sesi

### ✅ Sesi 1 — Foundation & Design System
### ✅ Sesi 2 — Crypto, Storage, Auth & Lock Screen
### ✅ Sesi 3 — AppShell, Sidebar & Navigasi
### ⏳ Sesi 4 — Entri: Card, Form, Detail, Strength Meter
### ⏳ Sesi 5 — Fitur Lengkap: Recycle Bin, Kategori, Export/Import, Sync, Backup, Settings
### ✅ Sesi 6 — Polish, Mobile UX, PWA Final (SELESAI)

---

## ✅ Sesi 1 — Foundation & Design System (SELESAI)

### File Baru Sesi 1
```
styles/
  tokens.css                  — Design tokens: type scale, spacing, radius, transition, layout
  globals.css                 — CSS variables dark+light, reset, keyframes, utility classes

components/
  providers/
    ThemeProvider.tsx          — Context dark/light, SSR-safe, anti-flash script
  LoadingScreen.tsx            — Loading screen premium + VaultIcon SVG (export)

app/
  layout.tsx                   — Root layout: meta PWA, anti-flash script, ThemeProvider
  page.tsx                     — Placeholder preview Sesi 1 (diganti LockScreen di Sesi 2)

public/
  favicon.svg                  — SVG kunci + perisai, aksen gold
  manifest.json                — PWA manifest bahasa Indonesia
  icons/
    icon-72x72.png ... icon-512x512.png  — 8 ukuran PNG icons

next.config.js                 — next-pwa: skipWaiting + clientsClaim
```

### Yang Dikerjakan Sesi 1
**Design System:**
- [x] `tokens.css` — type scale 8 level (xs→3xl), spacing 4px base, radius scale, transition vars, layout vars
- [x] `globals.css` — CSS variables dark mode (`#07080f`, gold `#f0a500`) + light mode (warm white `#FAFAF8`)
- [x] 15+ keyframes animasi
- [x] Utility classes: `.mono`, `.label-caps`, `.truncate`, `.animate-*`, `.ripple-container`, `.skeleton`, `.sr-only`
- [x] Base style: button, input, card, modal, form utils, filter chip, notice banner, badge, divider

**ThemeProvider:**
- [x] SSR-safe + `useTheme()` hook + persist `vault_theme`

**LoadingScreen + VaultIcon:**
- [x] VaultIcon SVG reusable, 3 fase animasi, ring pulse, props `duration` + `onComplete`

**Favicon & Icons:**
- [x] `favicon.svg` + 8 PNG icons (72→512px via sharp)

**PWA & Layout:**
- [x] `manifest.json`, `layout.tsx`, `next.config.js`

**Build:** `tsc --noEmit` 0 error → `npm run build` ✅

---

## ✅ Sesi 2 — Crypto, Storage, Auth & Lock Screen (SELESAI)

### File Baru Sesi 2
```
lib/
  crypto.ts         — Crypto engine: PBKDF2 dua lapis + AES-256-GCM
  storage.ts        — SSR-safe localStorage wrapper + key constants
  types.ts          — Shared types: VaultEntry, VaultMeta, VaultBackup, dll
  vaultService.ts   — Operasi tingkat tinggi: setup, unlock, save, pin, recovery, backup
  store/
    appStore.ts     — Zustand global state (vault, auth, UI, settings)

components/
  lock/
    LockScreen.tsx        — Orchestrator: routing antar panel + layout utama
    PINPad.tsx            — Numeric keypad 3×4, dots indicator, keyboard support
    MasterPwPanel.tsx     — Input master password + hint + show/hide + link recovery
    RecoveryPanel.tsx     — Textarea recovery phrase + warning banner
    SetupFlow.tsx         — Wizard 4 step: password → hint → recovery → done
    BiometricHintModal.tsx — Modal info biometrik (fitur dijadwalkan Sesi 5)

app/
  page.tsx          — Diganti: LoadingScreen → LockScreen → (placeholder App Shell Sesi 3)
```

### Yang Dikerjakan Sesi 2

**`lib/crypto.ts` — Crypto Engine:**
- [x] `VER_ENHANCED = 0xAB` — identifier format enkripsi
- [x] PBKDF2 Lapis 1: SHA-256, 600.000 iterasi
- [x] PBKDF2 Lapis 2: SHA-512, 100.000 iterasi (via re-import raw key)
- [x] `deriveKey(password, salt, enhanced)` — derive AES-256-GCM key
- [x] `encrypt(plaintext, password)` → base64( iv[12] | salt[16] | ver[1] | cipherGCM )
- [x] `decrypt(b64, password)` — throws jika password salah/data korup
- [x] `sha256(s)` → hex string, `hashStr` alias
- [x] `generateSalt()` → Uint8Array 16 byte random
- [x] Format output kompatibel dengan vault lama (single-file)

**`lib/storage.ts` — Storage:**
- [x] 12 key constants: `LS_KEY`, `LS_META`, `LS_PIN`, `LS_THEME`, `LS_BACKUP`, `LS_BKPDATA`, `LS_BKPIVL`, `LS_BKPDISM`, `LS_AUTOLOCK`, `LS_AUTOSAVE`, `LS_CATS`, `LS_PIN_SKIPPED`
- [x] `lsGet/Set/Remove` — SSR-safe (guard `typeof window`)
- [x] `lsGetJson/SetJson`, `lsGetBool/SetBool`, `lsGetNum/SetNum`
- [x] `saveVaultData`, `loadVaultData`, `hasVaultData`, `clearAllVaultData`

**`lib/types.ts` — Shared Types:**
- [x] `VaultEntry` — semua field lama + field baru (tidak mengganti)
- [x] `VaultMeta`, `CustomCategory`, `VaultBackup`, `VaultBackupPayload`
- [x] `DEFAULT_CATEGORIES` — 8 kategori default dengan emoji
- [x] `LockScreenView` type union

**`lib/vaultService.ts` — Vault Service:**
- [x] `setupVault(payload)` — init vault baru, enkripsi, simpan meta
- [x] `unlockVault(masterPw)` → `UnlockPayload` — throws jika salah
- [x] `saveVault(...)` — re-enkripsi dan simpan (auto-save)
- [x] `setupPin(pin)`, `verifyPin(pin)`, `hasPinSetup()`, `skipPinSetup()`
- [x] `recoverMasterPw(phrase)` — recover via seed/recovery phrase
- [x] `exportBackup(...)` → `VaultBackup` (format vault2)
- [x] `importBackup(fileContent, masterPw)` → `UnlockPayload`
- [x] `getVaultHint()` — ambil hint tanpa unlock

**`lib/store/appStore.ts` — Zustand Store:**
- [x] Auth state: `isUnlocked`, `masterPw`, `autoLockMinutes`, `lastActivityAt`
- [x] Vault state: `vault[]`, `recycleBin[]`, `vaultMeta`, `lockedIds[]`, `customCats[]`
- [x] UI state: `currentFilter`, `searchQuery`, `expandedIds[]`, `selectedIds[]`
- [x] Visibility: `pwVisible`, `seedVisible` (per-entry record)
- [x] PIN state: `pinBuffer`, `pinAttempts`, `pinLocked`, `pinLockedUntil`
- [x] Settings: `backupIntervalHrs`, `autoSaveEnabled`
- [x] Semua actions: unlock, lock, setVault, toggleLockedId, setCustomCats, setFilter, toggleExpanded, togglePwVisible, appendPin, setAutoLockMinutes, dll
- [x] Selector hooks: `useIsUnlocked`, `useVault`, `useCurrentFilter`, `useSearchQuery`
- [x] Settings di-persist ke localStorage via actions

**`components/lock/LockScreen.tsx`:**
- [x] Routing: `setup` (vault baru) → `pin` (jika PIN setup) → `master` (password)
- [x] Tab switcher PIN ↔ Master Password
- [x] PIN lockout: 5 percobaan → kunci 5 menit
- [x] Recovery flow: input phrase → decrypt encMasterBySeed → auto-unlock
- [x] Theme toggle (dark/light) fixed top-right
- [x] VaultIcon + badge "+' saat setup
- [x] Footer badge: "AES-256-GCM · PBKDF2 · 100% Offline"
- [x] Animasi: `fadeScaleIn` pada card

**`components/lock/PINPad.tsx`:**
- [x] Grid 3×4 (1-9, blank, 0, ⌫)
- [x] Dots indicator dengan animasi scale + gold fill
- [x] Keyboard support (0-9, Backspace, Enter)
- [x] Auto-submit setelah maxLen digit (delay 80ms)
- [x] States: disabled, locked, error
- [x] Touch feedback (onTouchStart/End) untuk mobile

**`components/lock/MasterPwPanel.tsx`:**
- [x] Input password + toggle show/hide
- [x] Auto-focus saat mount
- [x] Clear field + re-focus saat error baru
- [x] Hint banner (gold) jika hint tersedia
- [x] Loading spinner saat proses
- [x] Link: "Lupa password?" → Recovery, "Biometrik?" → BiometricHintModal

**`components/lock/RecoveryPanel.tsx`:**
- [x] Textarea multi-line (mono font)
- [x] Warning banner merah
- [x] Loading state + error display
- [x] Tombol "Kembali ke login"

**`components/lock/SetupFlow.tsx`:**
- [x] 4 step: Password → Hint → Recovery → Done
- [x] Progress indicator (4 dot dengan connector line)
- [x] Strength bar 7 level (inline, preview Sesi 4 yang penuh)
- [x] Konfirmasi password
- [x] Summary sebelum buat vault
- [x] Loading state saat `setupVault` + `unlockVault`

**`components/lock/BiometricHintModal.tsx`:**
- [x] Modal overlay dengan animasi fadeScaleIn
- [x] Info 2 step: Android/iOS + status fitur
- [x] Notice banner (teal)
- [x] Tombol close (X) + "Mengerti"

**`app/page.tsx`:**
- [x] Flow: LoadingScreen → LockScreen → placeholder App Shell
- [x] `handleUnlocked` mengisi semua slice Zustand
- [x] Placeholder App Shell: stats card (entri, kategori, recycle bin) + tombol "Kunci Vault"

**Build:** `tsc --noEmit` 0 error ✅

---

## ✅ Sesi 3 — AppShell, Sidebar & Navigasi (SELESAI)

### File Baru Sesi 3
```
components/
  shell/
    AppShell.tsx          — Layout utama: header + sidebar + main + bottom nav + auto-lock
    Sidebar.tsx           — Nav kategori desktop: logo, filter, kategori, settings
    BottomNav.tsx         — Tab bar mobile 4 tab: Vault, Favorit, Kategori, Pengaturan
    Header.tsx            — Top bar: search debounced, + Tambah, lock, theme, countdown
    CategoryDrawer.tsx    — Bottom sheet kategori untuk mobile
    AutoLockManager.tsx   — Invisible component: track aktivitas, trigger lock saat idle

  views/
    VaultListView.tsx     — View daftar entri + empty state + entry placeholder cards
    SettingsView.tsx      — Panel pengaturan: auto-lock, auto-save, backup interval, info

app/
  page.tsx               — Diganti: LoadingScreen → LockScreen → AppShell

styles/
  globals.css            — Ditambah: CSS lengkap untuk semua komponen shell
```

### Yang Dikerjakan Sesi 3

**`AppShell.tsx`:**
- [x] Layout desktop: Header (full-width) + Sidebar kiri + Main content
- [x] Layout mobile: Header + Main content + BottomNav (sticky bottom)
- [x] State `shellView`: `vault` | `settings` — switch antar view
- [x] State `catDrawerOpen` untuk CategoryDrawer mobile
- [x] Mount `AutoLockManager` (invisible)
- [x] Prop drilling `autoLockMinutes` + `lastActivityAt` ke Header untuk countdown

**`Sidebar.tsx`:**
- [x] Logo (VaultIcon + nama + versi)
- [x] Filter: Semua, Favorit, Recycle Bin dengan badge count
- [x] Kategori default (8) + kategori custom dari store
- [x] Badge count per kategori (jumlah entri)
- [x] Highlight aktif via `data-active` + gold styling
- [x] Tombol Settings di footer
- [x] Hanya tampil di desktop (≥769px via CSS)

**`BottomNav.tsx`:**
- [x] 4 tab: Vault, Favorit, Kategori, Pengaturan
- [x] Active indicator (gold bar top)
- [x] Inferring active tab dari `currentFilter`
- [x] Hanya tampil di mobile (≤768px via CSS)

**`Header.tsx`:**
- [x] Search input dengan debounce 280ms → update `searchQuery` di store
- [x] Clear button saat ada query
- [x] Countdown auto-lock (tampil di 2 menit terakhir, animasi pulse)
- [x] Tombol `+ Tambah` (placeholder untuk Sesi 4)
- [x] Theme toggle (☀️/🌙)
- [x] Lock button
- [x] Logo mobile (hanya tampil di ≤768px)

**`CategoryDrawer.tsx`:**
- [x] Bottom sheet animasi `slideUp` + overlay `fadeIn`
- [x] Handle bar di atas
- [x] List filter (Semua/Favorit/Recycle Bin) + semua kategori
- [x] Dismiss via overlay click atau Escape key
- [x] Active state sesuai `currentFilter`

**`AutoLockManager.tsx`:**
- [x] `useEffect` timer berdasarkan `autoLockMinutes` × 60 × 1000
- [x] Event listener: click, keydown, touchstart, mousemove, scroll → `touchActivity()`
- [x] Reset timer setiap `lastActivityAt` berubah
- [x] `visibilitychange` handler: cek idle saat user kembali ke tab
- [x] Cleanup timer saat unmount

**`VaultListView.tsx`:**
- [x] Filter entri berdasarkan `currentFilter` (all/fav/bin/kategori)
- [x] Search filter real-time via `searchQuery`
- [x] Empty state dengan ikon + pesan kontekstual
- [x] Entry placeholder cards (nama, user, URL, kategori, bintang favorit)
- [x] Notice "Sesi 4" untuk EntryCard detail
- [x] Count entri di header view

**`SettingsView.tsx`:**
- [x] Toggle tema dark/light
- [x] Select auto-lock (0/1/5/10/30/60 menit)
- [x] Toggle auto-save
- [x] Select interval backup reminder
- [x] Info grid: jumlah entri, enkripsi, versi
- [x] Notice fitur Sesi 5

**`globals.css` — CSS tambahan Sesi 3:**
- [x] `.app-shell`, `.app-body`, `.app-main` — layout utama
- [x] `.app-header` + semua sub-elemen
- [x] `.sidebar` + semua sub-elemen (logo, section, item, badge)
- [x] `.bottom-nav` + tab + indicator
- [x] `.drawer` + overlay + item
- [x] `.vault-list-view`, `.vault-empty`, `.entry-card-placeholder`
- [x] `.settings-view`, `.settings-section`, `.settings-toggle`
- [x] Responsive `@media (max-width: 768px)`: sidebar hidden, bottom-nav shown
- [x] Keyframes: `slideUp`, `slideDown`, `fadeIn`

**`app/page.tsx`:**
- [x] Placeholder diganti: `isUnlocked` → `<AppShell />`

**Build:** `tsc --noEmit` 0 error → `npm run build` ✅

---

## 📌 Catatan untuk Sesi Berikutnya

### Sesi 4 — Wajib dikerjakan:
1. **`components/entries/EntryCard.tsx`** — kartu entri expandable:
   - Emoji kategori + nama + user/URL + badge favorit
   - Expand: tampilkan field relevan per kategori (pass, note, seed, card, wifi, dll)
   - Copy to clipboard (dengan feedback toast 2 detik)
   - Toggle show/hide password (per-entry, dari store `pwVisible`)
   - Action row: Edit, Lock, Favorit, Hapus (ke recycle bin)
   - Locked entry: tampilkan gembok, minta PIN/master password untuk expand

2. **`components/entries/EntryForm.tsx`** — form tambah/edit:
   - Field dinamis per kategori (sosmed: user+pass+url, bank: user+pass+note, crypto: wallet+seed, kartu: cardNo+holder+expiry+cvv, wifi: ssid+pass)
   - Category picker dengan emoji
   - Favorit toggle
   - Password generator built-in (Sesi 4)
   - Validasi: nama wajib diisi
   - Mode tambah + mode edit (terima `entry?: VaultEntry`)

3. **`components/entries/DetailView.tsx`** — view detail full-screen (mobile) / modal (desktop):
   - Semua field entri
   - Show/hide per field sensitif
   - Copy semua field
   - Edit / Hapus / Lock / Favorit

4. **`components/entries/CategoryIcon.tsx`** — reusable icon komponen:
   - Emoji + background color per kategori
   - Ukuran: sm/md/lg

5. **`components/ui/PasswordGenerator.tsx`** — generator password:
   - Panjang slider 8–64
   - Toggle: huruf besar, angka, simbol
   - Preview real-time
   - Tombol copy + regenerate
   - Strength meter 7 level (dari `SetupFlow` refactor ke komponen terpisah)

6. **`components/ui/Toast.tsx`** — notifikasi clipboard:
   - Muncul 2 detik saat copy
   - Animasi slide-in dari bawah
   - Auto-dismiss

7. **Escape key handling** di semua modal (EntryForm, DetailView)

8. **`app/page.tsx`** — hubungkan: tombol `+ Tambah` di Header membuka `EntryForm`

### Carry-forward untuk semua sesi:
- ZIP selalu berisi **seluruh project**, bukan hanya file baru
- README ini diupdate di setiap sesi: tambah checklist sesi yang selesai
- Visi di bagian atas README ini tidak boleh diubah

---

*Vault Next v1.0 — Sesi 3 selesai April 2026*

---

## ✅ Sesi 4 — Entri: Card, Form, Detail, Strength Meter (SELESAI)

### File Baru Sesi 4
```
components/
  entries/
    CategoryIcon.tsx      — Emoji + bg per kategori, ukuran sm/md/lg
    EntryCard.tsx         — Kartu expandable: fields per kategori, copy, actions
    EntryForm.tsx         — Modal form tambah/edit: field dinamis, cat picker, pw gen
    DetailView.tsx        — Modal/full-screen detail: semua field, copy, aksi

  ui/
    Toast.tsx             — useToast hook + ToastContainer, auto-dismiss 2 detik
    PasswordStrengthMeter.tsx — Bar visual 7 level + label, reusable
    PasswordGenerator.tsx — Generator: slider panjang, toggle jenis, copy, regenerate
```

### File Diupdate Sesi 4
```
components/
  views/
    VaultListView.tsx     — Diganti: EntryCard nyata + Detail + Form + forwardRef
  shell/
    AppShell.tsx          — Wire + Tambah → VaultListView.openAddForm() via ref

styles/
  globals.css             — CSS baru: entry-card, modal, form, toast, strength, pw-gen

VAULT_NEXT_README_MASTER.md  — Update ini
```

### Yang Dikerjakan Sesi 4

**`CategoryIcon.tsx`:**
- [x] Emoji + background warna per kategori (8 default + custom)
- [x] 3 ukuran: sm (28px) / md (36px) / lg (48px)
- [x] Warna per kategori: indigo sosmed, blue email, emerald bank, red game, gold crypto, sky kartu, purple wifi, gray lainnya

**`EntryCard.tsx`:**
- [x] Collapsed: CategoryIcon + nama + sublabel (user/ssid/cardHolder/emailAddr) + badge fav/lock + chevron
- [x] Expanded: field per kategori (8 template), show/hide sensitif, copy tiap field
- [x] Seed phrase: grid 12/24 kata, toggle tampil/sembunyikan, copy semua
- [x] Action row: Edit, Lock/Lepas, Favorit, Hapus (ke recycle bin), Pulihkan (dari bin), Hapus Permanen
- [x] Locked entry: overlay unlock → input PIN atau master password → expand jika cocok
- [x] Auto-save setelah setiap aksi (fav, hapus, lock) jika `autoSaveEnabled`
- [x] Keyboard: Enter/Space expand, Escape dismiss unlock overlay

**`EntryForm.tsx`:**
- [x] Mode tambah + mode edit (terima `entry?: VaultEntry`)
- [x] Field dinamis per kategori (8 template: sosmed, email, bank, game, crypto, kartu, wifi, lainnya)
- [x] Category picker: grid emoji + label, klik ganti → reset fields
- [x] Favorit toggle (switch)
- [x] Password generator link per field password → buka sub-modal PasswordGenerator
- [x] Strength meter real-time di field password yang `sensitive`
- [x] Seed phrase: grid 12 kata (bisa ganti 24), reset button
- [x] Validasi: nama wajib, fokus ke field error
- [x] Escape key dismiss
- [x] Auto-save ke localStorage setelah simpan

**`DetailView.tsx`:**
- [x] Mobile: bottom sheet (slide dari bawah); Desktop: modal center
- [x] Header: CategoryIcon lg + nama + kategori label + badges
- [x] Semua field per kategori, show/hide sensitif, copy tiap field
- [x] Seed phrase: grid tampil/sembunyikan, copy semua
- [x] Timestamp terakhir diperbarui
- [x] Action bar: Edit, Lock/Lepas, Favorit, Hapus (konfirmasi dua klik)
- [x] Escape key dismiss

**`Toast.tsx`:**
- [x] `useToast()` hook: `showToast(msg, type?)` + `<ToastContainer />`
- [x] 3 tipe: success (hijau), error (merah), info (biru)
- [x] Auto-dismiss setelah 2 detik
- [x] Animasi slide + scale in, stacked di atas BottomNav
- [x] Posisi: bottom center mobile / bottom right desktop

**`PasswordStrengthMeter.tsx`:**
- [x] `calcStrength(pw)` → `{ level: 0-7, label, color }`
- [x] 7 bar visual dengan warna progresif (red → orange → yellow → lime → green → emerald → gold)
- [x] Label: Sangat Lemah / Lemah / Cukup / Sedang / Kuat / Sangat Kuat / Luar Biasa
- [x] Prop `showLabel` opsional
- [x] Dipakai di EntryForm + PasswordGenerator

**`PasswordGenerator.tsx`:**
- [x] Generate password aman via `crypto.getRandomValues`
- [x] Slider panjang 8–64 karakter
- [x] Toggle: huruf besar, angka, simbol
- [x] Karakter required per tipe (dijamin ada minimal 1 tiap tipe aktif)
- [x] Fisher-Yates shuffle setelah inject required chars
- [x] Copy to clipboard + feedback ✓
- [x] Tombol regenerate
- [x] Strength meter real-time
- [x] Callback `onUse(password)` → isi field di EntryForm
- [x] Callback `onClose` → tutup sub-modal

**`VaultListView.tsx`:**
- [x] `forwardRef` → expose `openAddForm()` ke AppShell
- [x] Render `EntryCard` nyata per entri (ganti placeholder)
- [x] State: `detailEntry`, `editEntry`, `showAddForm`
- [x] Search filter diperluas: wifiSSID, cardHolder, emailAddr
- [x] Mount `DetailView` dan `EntryForm` sesuai state
- [x] Copy feedback via `useToast`

**`AppShell.tsx`:**
- [x] `useRef<VaultListViewRef>` → wire tombol `+ Tambah` di Header ke `vaultListRef.current?.openAddForm()`
- [x] Auto switch ke view vault sebelum buka form

**`globals.css`:**
- [x] `.entry-card`, `.entry-card__header/body/fields/actions`, `.entry-card--expanded/locked/bin`
- [x] `.entry-field`, `.entry-field__row/value/actions/btn`
- [x] `.entry-seed-grid`, `.entry-seed-word`
- [x] `.entry-action-btn` (7 state modifier)
- [x] `.entry-unlock-overlay`, `.entry-unlock-card/input/actions`
- [x] `.modal-overlay`, `.modal`, `.modal__header/body/footer`
- [x] `.entry-form-body`, `.form-group`, `.form-label`, `.form-error`, `.form-divider`, `.form-textarea`
- [x] `.cat-picker`, `.cat-picker__item/emoji/label`
- [x] `.seed-grid`, `.seed-grid__item/num/input`
- [x] `.detail-*` (header, body, field, seed, actions, ts)
- [x] `.toast-container`, `.toast`, `.toast--success/error/info`, `@keyframes toastIn`
- [x] `.strength-meter`, `.strength-meter__bars/bar/label`
- [x] `.pw-gen`, `.pw-gen__preview/pw/copy/regen/row/label/slider/toggles/toggle-row/actions`
- [x] `.pw-gen-overlay`, `.pw-gen-modal`, `.btn--sm`

**Build:** `tsc --noEmit` 0 error → `npm run build` ✅

---

## 📌 Catatan untuk Sesi Berikutnya

### Sesi 5 — Wajib dikerjakan:
1. **Recycle Bin** — restore entri, hapus permanen, kosongkan semua (sudah sebagian di EntryCard/DetailView, perlu view khusus atau sudah terintegrasi)
2. **Kategori custom** — tambah/edit/hapus kategori dengan emoji picker (EmojiPicker component)
3. **Export backup** — unduh file `.vault` (format vault2 sudah ada di vaultService)
4. **Import backup** — upload file `.vault`, verifikasi password, merge/replace
5. **Sync antar perangkat** — enkripsi → copy-paste teks (tidak ada backend, manual sync)
6. **Backup reminder** — modal otomatis jika melewati interval (cek `LS_BACKUP` vs `backupIntervalHrs`)
7. **Settings view** — PIN setup/ganti/hapus, ganti master password, install guide PWA
8. **Lock entri dari luar** — batch lock/unlock

### Carry-forward:
- ZIP selalu berisi **seluruh project**, bukan hanya file baru
- README ini diupdate di setiap sesi
- Visi di bagian atas README tidak boleh diubah

---

*Vault Next v1.0 — Sesi 4 selesai April 2026*

---

## ✅ Sesi 5 — Fitur Lengkap: Backup, Sync, Kategori, PIN, Settings (SELESAI)

### File Baru Sesi 5
```
components/
  views/
    CategoryManager.tsx     — Kelola kategori custom: tambah/edit/hapus + emoji picker inline
    BackupModal.tsx         — Export .vault, Import .vault (ganti/gabung), Sync manual (copy-paste)
    BackupReminderModal.tsx — Modal pengingat backup otomatis (muncul jika interval terlewati)
    PINSettingsPanel.tsx    — Setup / ganti / hapus PIN dari Settings
```

### File Diupdate Sesi 5
```
components/
  views/
    SettingsView.tsx        — Rewrite lengkap: PIN, Backup&Sync, Kategori, Install Guide, signature
  shell/
    AppShell.tsx            — Tambah BackupReminderModal + BackupModal state + import baru

styles/
  globals.css               — CSS baru: cat-manager, emoji-picker, backup-modal, backup-reminder,
                              pin-settings, settings update, sync-textarea, btn variants

VAULT_NEXT_README_MASTER.md — Update ini
```

### Yang Dikerjakan Sesi 5

**`CategoryManager.tsx`:**
- [x] View list: kategori default (read-only) + kategori custom (edit/hapus)
- [x] Double-tap confirm sebelum hapus (tap pertama: ⚠️, tap kedua: hapus)
- [x] Form add/edit: emoji picker grid 50 emoji inline (toggle show/hide)
- [x] Validasi: nama wajib, maks 24 karakter, no duplikat (vs default + custom lain)
- [x] Preview badge real-time (emoji + label)
- [x] Escape key cancel, Enter submit
- [x] Terintegrasi ke SettingsView sebagai sub-view

**`BackupModal.tsx`:**
- [x] 3 tab: Export / Import / Sync
- [x] **Export**: stat row (entri, recycle bin, custom cats), download file `.vault` via Blob URL, update timestamp `LS_BACKUP`
- [x] **Import**: pilih file .vault, input password backup, mode Ganti / Gabungkan, merge logic (hindari duplikat ID), update store + auto-save
- [x] **Sync Send**: generate teks terenkripsi via `exportBackup`, copy to clipboard dengan feedback
- [x] **Sync Receive**: textarea tempel teks, input password pengirim, dekripsi + update store + auto-save
- [x] Escape key dismiss
- [x] Error / success feedback per aksi

**`BackupReminderModal.tsx`:**
- [x] Cek `(now - LS_BACKUP) > backupIntervalHrs × 3600000`
- [x] Jika interval 0 → nonaktif
- [x] Dismiss per-hari via `LS_BKPDISM` (tidak muncul lagi selama 24 jam)
- [x] Muncul 3 detik setelah unlock (delay agar tidak mengganggu)
- [x] Tombol "Nanti saja" (dismiss) dan "Backup Sekarang" (buka BackupModal)
- [x] Mount di AppShell (always-on, tidak butuh user trigger)

**`PINSettingsPanel.tsx`:**
- [x] Mode idle: tampilkan status PIN (aktif/belum) + tombol aksi
- [x] Mode setup: input PIN + konfirmasi, validasi min 4 digit
- [x] Mode change-verify: input PIN lama → verifikasi → mode change-new
- [x] Mode change-new: input PIN baru + konfirmasi → simpan
- [x] Mode remove-verify: input PIN untuk konfirmasi → hapus via `lsRemove(LS_PIN)`
- [x] Success feedback 1.5 detik lalu reset
- [x] Terintegrasi di SettingsView seksi Keamanan

**`SettingsView.tsx` (rewrite):**
- [x] Seksi Tampilan: toggle tema
- [x] Seksi Keamanan: auto-lock + PINSettingsPanel
- [x] Seksi Penyimpanan: auto-save + pengingat backup
- [x] Seksi Backup & Sync: tombol buka BackupModal
- [x] Seksi Kategori: tombol buka CategoryManager (sub-view)
- [x] Seksi Info Vault: 4 stats (entri, recycle bin, enkripsi, versi)
- [x] Seksi Sesi: tombol kunci vault
- [x] Install Guide PWA: Android / iOS / Desktop
- [x] Signature footer

**`AppShell.tsx` (update):**
- [x] Import BackupReminderModal + BackupModal
- [x] State `showBackup` untuk manual open dari AppShell jika dibutuhkan
- [x] Mount `<BackupReminderModal onOpenBackup={...} />` secara permanen (auto-popup)

**`globals.css` (tambahan Sesi 5):**
- [x] `.cat-manager`, `.cat-manager__header/section-label/list/item/item-actions/empty/add-btn`
- [x] `.cat-manager-form`, `.cat-manager-form__header/emoji-row/emoji-btn/emoji-preview/emoji-hint/preview/preview-badge/actions`
- [x] `.emoji-picker`, `.emoji-picker__item`, `.emoji-picker__item--active`
- [x] `.backup-modal`, `.backup-tabs`, `.backup-tab`, `.backup-section`
- [x] `.backup-info-box`, `.backup-stat-row/stat`, `.backup-action-btn`
- [x] `.backup-mode-row/btn`, `.backup-mode-desc`, `.backup-file-row/name`
- [x] `.backup-error`, `.backup-success`, `.sync-textarea`, `.pw-input-row`
- [x] `.backup-reminder-overlay`, `.backup-reminder-modal`, `.backup-reminder__icon/title/desc/actions`
- [x] `.pin-settings`, `.pin-settings__status/actions/form-title/inputs/form-actions/warn`
- [x] `.settings-row--block`, `.settings-lock-btn`, `.settings-install-guide`
- [x] `.install-guide__item/platform/step`, `.settings-signature`
- [x] `.btn--danger`, `.btn--danger-ghost`, `.btn-success`, `.form-hint`
- [x] Responsive 480px: emoji-picker 8 kolom, backup-modal max-height

**Build:** `tsc --noEmit` 0 error → `npm run build` ✅

---

## 📌 Catatan untuk Sesi Berikutnya

### Sesi 6 — Polish, Mobile UX, PWA Final:
1. **Mobile UX audit** — touch target minimum 44px, scroll smooth, safe area insets
2. **Swipe gesture** — EntryCard swipe kiri untuk delete/archive (opsional)
3. **Performance** — lazy load komponen berat, memoize EntryCard
4. **PWA manifest** — cek screenshots, orientation, display
5. **Build & deploy** — verifikasi di Vercel, test di mobile nyata
6. **Aksesibilitas** — focus trap di semua modal, ARIA labels lengkap
7. **Dark/Light** — audit warna di semua komponen baru Sesi 5

### Carry-forward:
- ZIP selalu berisi **seluruh project**
- README ini diupdate di setiap sesi
- Visi di bagian atas tidak boleh diubah

---

*Vault Next v1.0 — Sesi 5 selesai April 2026*

---

## ✅ Sesi 6 — Polish, Mobile UX, PWA Final (SELESAI)

### File Baru Sesi 6
```
lib/
  hooks/
    useFocusTrap.ts       — Focus trap hook: Tab/Shift+Tab wrap + Escape dismiss
```

### File Diupdate Sesi 6
```
styles/
  globals.css             — CSS var fix (65 ref), safe area, mobile UX, light mode audit,
                            reduced motion, PWA standalone, empty state, touch targets

public/
  manifest.json           — Tambah: id, scope, screenshots, display_override, launch_handler

app/
  layout.tsx              — viewport-fit: cover untuk iOS safe area

components/
  entries/
    EntryCard.tsx         — Import memo, export EntryCardMemo
  views/
    VaultListView.tsx     — useMemo (entries, filterLabel, allCats), useCallback (handlers)
    BackupModal.tsx       — useFocusTrap + aria-labelledby
    BackupReminderModal.tsx — useFocusTrap + aria-labelledby + aria-describedby + autoFocus

VAULT_NEXT_README_MASTER.md — Update ini
```

### Yang Dikerjakan Sesi 6

**`lib/hooks/useFocusTrap.ts` (baru):**
- [x] Generic ref `T extends HTMLElement` — bisa dipakai di semua modal
- [x] Auto-focus elemen focusable pertama saat modal buka
- [x] Tab: wrap dari elemen terakhir → pertama
- [x] Shift+Tab: wrap dari elemen pertama → terakhir
- [x] Escape: panggil `onEscape` callback (dismiss modal)
- [x] Cleanup `removeEventListener` saat unmount / `active` berubah

**`styles/globals.css` (Sesi 6 additions):**
- [x] **CSS Variables Fix** — 65 referensi `--c-text`, `--c-gold`, `--c-surface-1/2`, `--c-border`, `--c-error` diperbaiki ke `--text`, `--gold`, `--bg-s1/s2`, `--border`, `--danger`
- [x] **Safe area insets** — `.app-shell`, `.app-body`, `.app-main`, `.bottom-nav`, `.modal-overlay` semua pakai `env(safe-area-inset-*)`
- [x] **Bottom nav** — height auto `calc(60px + env(safe-area-inset-bottom))`, padding bottom safe area
- [x] **Touch targets** — `.icon-btn`, `.entry-action-btn`, `.entry-card__header`, `.cat-picker__item` min 44px + `touch-action: manipulation`
- [x] **`-webkit-overflow-scrolling: touch`** — `.app-main`, `.modal__body`, `.backup-modal`, `.cat-drawer__body`
- [x] **Haptic visual feedback** — `button:active { transform: scale(0.97) }`, BottomNav tab scale 0.92
- [x] **Light mode audit Sesi 5** — fix `.cat-manager*`, `.emoji-picker`, `.backup-modal`, `.backup-tabs`, `.sync-textarea`, `.backup-reminder-modal`, `.pin-settings`, `.settings-lock-btn`, `.btn-success`, `.backup-error/success`
- [x] **`prefers-reduced-motion`** — semua animasi dimatikan jika user request di sistem
- [x] **PWA standalone** — `.settings-install-guide { display: none }` di `@media (display-mode: standalone)`
- [x] **Mobile padding** — `.app-main` di mobile: padding-bottom `calc(space-3 + 60px + safe-area-bottom)` agar konten tidak tertutup BottomNav
- [x] **Scrollbar hidden** — mobile scrollbar disembunyikan (`scrollbar-width: none`)
- [x] **Empty state classes** — `.vault-list__empty`, `.vault-list__empty-icon/title/desc`

**`public/manifest.json`:**
- [x] Field `id: "/"` — identity stable untuk PWA update
- [x] Field `scope: "/"` — scope navigation
- [x] `display_override: ["window-controls-overlay", "standalone"]` — desktop PWA support
- [x] `screenshots` — placeholder entry untuk listing Play Store / Galaxy Store
- [x] `launch_handler: { client_mode: "focus-existing" }` — single instance saat re-launch
- [x] `handle_links: "preferred"` — PWA handle deep links

**`app/layout.tsx`:**
- [x] `viewportFit: 'cover'` — aktifkan `env(safe-area-inset-*)` di iOS Safari + Chrome

**`components/entries/EntryCard.tsx`:**
- [x] Import `memo` dari React
- [x] Export `EntryCardMemo = memo(EntryCard)` — hindari re-render tidak perlu di list besar

**`components/views/VaultListView.tsx`:**
- [x] `useMemo` pada `allCats` — hanya recompute saat `customCats` berubah
- [x] `useMemo` pada `filterLabel` — dep: `currentFilter`, `allCats`
- [x] `useMemo` pada `entries` — dep: `vault`, `recycleBin`, `currentFilter`, `searchQuery`
- [x] `useCallback` pada `handleCopy`, `handleEdit`, `handleSaved` — stable reference

**`components/views/BackupModal.tsx`:**
- [x] Import + init `useFocusTrap<HTMLDivElement>(true, onClose)`
- [x] `ref={trapRef}` pada `.modal.backup-modal`
- [x] `aria-labelledby="backup-modal-title"` + `id` pada `<h2>`

**`components/views/BackupReminderModal.tsx`:**
- [x] Import + init `useFocusTrap<HTMLDivElement>(visible, handleDismiss)`
- [x] `ref={trapRef}` pada `.modal.backup-reminder-modal`
- [x] `aria-labelledby="backup-reminder-title"` + `aria-describedby="backup-reminder-desc"`
- [x] `autoFocus` pada tombol "Backup Sekarang" — default action

**Build:** `tsc --noEmit` 0 error → `npm run build` ✅

---

## 🏁 Vault Next v1.0 — SELESAI

Semua 6 sesi telah selesai. Vault Next siap deploy ke Vercel.

### Checklist Deploy Final
- [ ] `git push` ke `main` → Vercel auto-deploy
- [ ] Test di Android Chrome (install PWA)
- [ ] Test di iOS Safari (Add to Home Screen)
- [ ] Test import file `.vault` dari Vault lama
- [ ] Verifikasi auto-lock berjalan
- [ ] Verifikasi backup reminder muncul setelah interval

---

*Vault Next v1.0 — Sesi 6 selesai April 2026*
