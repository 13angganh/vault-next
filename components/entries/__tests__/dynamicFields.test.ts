/**
 * components/entries/__tests__/dynamicFields.test.ts — Vault Next
 *
 * v1.10.0: field per kategori (default maupun custom) sekarang bisa
 * dikustomisasi pengguna lewat Pengaturan > Edit Kategori, mengganti
 * pendekatan lama FIELDS_BY_CAT yang murni hardcode statis. Test ini
 * memverifikasi mesin penggabungannya — getFieldsForCat() — bekerja
 * benar di setiap kombinasi: ada/tidaknya override, kategori default
 * vs custom, dan field bawaan vs kustom.
 */

import { describe, it, expect } from 'vitest';
import { getFieldsForCat, getBuiltinFieldsForCat } from '../EntryForm';
import type { CustomCategory, CategoryFieldDef } from '@/lib/types';

describe('getFieldsForCat — kategori DEFAULT tanpa override (v1.10.0)', () => {
  it('mengembalikan field bawaan asli saat belum ada override sama sekali', () => {
    const fields = getFieldsForCat('sosmed', [], {});
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.every((f) => !f.isCustom)).toBe(true);
  });

  it('kategori email memuat field emailAddr sebagai field pertama (perilaku lama tidak berubah)', () => {
    const fields = getFieldsForCat('email', [], {});
    expect(fields[0].key).toBe('emailAddr');
  });
});

describe('getFieldsForCat — kategori DEFAULT dengan override (v1.10.0)', () => {
  it('memakai override, bukan field bawaan, saat override ada isinya', () => {
    const override: CategoryFieldDef[] = [
      { key: 'user', label: 'Username Kustom' },
      { key: 'custom_meja', label: 'Nomor Meja', type: 'text' },
    ];
    const fields = getFieldsForCat('sosmed', [], { sosmed: override });
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('Username Kustom');
    expect(fields[1].label).toBe('Nomor Meja');
  });

  it('field custom_ (bukan properti VaultEntry asli) ditandai isCustom: true', () => {
    const override: CategoryFieldDef[] = [
      { key: 'custom_meja', label: 'Nomor Meja', type: 'text' },
    ];
    const fields = getFieldsForCat('sosmed', [], { sosmed: override });
    expect(fields[0].isCustom).toBe(true);
  });

  it('field bawaan (mis. "user") di dalam override tetap ditandai isCustom: false', () => {
    const override: CategoryFieldDef[] = [
      { key: 'user', label: 'Username Kustom' },
    ];
    const fields = getFieldsForCat('sosmed', [], { sosmed: override });
    expect(fields[0].isCustom).toBe(false);
  });

  it('override kategori LAIN tidak memengaruhi kategori yang tidak di-override', () => {
    const override: CategoryFieldDef[] = [{ key: 'user', label: 'X' }];
    const fields = getFieldsForCat('bank', [], { sosmed: override });
    // bank tidak di-override -> tetap field bawaan bank
    expect(fields.every((f) => !f.isCustom)).toBe(true);
  });

  it('override berupa array kosong TIDAK dipakai — fallback ke field bawaan (bukan form kosong)', () => {
    const fields = getFieldsForCat('sosmed', [], { sosmed: [] });
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.every((f) => !f.isCustom)).toBe(true);
  });

  it('type "password" pada field override otomatis mendapat sensitive+mono', () => {
    const override: CategoryFieldDef[] = [
      { key: 'custom_pin', label: 'PIN Kustom', type: 'password' },
    ];
    const fields = getFieldsForCat('sosmed', [], { sosmed: override });
    expect(fields[0].sensitive).toBe(true);
    expect(fields[0].mono).toBe(true);
  });
});

describe('getFieldsForCat — kategori CUSTOM (v1.10.0)', () => {
  const catNoFields: CustomCategory = {
    id: 'cat_1', label: 'Server', emoji: 'Database', iconKey: 'Database',
  };
  const catWithFields: CustomCategory = {
    id: 'cat_2', label: 'Router', emoji: 'Wifi', iconKey: 'Wifi',
    fields: [
      { key: 'custom_ip', label: 'IP Gateway', type: 'text' },
      { key: 'pass', label: 'Password Admin', type: 'password' },
    ],
  };

  it('kategori custom TANPA fields (dibuat sebelum fitur ini) fallback ke field "lainnya"', () => {
    const fields = getFieldsForCat('cat_1', [catNoFields], {});
    const lainnyaFields = getFieldsForCat('lainnya', [], {});
    expect(fields.map((f) => f.key)).toEqual(lainnyaFields.map((f) => f.key));
  });

  it('kategori custom DENGAN fields memakai field kustomnya sendiri', () => {
    const fields = getFieldsForCat('cat_2', [catWithFields], {});
    expect(fields).toHaveLength(2);
    expect(fields[0].key).toBe('custom_ip');
    expect(fields[0].isCustom).toBe(true);
    expect(fields[1].key).toBe('pass');
    expect(fields[1].isCustom).toBe(false);
  });

  it('catId yang sama sekali tidak ditemukan (bukan default, bukan di customCats) fallback ke "lainnya"', () => {
    const fields = getFieldsForCat('cat_tidak_ada', [catWithFields], {});
    const lainnyaFields = getFieldsForCat('lainnya', [], {});
    expect(fields.map((f) => f.key)).toEqual(lainnyaFields.map((f) => f.key));
  });
});

describe('getBuiltinFieldsForCat (v1.10.0)', () => {
  it('mengembalikan field bawaan kategori default dalam bentuk CategoryFieldDef', () => {
    const fields = getBuiltinFieldsForCat('email');
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]).toHaveProperty('key');
    expect(fields[0]).toHaveProperty('label');
    // CategoryFieldDef TIDAK punya sensitive/mono/isCustom — itu murni
    // properti FieldDef lokal EntryForm, bukan bentuk tersimpan.
    expect(fields[0]).not.toHaveProperty('sensitive');
    expect(fields[0]).not.toHaveProperty('isCustom');
  });

  it('kategori custom (bukan default) mengembalikan array kosong', () => {
    expect(getBuiltinFieldsForCat('cat_random_custom_id')).toEqual([]);
  });

  it('hasil getBuiltinFieldsForCat konsisten dipakai ulang ke getFieldsForCat sebagai override', () => {
    const builtin = getBuiltinFieldsForCat('sosmed');
    const viaOverride = getFieldsForCat('sosmed', [], { sosmed: builtin });
    const viaDefault = getFieldsForCat('sosmed', [], {});
    expect(viaOverride.map((f) => f.key)).toEqual(viaDefault.map((f) => f.key));
  });
});
