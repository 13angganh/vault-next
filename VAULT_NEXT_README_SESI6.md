# 🔐 Vault Next — Master README

> **Status Saat Ini:** ✅ Sesi 6 Selesai — PRODUCTION READY
> **Repo:** https://github.com/13angganh/vault-next
> **Target Deploy:** vault-next.vercel.app

---

## 🎯 Identitas Proyek

| Aspek | Detail |
|---|---|
| Nama Aplikasi | Vault Next |
| Versi dalam App | v1.0 |
| Framework | Next.js 16 (App Router) + TypeScript |
| State Management | Zustand |
| PWA | next-pwa (skipWaiting + clientsClaim) |
| Icons | Lucide React |
| Font | Outfit (sans) + JetBrains Mono (mono) via Google Fonts CDN |
| Deploy | Vercel (auto-deploy dari GitHub push) |
| Backend | ❌ Tidak ada — 100% offline |
| Storage | localStorage (SSR-safe wrapper) |
| Enkripsi | AES-256-GCM via Web Crypto API |
| Bahasa | Full Bahasa Indonesia |

---

## ✅ Sesi 1 — Foundation & Design System (SELESAI)
## ✅ Sesi 2 — Lock Screen & Autentikasi (SELESAI)
## ✅ Sesi 3 — AppShell & Navigasi (SELESAI)
## ✅ Sesi 4 — EntryCard, EntryForm & DetailView (SELESAI)
## ✅ Sesi 5 — Import/Export, Toast, Settings & Responsive (SELESAI)

---

## ✅ Sesi 6 — Finalisasi & Deploy (SELESAI)

### File Baru:

```
lib/hooks/
  useInstallPrompt.ts     — Hook PWA install prompt (beforeinstallprompt + appinstalled)
  useIsMobile.ts          — Hook deteksi layar mobile (matchMedia ≤768px)

components/ui/
  InstallBanner.tsx       — Banner install PWA di atas app, hilang jika sudah terinstall
```

### File Diupdate:

```
next.config.js                        — Tambah clientsClaim + runtimeCaching NetworkFirst
components/shell/AppShell.tsx         — Integrasikan InstallBanner + animasi view transisi
components/entries/DetailView.tsx     — Mobile fullscreen overlay + back button
components/entries/EntryForm.tsx      — Mobile fullscreen overlay
styles/globals.css                    — Tambah keyframes: slideDown, slideUpFade, viewEnter
```

### Fitur Sesi 6:

**useInstallPrompt.ts:**
- [x] Menangkap event `beforeinstallprompt` (Chrome/Android)
- [x] Deteksi `display-mode: standalone` → tahu app sudah terinstall
- [x] Listen `appinstalled` → update state setelah install berhasil
- [x] `triggerInstall()` → panggil native browser install dialog
- [x] Support iOS Safari via `navigator.standalone`

**InstallBanner.tsx:**
- [x] Header bar tipis (40px) di paling atas AppShell
- [x] Background gradient gold-subtle
- [x] Teks: "Pasang Vault untuk akses offline penuh"
- [x] Tombol "Pasang" → trigger native install dialog
- [x] **Hilang otomatis** jika app sudah terinstall (display-mode: standalone)
- [x] **Tidak muncul** jika browser tidak support (Firefox, Safari desktop)
- [x] Animasi `slideDown` saat muncul

**DetailView.tsx — Mobile Fullscreen:**
- [x] `useIsMobile()` untuk deteksi breakpoint ≤768px
- [x] Mobile: render `position: fixed; inset: 0` fullscreen overlay (z-index 800)
- [x] Mobile: back bar atas dengan tombol "← Kembali" berwarna gold
- [x] Mobile: animasi `slideInRight` saat masuk
- [x] Desktop: perilaku tidak berubah (panel kanan 320px)
- [x] Refactor: body detail dipisah ke `DetailContent` component (shared mobile & desktop)

**EntryForm.tsx — Mobile Fullscreen:**
- [x] `useIsMobile()` untuk deteksi breakpoint ≤768px
- [x] Mobile: render `position: fixed; inset: 0` fullscreen (z-index 900)
- [x] Mobile: background `var(--bg-root)`, tanpa backdrop overlay gelap
- [x] Mobile: animasi `slideInRight` saat masuk
- [x] Desktop: perilaku tidak berubah (panel 400px dari kanan + backdrop)
- [x] Refactor: body form dipisah ke `FormContent` component (shared mobile & desktop)

**AppShell.tsx:**
- [x] `<InstallBanner />` di-render paling atas (di luar layout sidebar)
- [x] Wrapper `height: 100dvh` diubah ke `flexDirection: column` agar banner tidak menggeser layout
- [x] Animasi transisi antar view: setiap view (`vault`, `export-import`, `settings`) dibungkus `div` dengan `animation: viewEnter`
- [x] `viewEnter`: `opacity: 0 + translateX(16px)` → `opacity: 1 + translateX(0)` dalam `var(--transition-normal)`

**next.config.js:**
- [x] `clientsClaim: true` — SW baru langsung kontrol semua tab aktif
- [x] `skipWaiting: true` — SW baru tidak nunggu tab lama tutup
- [x] `runtimeCaching` dengan handler `NetworkFirst` — halaman selalu fresh dari network, fallback ke cache
- [x] **Efek:** user cukup **refresh** setelah deploy baru → langsung dapat versi terbaru, tanpa uninstall / clear cache / hard reset

**globals.css — Keyframes baru:**
- [x] `@keyframes slideDown` — untuk InstallBanner masuk dari atas
- [x] `@keyframes slideUpFade` — utility animasi naik dari bawah
- [x] `@keyframes viewEnter` — transisi antar main view (fade + slide kecil dari kanan)

**Build:**
- [x] `npx tsc --noEmit` → 0 error
- [x] `npm run build` → ✅ sukses, 0 warning

---

## 🚀 Cara Deploy

1. Push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: sesi 6 — install prompt, mobile fullscreen, view transitions"
   git push
   ```
2. Vercel auto-detect push → build otomatis
3. Setelah deploy selesai: user cukup **refresh** browser/PWA → versi baru aktif

---

## 📌 Catatan PWA Update Strategy

| Skenario | Perilaku |
|---|---|
| Deploy baru di Vercel | SW baru terdeteksi saat user buka app |
| User refresh sekali | SW baru aktif, halaman reload dengan versi baru |
| Tanpa clear cache | ✅ Tidak perlu |
| Tanpa uninstall PWA | ✅ Tidak perlu |
| Tanpa hard reset | ✅ Tidak perlu |

Ini berkat kombinasi `skipWaiting: true` + `clientsClaim: true` + `NetworkFirst` caching.

---

## 🏗️ Struktur File Lengkap (Post-Sesi 6)

```
vault-next/
├── app/
│   ├── favicon.ico
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── LoadingScreen.tsx
│   ├── entries/
│   │   ├── CategoryIcon.tsx
│   │   ├── EntryCard.tsx
│   │   ├── PasswordGenerator.tsx
│   │   ├── EntryForm.tsx         ← DIUPDATE Sesi 6 (mobile fullscreen + FormContent)
│   │   └── DetailView.tsx        ← DIUPDATE Sesi 6 (mobile fullscreen + DetailContent)
│   ├── lock/
│   │   ├── LockScreen.tsx
│   │   ├── PINPad.tsx
│   │   ├── MasterPwPanel.tsx
│   │   ├── RecoveryPanel.tsx
│   │   ├── BiometricHintModal.tsx
│   │   └── SetupFlow.tsx
│   ├── providers/
│   │   └── ThemeProvider.tsx
│   ├── shell/
│   │   ├── AppShell.tsx          ← DIUPDATE Sesi 6 (InstallBanner + view transitions)
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── ui/
│   │   ├── ToastContainer.tsx
│   │   └── InstallBanner.tsx     ← BARU Sesi 6
│   └── views/
│       ├── ExportImportView.tsx
│       └── SettingsView.tsx
├── lib/
│   ├── crypto.ts
│   ├── storage.ts
│   ├── hooks/                    ← BARU Sesi 6
│   │   ├── useInstallPrompt.ts
│   │   └── useIsMobile.ts
│   └── store/
│       ├── authStore.ts
│       ├── vaultStore.ts
│       └── uiStore.ts
├── styles/
│   ├── globals.css               ← DIUPDATE Sesi 6 (keyframes baru)
│   └── tokens.css
├── public/
│   ├── manifest.json
│   ├── favicon.svg
│   └── icons/
├── next.config.js                ← DIUPDATE Sesi 6 (clientsClaim + runtimeCaching)
├── package.json
├── tsconfig.json
└── VAULT_NEXT_README_SESI[1-6].md
```

---

## 🔑 STORAGE_KEYS (localStorage) — FINAL

| Key | Isi |
|---|---|
| `vault_theme` | `'dark'` \| `'light'` |
| `vault_salt` | Random hex 32 byte |
| `vault_pin_hash` | SHA-256 hash PIN |
| `vault_master_pw_hash` | SHA-256 hash master password |
| `vault_seed_phrase` | 12 kata seed phrase (plaintext) |
| `vault_data` | `EncryptedPayload` JSON (AES-256-GCM) berisi array `VaultEntry[]` |
| `vault_setup_complete` | `'true'` jika setup sudah selesai |

---

## 📊 VaultEntry Schema (BEKU — tidak berubah sejak Sesi 4)

```typescript
interface VaultEntry {
  id: string;
  category: EntryCategory;
  title: string;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  notes?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCVV?: string;
  wifiSSID?: string;
  wifiPassword?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
}
```

---

## ✅ Checklist End-to-End (Lakukan setelah deploy)

- [ ] Setup awal: isi PIN + master password + catat seed phrase
- [ ] Tambah entri: password, email, kartu, wifi, catatan, lainnya
- [ ] Buka detail entri (desktop: panel kanan, mobile: fullscreen slide)
- [ ] Edit entri → simpan → cek perubahan tersimpan
- [ ] Tandai favorit → cek di tab Favorit
- [ ] Export .vault → Import kembali (mode Gabung + mode Ganti Semua)
- [ ] Export .csv → konfirmasi warning modal
- [ ] Ubah PIN dari Pengaturan
- [ ] Kunci vault → unlock dengan PIN
- [ ] Timeout sesi: set ke 2 menit → tunggu → pastikan auto-lock
- [ ] Toggle tema dark/light
- [ ] Install PWA (tombol "Pasang" di banner) → banner hilang setelah install
- [ ] Deploy ulang → refresh → pastikan versi baru aktif tanpa clear cache

---

*Vault Next v1.0 — Sesi 6 (Final) selesai April 2026*
