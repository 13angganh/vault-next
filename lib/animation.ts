/**
 * lib/animation.ts — Vault Next
 * Konstanta durasi animasi terpusat untuk Framer Motion.
 * CSS transition token (--transition-fast: 150ms, dst) tidak bisa dibaca
 * oleh Framer Motion secara langsung karena bekerja di JS runtime.
 * File ini menjadi sumber kebenaran tunggal untuk semua duration/ease di TSX.
 *
 * v1.4.0: konsolidasi dari nilai literal tersebar (0.12, 0.22, 0.3, dst)
 */

/** Durasi dalam detik (unit Framer Motion) */
export const DUR = {
  /** 120ms — tap feedback, icon toggle (sangat cepat, instan) */
  tap:    0.12,
  /** 150ms — fast transition (= --transition-fast) */
  fast:   0.15,
  /** 200ms — normal transition, card expand header */
  normal: 0.20,
  /** 220ms — body expand/collapse (AnimatePresence height) */
  expand: 0.22,
  /** 300ms — emphasis animation (star wiggle, success state) */
  emph:   0.30,
} as const;

/** Easing presets — gunakan string (TypeScript-safe untuk Framer Motion 12) */
export const EASE = {
  /** Ease default untuk sebagian besar transisi */
  out:       'easeOut'     as const,
  /** Ease in-out untuk expand/collapse */
  inOut:     'easeInOut'   as const,
  /** Spring feel — untuk tombol dan interactive elements */
  spring:    [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Cubic out — untuk modal masuk */
  cubicOut:  [0, 0, 0.2, 1]        as [number, number, number, number],
} as const;
