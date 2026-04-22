'use client';

/**
 * Vault Next — VaultListView
 * View daftar entri vault dengan EntryCard sesungguhnya.
 * Sesi 4: EntryCard, copy feedback, detail modal, edit flow.
 */

import { useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { useAppStore }    from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { EntryCard }      from '@/components/entries/EntryCard';
import { DetailView }     from '@/components/entries/DetailView';
import { EntryForm }      from '@/components/entries/EntryForm';
import { useToast }       from '@/components/ui/Toast';
import type { VaultEntry } from '@/lib/types';

export interface VaultListViewRef {
  openAddForm: () => void;
}

export const VaultListView = forwardRef<VaultListViewRef>(function VaultListView(_props, ref) {
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);
  const currentFilter = useAppStore((s) => s.currentFilter);
  const searchQuery   = useAppStore((s) => s.searchQuery);

  const [detailEntry, setDetailEntry] = useState<VaultEntry | null>(null);
  const [editEntry,   setEditEntry]   = useState<VaultEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Expose openAddForm to parent (AppShell → Header + Tambah button)
  useImperativeHandle(ref, () => ({
    openAddForm: () => setShowAddForm(true),
  }));

  const allCats = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ], [customCats]);

  const filterLabel = useMemo(() => {
    if (currentFilter === 'all')  return 'Semua Entri';
    if (currentFilter === 'fav')  return '⭐ Favorit';
    if (currentFilter === 'bin')  return '🗑️ Recycle Bin';
    const cat = allCats.find((c) => c.id === currentFilter);
    return cat ? `${cat.emoji} ${cat.label}` : currentFilter;
  }, [currentFilter, allCats]);

  const isRecycleBin = currentFilter === 'bin';

  const entries = useMemo(() => {
    let list = isRecycleBin ? recycleBin : vault;
    if (currentFilter === 'fav')  list = vault.filter((e) => e.fav);
    else if (currentFilter !== 'all' && currentFilter !== 'bin') {
      list = vault.filter((e) => e.cat === currentFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        (e.user ?? '').toLowerCase().includes(q) ||
        (e.url ?? '').toLowerCase().includes(q) ||
        (e.note ?? '').toLowerCase().includes(q) ||
        (e.wifiSSID ?? '').toLowerCase().includes(q) ||
        (e.cardHolder ?? '').toLowerCase().includes(q) ||
        (e.emailAddr ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [vault, recycleBin, currentFilter, searchQuery, isRecycleBin]);

  const handleCopy = useCallback((_text: string, label: string) => {
    showToast(`${label} disalin!`);
  }, [showToast]);

  const handleEdit = useCallback((entry: VaultEntry) => {
    setDetailEntry(null);
    setEditEntry(entry);
  }, []);

  const handleSaved = useCallback(() => {
    showToast('Entri disimpan ✓');
  }, [showToast]);

  return (
    <div className="vault-list-view">
      <div className="vault-list-header">
        <h2 className="vault-list-title">{filterLabel}</h2>
        <p className="vault-list-subtitle">
          {searchQuery
            ? `${entries.length} hasil untuk "${searchQuery}"`
            : `${entries.length} entri`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="vault-empty">
          <div className="vault-empty__icon">
            {searchQuery ? '🔍' : currentFilter === 'bin' ? '🗑️' : '🔐'}
          </div>
          <p className="vault-empty__title">
            {searchQuery ? 'Tidak ada hasil'
              : currentFilter === 'bin' ? 'Recycle Bin kosong'
              : 'Belum ada entri'}
          </p>
          <p className="vault-empty__desc">
            {searchQuery
              ? `Tidak ditemukan entri untuk "${searchQuery}"`
              : currentFilter === 'bin' ? 'Entri yang dihapus akan muncul di sini'
              : 'Tap + Tambah untuk menambahkan entri baru'}
          </p>
        </div>
      ) : (
        <div className="vault-entries">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isRecycleBin={isRecycleBin}
              onEdit={handleEdit}
              onDetail={(e) => setDetailEntry(e)}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      <ToastContainer />

      {detailEntry && (
        <DetailView
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={handleEdit}
          onCopy={handleCopy}
        />
      )}

      {editEntry && (
        <EntryForm
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={handleSaved}
        />
      )}

      {showAddForm && (
        <EntryForm
          onClose={() => setShowAddForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
});
