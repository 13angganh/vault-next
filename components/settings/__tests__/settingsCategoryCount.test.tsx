/**
 * components/settings/__tests__/settingsCategoryCount.test.tsx — Aurum Vault v2.0.0 (Tahap 3)
 *
 * Regresi temuan 6(g): kartu "Kategori" di Pengaturan menulis `customCats.length + 8` (literal),
 * sedangkan DEFAULT_CATEGORIES berisi 9 (termasuk Catatan) sehingga Pengaturan menampilkan
 * "8 kategori" padahal lencana Kelola Kategori menampilkan 9.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsView } from '../SettingsView';
import { useAppStore } from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';

describe('SettingsView — jumlah kategori', () => {
  beforeEach(() => { useAppStore.setState({ customCats: [], vault: [], recycleBin: [] }); });

  it('menghitung dari DEFAULT_CATEGORIES (bukan angka literal)', () => {
    render(<SettingsView />);
    expect(screen.getByText(`${DEFAULT_CATEGORIES.length} kategori`)).toBeInTheDocument();
  });
  it('menambahkan kategori kustom ke jumlah bawaan', () => {
    useAppStore.setState({ customCats: [{ id: 'c1', label: 'Kerja', icon: 'briefcase', color: 'var(--blue)' } as never] });
    render(<SettingsView />);
    expect(screen.getByText(`${DEFAULT_CATEGORIES.length + 1} kategori`)).toBeInTheDocument();
  });
});
