# Vault Next

PWA password manager offline-first berbasis Next.js 16 (App Router), TypeScript strict, Zustand, dan enkripsi AES-256-GCM.

## Memulai

```bash
npm run dev    # development server
npm run build  # production build
npm run lint   # cek lint (0 warning = pass)
npm run test   # jalankan semua unit test
npm run typecheck  # tsc --noEmit
```

## Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| State | Zustand 5 |
| Enkripsi | AES-256-GCM + PBKDF2 (Web Crypto API) |
| Animasi | Framer Motion 12 |
| Ikon | lucide-react |
| Font | Outfit (body) + JetBrains Mono (kode/angka) via `next/font` |
| Testing | Vitest + Testing Library |
| Lint | ESLint 9 (flat config) + TypeScript-ESLint |
| Deploy | Vercel |

## Deviasi dari Standar Prompt

Vault Next menggunakan beberapa pendekatan berbeda dari standar prompt-base yang umum. Ini **disengaja dan sudah dipertimbangkan**:

### Custom CSS (bukan Tailwind)
PWA offline-first — bundle size lebih penting dari developer ergonomics. Design system sudah mature dengan CSS variables + modular CSS files di `styles/components/`. Tailwind membutuhkan build step PurgeCSS yang tidak sejalan dengan filosofi offline-first.

### Tanpa shadcn/ui
App tidak pakai Radix UI primitives. Modal, focus trap, dan accessibility diimplementasikan manual di `components/ui/primitives.tsx` dan `components/ui/Modal.tsx`.

### Tanpa React Hook Form + Zod
Form di app ini sederhana (PIN entry, password generator, entri vault). Validasi dilakukan di level service (`lib/vaultService.ts`), bukan di level form. Overhead library tidak sebanding dengan kompleksitas yang ada.

### Tanpa Firebase / Cloud
App ini 100% offline. Semua data disimpan di localStorage (terenkripsi AES-256-GCM). Tidak ada server, tidak ada akun, tidak ada sync otomatis.

## Struktur Folder

```
app/             → Next.js App Router (layout, page, error, not-found)
components/
  common/        → komponen reusable umum
  entries/       → EntryCard, EntryForm, DetailView
  lock/          → LockScreen, PINEntry, BiometricHintModal
  providers/     → ThemeProvider
  settings/      → SettingsView, PINSettingsPanel, BackupModal, CategoryManager
  shell/         → AppShell, Header, Sidebar, AutoLockManager
  ui/            → Button, Toggle, Modal, PasswordStrengthMeter, CategoryIcon, primitives
  vault/         → VaultListView
lib/
  __tests__/     → unit tests (Vitest)
  hooks/         → useRipple, useAutoFocus
  store/         → Zustand stores (appStore, vaultStore)
  constants.ts   → konstanta global
  crypto.ts      → AES-256-GCM, PBKDF2, generateSalt
  design-tokens.ts → token reference untuk TypeScript
  storage.ts     → localStorage abstraction (lsGet, lsSet, lsRemove, dsb.)
  types.ts       → TypeScript types & interfaces
  utils.ts       → generateId, formatDate, dsb.
  vaultService.ts → CRUD entri vault (enkripsi/dekripsi)
public/
  sw.js          → Service Worker
  sw-register.js → SW registration + skip waiting
  manifest.json  → PWA manifest
styles/
  tokens.css     → CSS variables (warna, font, spacing, z-index, dsb.)
  base.css       → reset, typography, scrollbar, focus
  globals.css    → @import semua style
  layout.css     → app-shell, header, sidebar, layout
  components/    → CSS modular per komponen
```

## Progress Fix Audit

Lihat `readme-fix.md` untuk status lengkap 36 temuan audit (Fase 1–4).
