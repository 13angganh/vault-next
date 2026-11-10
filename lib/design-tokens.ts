/**
 * lib/design-tokens.ts — Vault Next
 * Single source of truth untuk semua design tokens.
 * Nilai di sini harus sinkron dengan styles/tokens.css.
 * Gunakan file ini untuk TypeScript consumers (generate-tokens.ts, tests, dll).
 *
 * M-04 — Sesi B
 */

// ─── Type Scale ───────────────────────────────────────────────────────────────
// v2.0.0 (Tahap 2): skala dinaikkan agar teks tidak kecil (keputusan desain
// terkunci: 12/13,5/15/16,5/19/24/30). Sebelumnya nilai ini hidup sebagai
// override di styles/redesign.css; dipindah ke sini (single source of truth).
// '3xl' tidak berubah.
export const fontSize = {
  xs:   '12px',
  sm:   '13.5px',
  base: '15px',
  md:   '16.5px',
  lg:   '19px',
  xl:   '24px',
  '2xl':'30px',
  '3xl':'36px',
} as const;
export type FontSize = keyof typeof fontSize;

// ─── Font Weight ──────────────────────────────────────────────────────────────
export const fontWeight = {
  normal:      400,  // body & deskripsi
  medium:      500,  // label & meta
  semibold:    600,  // button & subheading
  bold:        700,  // heading
  extrabold:   800,  // display / lock screen
} as const;
export type FontWeight = keyof typeof fontWeight;

// ─── Line Height ─────────────────────────────────────────────────────────────
export const lineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.7,
} as const;

// ─── Letter Spacing ──────────────────────────────────────────────────────────
export const letterSpacing = {
  label: '0.05em',
  tight: '-0.02em',
} as const;

// ─── Font Families ────────────────────────────────────────────────────────────
// v2.0.0 (Tahap 2): Inter + JetBrains Mono lewat next/font. Nama variabel
// --font-outfit / --font-jetbrains dipertahankan (didefinisikan oleh kelas
// `variable` next/font di app/layout.tsx — HARUS dipasang pada <html>, bukan
// <body>, karena token ini dievaluasi di :root). Urutan fallback = dari prototipe.
export const fontFamily = {
  sans: "var(--font-outfit), 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

// ─── Spacing Scale (4px base) ─────────────────────────────────────────────────
export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;
export type SpacingKey = keyof typeof spacing;

// ─── Border Radius ────────────────────────────────────────────────────────────
// v2.0.0 (Tahap 2): radius dinaikkan (arah visual "kartu tebal, radius besar").
// Sebelumnya override di styles/redesign.css; dipindah ke sini. 'full' tidak berubah.
export const radius = {
  sm:   '10px',
  md:   '14px',
  lg:   '18px',
  xl:   '24px',
  '2xl':'32px',
  full: '9999px',
} as const;
export type Radius = keyof typeof radius;

// ─── Elevation (shadow tier untuk depth kartu premium) ────────────────────────
// v-redesign-1: tier shadow baru untuk avatar/logo brand & kartu entry —
// terpisah dari --shadow-gold/--shadow-modal/--shadow-sidebar yang sudah ada
// di base.css (dark & light masing-masing punya nilai sendiri karena base
// alpha berbeda). Didefinisikan di sini sebagai referensi type-safe; nilai
// aktual (dark/light) tetap hidup di base.css seperti token warna lainnya.
export const elevationTier = {
  flat:   'flat',    // baris/list item — tanpa shadow, hairline border saja
  card:   'card',    // kartu entry/kategori — shadow lembut, radius lg/xl
  raised: 'raised',  // avatar/logo brand, tombol primer aktif — shadow + tint warna brand/gold
  modal:  'modal',   // sudah ada di --shadow-modal, dicatat di sini utk referensi
} as const;
export type ElevationTier = keyof typeof elevationTier;

// ─── Transitions ─────────────────────────────────────────────────────────────
export const ease = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out:     'cubic-bezier(.2,.8,.2,1)', // v2.0.0 (Tahap 2): kurva keluar prototipe (dulu override di redesign.css)
} as const;

export const transition = {
  fast:   `150ms ${ease.default}`,
  normal: `250ms ${ease.default}`,
  slow:   `400ms ${ease.default}`,
  spring: `350ms ${ease.spring}`,
} as const;
export type Transition = keyof typeof transition;

// ─── Layout ──────────────────────────────────────────────────────────────────
export const layout = {
  sidebarWidth:  '260px',
  appbarHeight:  '60px', // v2.0.0 (Tahap 2): header 60px (dulu override di redesign.css)
  contentMax:    '960px',
  modalWidth:    '480px',
  modalWidthSm:  '360px',
} as const;

// ─── Z-Index Scale ────────────────────────────────────────────────────────────
// v1.9.1: BUG FIX — token --z-* dipakai luas di 11 file CSS (sidebar,
// modal, lock, dropdown, header sticky, toast) tapi TIDAK PERNAH
// didefinisikan di sini maupun di styles/tokens.css — dicek: nihil di
// seluruh proyek sebelum fix ini. var() yang gagal resolve membuat
// `z-index` jatuh ke initial value `auto`, sehingga stacking order
// semua elemen ini ditentukan urutan DOM, bukan hierarki yang
// dimaksud — inilah akar penyebab sidebar/modal/overlay bisa
// tumpang-tindih dengan konten di baliknya secara tak terduga
// (dilaporkan pengguna: sidebar sulit diklik karena konten halaman
// utama "menembus" tampil di depannya).
//
// Nilai z-top (9999) dan z-modal (200) BUKAN angka baru — keduanya
// dikonfirmasi dari komentar sejarah kode yang menyebutkan literal
// lama sebelum standarisasi ke token (lihat styles/components/lock.css
// baris ~849 untuk z-top, styles/components/modal.css baris ~134
// untuk z-modal). Level lain disusun logis dari urutan hierarki visual
// yang sudah tersirat di konteks pemakaian masing-masing token,
// dengan gap 10x antar level untuk ruang ekspansi ke depan.
// v2.0.0 (Tahap 2): tujuh level lama TIDAK berubah. Ditambah enam level untuk
// menggantikan angka z-index mentah yang tersebar di CSS/TSX (aturan proyek:
// semua z-index lewat var(--z-*)). Nilai tiap level baru SAMA dengan angka
// mentah yang digantikannya, sehingga urutan susun tidak berubah:
//   behind -1  lapisan di belakang konten (glow latar body::before, ::before border ikon)
//   base    0  konteks susun lokal (.icon-btn)
//   raised  1  satu tingkat di atas lapisan lokal (ikon di atas ::before). +1 → 2 (tombol field)
//   bar     5  bilah sticky di dalam halaman (.ef2-top, .ef2-footer); .page-header = bar+1
//   popover 40 backdrop menu pilih tipe field; menunya = popover+1
//   sheet  300 overlay OptionSheet; setara toast, di atas modal (200) agar bisa
//              dibuka dari dalam modal/form. Urutan DOM menentukan bila bersamaan toast.
// Catatan: nilai negatif (behind) sah — test zIndexTokens menerima -?[0-9]+.
export const zIndex = {
  behind:   -1,
  base:      0,
  raised:    1,
  bar:       5,
  sticky:   10,    // header sticky level dasar (.app-header, .page-header)
  content:  10,    // setara sticky, konteks halaman berbeda (.page-header settings/entry-form)
  dropdown: 20,    // popover/menu kecil (.vault-sort-menu, .pw-gen-overlay)
  sidebar:  30,    // sidebar navigasi + overlay-nya, drawer mobile
  popover:  40,
  modal:    200,   // modal dialog (.modal, .modal-overlay) — dikonfirmasi dari komentar historis
  sheet:    300,
  toast:    300,   // notifikasi banner (.sw-update-bar) — di atas modal biasa, harus selalu terlihat
  top:      9999,  // lapisan mutlak tertinggi: confirm dialog, biometric modal, toast container, unlock overlay — dikonfirmasi dari komentar historis
} as const;

// ─── Color Palette (CSS var references) ──────────────────────────────────────
// Untuk runtime CSS, tetap gunakan var(--gold) dst.
// Objek ini berguna untuk tooling / code-gen saja.
export const colorVar = {
  bg:          'var(--bg)',
  bgS1:        'var(--bg-s1)',
  bgS2:        'var(--bg-s2)',
  bgS3:        'var(--bg-s3)',
  bgOverlay:   'var(--bg-overlay)',
  gold:        'var(--gold)',
  gold2:       'var(--gold2)',
  goldDim:     'var(--gold-dim)',
  goldBorder:  'var(--gold-border)',
  goldGlow:    'var(--gold-glow)',
  goldSoft:    'var(--gold-soft)',
  goldText:    'var(--gold-text)',
  teal:        'var(--teal)',
  red:         'var(--red)',
  blue:        'var(--blue)',
  text:        'var(--text)',
  text2:       'var(--text2)',
  muted:       'var(--muted)',
  muted2:      'var(--muted2)',
  border:      'var(--border)',
  border2:     'var(--border2)',
} as const;

// ─── Button Variants ─────────────────────────────────────────────────────────
export const buttonVariant = ['gold', 'ghost', 'danger', 'teal', 'primary'] as const;
export type ButtonVariant = typeof buttonVariant[number];

export const buttonSize = ['xs', 'sm', 'md'] as const;
export type ButtonSize = typeof buttonSize[number];

// ─── Badge Variants ───────────────────────────────────────────────────────────
export const badgeVariant = ['gold', 'teal', 'red', 'muted', 'blue'] as const;
export type BadgeVariant = typeof badgeVariant[number];

// ─── Toast Types ─────────────────────────────────────────────────────────────
export const toastType = ['success', 'error', 'info'] as const;
export type ToastType = typeof toastType[number];
