/**
 * lib/__tests__/utils.test.ts — Vault Next
 *
 * v1.10.0: isCategoryLocked diekstrak dari CategoryManager.tsx sebagai
 * pure function. Alasan ekstraksi: guard proteksi kunci kategori
 * (`if (isCategoryLocked(...)) return;` di dalam openEdit/handleDelete)
 * TIDAK BISA diuji lewat interaksi UI — React mencegah onClick
 * terpanggil sama sekali pada elemen dengan prop disabled=true
 * (dikonfirmasi: menghapus atribut disabled dari DOM secara manual
 * dalam test tidak mengubah perilaku ini, karena React melacak status
 * disabled dari prop render, bukan atribut DOM). Tanpa ekstraksi ini,
 * guard di dalam handler hanya "kode defensif yang terlihat diuji"
 * lewat test UI yang sebenarnya berhenti di lapis disabled attribute
 * dan tidak pernah benar-benar mengeksekusi baris guard-nya sendiri.
 * Diekstrak sebagai pure function agar bisa dipanggil & diuji langsung.
 */

import { describe, it, expect } from 'vitest';
import { isCategoryLocked } from '../utils';

describe('isCategoryLocked (v1.10.0)', () => {
  it('mengembalikan true jika catId ada di lockedCatIds', () => {
    expect(isCategoryLocked('sosmed', ['sosmed', 'bank'])).toBe(true);
  });

  it('mengembalikan false jika catId TIDAK ada di lockedCatIds', () => {
    expect(isCategoryLocked('email', ['sosmed', 'bank'])).toBe(false);
  });

  it('mengembalikan false untuk lockedCatIds kosong', () => {
    expect(isCategoryLocked('sosmed', [])).toBe(false);
  });

  it('bekerja untuk kategori custom (ID bebas, bukan hanya kategori default)', () => {
    expect(isCategoryLocked('cat_1234567890', ['cat_1234567890'])).toBe(true);
    expect(isCategoryLocked('cat_lain', ['cat_1234567890'])).toBe(false);
  });

  it('case-sensitive — "Sosmed" bukan kategori terkunci yang sama dengan "sosmed"', () => {
    expect(isCategoryLocked('Sosmed', ['sosmed'])).toBe(false);
  });
});
