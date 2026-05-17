# CLAUDE.md — Vault Next: Konteks & Aturan untuk AI

> File ini wajib dibaca sebelum membuat perubahan apapun ke codebase ini.
> Berisi semua deviasi dari standar prompt, konvensi aktif, dan aturan yang tidak boleh dilanggar.

---

## 1. Stack Aktual (Berbeda dari Standar Prompt)

| Standar Prompt | Aktual di Vault Next | Alasan |
|---|---|---|
| Tailwind CSS | Custom CSS di `styles/` | PWA offline-first, bundle size prioritas, design system sudah mature |
| shadcn/ui + Radix UI | Custom primitives di `components/ui/primitives/` | Tidak ada overhead library untuk UI sederhana |
| React Hook Form + Zod | Manual `useState` + validasi di `lib/vaultService.ts` | Form sederhana, validasi di service layer lebih tepat |
| TanStack Query | Tidak ada | App 100% offline, tidak ada server call |
| Sonner | Custom `useToast` di `components/ui/Toast.tsx` | Sudah berjalan baik |
| Sentry | Tidak ada | Akan dipertimbangkan terpisah |
| Inter | **Outfit** (body) + JetBrains Mono (mono) via `next/font` | Karakter display Outfit lebih ekspresif untuk dark/premium password manager |
| Firebase | **Tidak ada** | 100% offline, semua data di localStorage terenkripsi AES-256-GCM |

---

## 2. File & Kode yang BEKU (Tidak Boleh Diubah)

| File / Bagian | Alasan |
|---|---|
| `lib/crypto.ts` — format, algoritma, `VER_ENHANCED = 0xAB`, iterasi PBKDF2 | Data encrypted yang ada tidak bisa di-decrypt jika format berubah |
| `lib/types.ts` — field lama di `VaultEntry` | Backward-compat dengan backup file yang ada |
| Format backup `vault2` di `VaultBackup` | Pengguna mungkin punya backup file lama — vault3 baru untuk format baru |
| Key constants `LS_*` dan `SS_*` di `lib/storage.ts` | localStorage keys yang berubah = data hilang |
| Font: Outfit (body) + JetBrains Mono (mono) | Pilihan desain intentional — **jangan ganti ke Inter** |
| CSS approach: pure CSS modules di `styles/` | **Jangan tambahkan Tailwind** — murni CSS variables |

---

## 3. Design Token Rules — Wajib

Semua nilai visual **harus** referensi CSS variable. Hardcode dilarang keras.

| Yang dilarang | Gunakan token ini |
|---|---|
| `rgba(255,77,109,...)` | `var(--danger)` + opacity, atau `var(--danger-bg)` / `var(--danger-border)` |
| `rgba(0,212,170,...)` | `var(--teal)` + opacity, atau `var(--notice-bg)` / `var(--notice-border)` |
| `rgba(77,142,255,...)` | `var(--blue)` + opacity |
| `rgba(245,158,11,...)` | `var(--gold)` + opacity, atau `var(--gold-dim)` / `var(--gold-border)` |
| `0.2s ease`, `0.15s ease`, `150ms` | `var(--transition-fast)` |
| `250ms`, `280ms` | `var(--transition-normal)` |
| `400ms` | `var(--transition-slow)` |
| `'JetBrains Mono', monospace` | `var(--font-mono)` |
| `'Outfit', sans-serif` | `var(--font-sans)` |
| `z-index: 200` hardcoded | `var(--z-sidebar)` |
| `z-index: 400` hardcoded | `var(--z-modal)` |
| `var(--trans-fast)` | ⚠️ Token ini **tidak terdefinisi** — gunakan `var(--transition-fast)` |
| `#000` di tombol gold/primary | `var(--btn-on-gold)` |
| `#f87171`, `#ef4444` (merah UI) | `var(--action-red)` |
| `#f59e0b`, `#fbbf24` (amber/fav) | `var(--action-amber)` |
| `#34d399`, `#10b981` (hijau restore) | `var(--action-green)` |
| `#60a5fa`, `#3b82f6` (biru lock) | `var(--action-blue)` |
| `#4ade80` (hijau success/copy) | `var(--action-success)` |
| `#166534`/`#86efac` (toast success) | `var(--toast-success-bg)` / `var(--toast-success-text)` |
| `#7f1d1d`/`#fca5a5` (toast error) | `var(--toast-error-bg)` / `var(--toast-error-text)` |
| `#1e3a5f`/`#93c5fd` (toast info) | `var(--toast-info-bg)` / `var(--toast-info-text)` |
| `#9ca3af` (icon fallback) | `var(--muted)` |

Token warna kategori yang tersedia:
- Icon: `var(--cat-sosmed)`, `var(--cat-email)`, `var(--cat-bank)`, `var(--cat-game)`, `var(--cat-crypto)`, `var(--cat-kartu)`, `var(--cat-wifi)`, `var(--cat-lainnya)`
- Background alpha (ikut tema): `var(--cat-sosmed-bg)`, `var(--cat-email-bg)`, `var(--cat-bank-bg)`, `var(--cat-game-bg)`, `var(--cat-crypto-bg)`, `var(--cat-kartu-bg)`, `var(--cat-wifi-bg)`, `var(--cat-lainnya-bg)`

---

## 4. Konvensi CSS & Komponen

### Struktur `styles/`
```
styles/
  tokens.css        → CSS variables: warna, spacing, typography, z-index, radius
  base.css          → Global styles, dark/light theme overrides ([data-theme="light"])
  globals.css       → Reset, scroll, selection
  layout.css        → App shell, sidebar, header layout
  components/       → Satu file per grup komponen
    modal.css, entries.css, lock.css, settings.css,
    ui.css, common.css, backup.css, ...
```

### Touch Target Minimum
| Elemen | Minimum |
|---|---|
| `.btn` | min-height: 40px |
| `.btn-sm` | min-height: 36px |
| `.ibtn` (icon button default) | 36×36px |
| `.ibtn--sm` | 36×36px |
| `.entry-field__btn` | 36×36px |

---

## 5. State & Data Flow

- **State global:** Zustand store di `lib/store/appStore.ts` — `useAppStore()`
- **Enkripsi/dekripsi:** Selalu lewat `lib/crypto.ts` — tidak ada akses langsung ke Web Crypto di komponen
- **Persistensi:** `lib/storage.ts` wraps localStorage — selalu pakai helper `lsGet/lsSet/lsRemove`
- **Service layer:** Operasi vault (save/load/export) di `lib/vaultService.ts`
- **Tidak ada fetch/API:** App 100% offline — tidak ada `fetch()`, `axios`, SWR, atau TanStack Query

---

## 6. Biometrik — Arsitektur Session

Biometrik menggunakan WebAuthn (`navigator.credentials`). Master password **tidak disimpan** di credential WebAuthn — WebAuthn hanya sebagai verifikasi identitas untuk membuka session.

**Dual storage strategy:**
1. **Primary:** `sessionStorage` key `vault_ss_mpw` — terhapus saat tab/browser ditutup
2. **Fallback:** `localStorage` key `vault_bio_sess` — XOR-obfuscated dengan credentialId sebagai key

Fallback ini **disengaja** agar sidik jari tetap bekerja setelah app di-background (mobile). Bukan security hole karena vault utama tetap dienkripsi AES-256-GCM.

**Bug yang sudah difix (Fix 7B):** `xorDeobfuscate` return `null` (bukan string kosong) jika decode gagal, agar `loadBioSession` tidak false-negative saat master password sendiri berupa string kosong.

---

## 7. Service Worker — Auto-Update

`public/sw.js` menggunakan `CACHE_NAME` dengan timestamp yang di-inject saat build via `scripts/bump-sw.js`. Format: `vault-next-YYYYMMDD-HHmm`.

- **Manual:** `npm run bump-sw`
- **Otomatis saat build:** `prebuild` script di `package.json` memanggil `bump-sw` sebelum `next build`

Jangan hardcode versi manual di `sw.js`.

---

## 8. Emoji Policy

**Tidak ada emoji di seluruh UI** — tanpa pengecualian. Gunakan Lucide icons. Ini berlaku untuk:
- JSX/TSX termasuk string literal dan label tombol
- CSS `content` property
- Pesan toast, error, sukses, konfirmasi

---

## 9. Aturan NPM

```
❌ JANGAN npm install dependency baru tanpa instruksi eksplisit
❌ JANGAN tambahkan Tailwind, shadcn/ui, Firebase, Sonner, Axios
❌ JANGAN ganti custom CSS dengan Tailwind classes
❌ JANGAN refactor komponen di luar scope perubahan yang diminta
✅ BOLEH menambahkan helper function di file yang sudah ada
✅ BOLEH menambahkan CSS rule baru di file yang relevan
✅ BOLEH menambahkan token CSS baru di tokens.css + base.css (dark + light)
```

### Versi Dependency Intentional

| Package | Versi | Catatan |
|---|---|---|
| `lucide-react` | `1.14.0` (exact, tanpa `^`) | lucide-react bermigrasi ke 1.x pada 2025–2026. Ini adalah versi stabil terbaru yang sudah diverifikasi. Dikunci exact agar tidak ada unintended breaking upgrade. |
| `next` | `16.2.4` | App Router, Next.js 16 series. |
| `framer-motion` | `^12.38.0` | Untuk animasi Modal dan Sidebar. |

---

## 10. Checklist Sebelum Commit

```bash
npm run typecheck   # tsc --noEmit → 0 error (noUnusedLocals + noUnusedParameters aktif)
npm run lint        # eslint --max-warnings 0 → 0 warning (prefer-const: error, no-var: error)
npm run test        # vitest run → semua pass
grep -rn "rgba(" components/   # review manual — tidak boleh ada hardcode baru
grep -rn "z-index: [0-9]" styles/  # harus 0 hasil — semua via var(--z-*)
grep -rn 'href="/' app/ components/  # harus 0 hasil — semua URL via ROUTES
```

### ⚠️ Todo Visual (Non-Blocking)

- **manifest.json screenshots**: saat ini masih menggunakan icon placeholder (`/icons/icon-512x512.png`).
  Sebelum submit ke PWA store, ganti dengan screenshot real app (portrait 1080×1920 atau 390×844).
  Ini **tidak blocking deploy** — app berfungsi sempurna tanpa screenshot.
