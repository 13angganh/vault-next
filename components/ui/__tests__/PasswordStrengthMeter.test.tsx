/**
 * components/ui/__tests__/PasswordStrengthMeter.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Spesifikasi level (komentar di PasswordStrengthMeter.tsx):
 *   0 kosong · 1 <6 char · 2 <8 char atau 1 tipe · 3 ≥8 char 2 tipe · 4 ≥8 char 3 tipe ·
 *   5 ≥10 char 3 tipe · 6 ≥12 char 4 tipe · 7 ≥16 char 4 tipe.
 * TEMUAN Tahap 4 (bug lama sejak v1.x, file identik v1.11.0): level 5 "Kuat" TIDAK PERNAH
 * tercapai karena cabang level 4 (`len >= 8 && types === 3`) mendahului cabang level 5.
 * Test "10 karakter 3 tipe = level 5" adalah test regresinya.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calcStrength, PasswordStrengthMeter } from '../PasswordStrengthMeter';

describe('calcStrength — level sesuai spesifikasi', () => {
  const kasus: Array<[string, string, number, string]> = [
    ['kosong', '', 0, ''],
    ['5 karakter', 'abcde', 1, 'Sangat Lemah'],
    ['6 karakter 1 tipe', 'abcdef', 2, 'Lemah'],
    ['6 karakter 2 tipe (masih <8)', 'abc123', 2, 'Lemah'],
    ['8 karakter 1 tipe', 'abcdefgh', 2, 'Lemah'],
    ['8 karakter 2 tipe', 'abcd1234', 3, 'Cukup'],
    ['9 karakter 3 tipe', 'abcd1234X', 4, 'Sedang'],
    ['10 karakter 3 tipe', 'abcd1234XY', 5, 'Kuat'],
    ['12 karakter 3 tipe', 'abcd1234XYzw', 5, 'Kuat'],
    ['12 karakter 4 tipe', 'abcd1234XY!z', 6, 'Sangat Kuat'],
    ['15 karakter 4 tipe', 'abcd1234XY!zabc', 6, 'Sangat Kuat'],
    ['16 karakter 4 tipe', 'abcd1234XY!zabcd', 7, 'Luar Biasa'],
  ];
  it.each(kasus.map(([nama, pw, level, label]) => ({ nama, pw, level, label })))('$nama → level $level ($label)', ({ pw, level, label }) => {
    const r = calcStrength(pw);
    expect(r.level).toBe(level);
    expect(r.label).toBe(label);
  });

  it('batas bawah level 6 dan 7: 11 karakter 4 tipe belum "Sangat Kuat"; 15 karakter 4 tipe belum "Luar Biasa"', () => {
    expect(calcStrength('abcd1234X!z').level).toBeLessThan(6); // 11 karakter
    expect(calcStrength('abcd1234XY!zabc').level).toBeLessThan(7); // 15 karakter
  });

  it('warna mengikuti level lewat token --str-N (kosong = transparent)', () => {
    expect(calcStrength('').color).toBe('transparent');
    expect(calcStrength('abcde').color).toBe('var(--str-1)');
    expect(calcStrength('abcd1234').color).toBe('var(--str-3)');
    expect(calcStrength('abcd1234XY').color).toBe('var(--str-5)');
    expect(calcStrength('abcd1234XY!zabcd').color).toBe('var(--str-7)');
  });

  it('semakin kuat tidak pernah menurunkan level pada deret contoh yang menambah panjang/tipe satu per satu', () => {
    const deret = ['abcde', 'abcdefgh', 'abcd1234', 'abcd1234X', 'abcd1234XY', 'abcd1234XY!z', 'abcd1234XY!zabcd'];
    const levels = deret.map((p) => calcStrength(p).level);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });
});

describe('PasswordStrengthMeter — komponen', () => {
  it('password kosong → tidak merender apa pun', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('merender 7 batang; yang menyala sebanyak level; label ditampilkan', () => {
    const { container } = render(<PasswordStrengthMeter password="abcd1234XY" />); // level 5
    const bars = Array.from(container.querySelectorAll('.strength-meter__bar')) as HTMLElement[];
    expect(bars).toHaveLength(7);
    expect(bars.filter((b) => b.style.opacity === '1')).toHaveLength(5);
    expect(screen.getByText('Kuat')).toBeInTheDocument();
  });

  it('showLabel=false menyembunyikan label tetapi batang tetap tampil', () => {
    const { container } = render(<PasswordStrengthMeter password="abcd1234" showLabel={false} />);
    expect(screen.queryByText('Cukup')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.strength-meter__bar')).toHaveLength(7);
  });

  it('className tambahan diteruskan ke pembungkus', () => {
    const { container } = render(<PasswordStrengthMeter password="abcd1234" className="ekstra" />);
    expect(container.querySelector('.strength-meter')).toHaveClass('ekstra');
  });
});
