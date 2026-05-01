/**
 * lib/design-tokens.ts — Vault Next
 * Single source of truth untuk semua design tokens.
 * Nilai di sini harus sinkron dengan styles/tokens.css.
 * Gunakan file ini untuk TypeScript consumers (generate-tokens.ts, tests, dll).
 *
 * M-04 — Sesi B
 */

// ─── Type Scale ───────────────────────────────────────────────────────────────
export const fontSize = {
  xs:   '10px',
  sm:   '12px',
  base: '14px',
  md:   '16px',
  lg:   '18px',
  xl:   '22px',
  '2xl':'28px',
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
export const fontFamily = {
  sans: "'Outfit', sans-serif",
  mono: "'JetBrains Mono', monospace",
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
export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',
  '2xl':'28px',
  full: '9999px',
} as const;
export type Radius = keyof typeof radius;

// ─── Transitions ─────────────────────────────────────────────────────────────
export const ease = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out:     'cubic-bezier(0, 0, 0.2, 1)',
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
  appbarHeight:  '56px',
  contentMax:    '960px',
  modalWidth:    '480px',
  modalWidthSm:  '360px',
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
