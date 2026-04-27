'use client';

import { useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { ShieldOff, Search as SearchIcon, Trash2, Lock, X } from 'lucide-react';
import { verifyPinAndGetMaster } from '@/lib/vaultService';
import { useAppStore }       from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { EntryCard }         from '@/components/entries/EntryCard';
import { DetailView }        from '@/components/entries/DetailView';
import { EntryForm }         from '@/components/entries/EntryForm';
import { useToast }          from '@/components/ui/Toast';
import type { VaultEntry }   from '@/lib/types';

export interface VaultListViewRef {
  openAddForm: () => void;
}

interface VaultListViewProps {
  onGlobalLoading?: (v: boolean) => void;
}

export const VaultListView = forwardRef<VaultListViewRef, VaultListViewProps>(
  function VaultListView({ onGlobalLoading: _ }, ref) {
    const vault         = useAppStore((s) => s.vault);
    const recycleBin    = useAppStore((s) => s.recycleBin);
    const customCats    = useAppStore((s) => s.customCats);
    const currentFilter = useAppStore((s) => s.currentFilter);
    const searchQuery   = useAppStore((s) => s.searchQuery);

    const [detailEntry,      setDetailEntry]      = useState<VaultEntry | null>(null);
    const [editEntry,        setEditEntry]        = useState<VaultEntry | null>(null);
    const [showAddForm,      setShowAddForm]      = useState(false);
    const [unlockEntry,      setUnlockEntry]      = useState<VaultEntry | null>(null);
    const [unlockInput,      setUnlockInput]      = useState('');
    const [unlockError,      setUnlockError]      = useState('');
    const [unlockLoading,    setUnlockLoading]    = useState(false);

    const { showToast, ToastContainer } = useToast();

    useImperativeHandle(ref, () => ({
      openAddForm: () => setShowAddForm(true),
    }));

    const allCats = useMemo(() => [
      ...DEFAULT_CATEGORIES,
      ...customCats.map((c) => ({ id: c.id, label: c.label })),
    ], [customCats]);

    const filterLabel = useMemo(() => {
      if (currentFilter === 'all') return 'Semua Entri';
      if (currentFilter === 'fav') return 'Favorit';
      if (currentFilter === 'bin') return 'Tong Sampah';
      const cat = allCats.find((c) => c.id === currentFilter);
      return cat ? cat.label : currentFilter;
    }, [currentFilter, allCats]);

    const isRecycleBin = currentFilter === 'bin';

    const entries = useMemo(() => {
      let list = isRecycleBin ? recycleBin : vault;
      if (currentFilter === 'fav') list = vault.filter((e) => e.fav);
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

    const handleCopy    = useCallback((_t: string, label: string) => showToast(`${label} disalin!`), [showToast]);

    const handleUnlockSubmit = useCallback(async () => {
      if (!unlockEntry || !unlockInput.trim()) return;
      setUnlockLoading(true);
      setUnlockError('');
      try {
        const store = useAppStore.getState();
        // Verifikasi: cek apakah input cocok dengan masterPw atau PIN
        let valid = false;
        if (unlockInput === store.masterPw) {
          valid = true;
        } else {
          // Coba verifikasi PIN
          try {
            await verifyPinAndGetMaster(unlockInput);
            valid = true;
          } catch {
            valid = false;
          }
        }
        if (!valid) {
          setUnlockError('PIN atau master password salah');
          setUnlockLoading(false);
          return;
        }
        // Unlock: hapus entry dari lockedIds
        store.setLockedIds(store.lockedIds.filter((id) => id !== unlockEntry.id));
        setUnlockEntry(null);
        setUnlockInput('');
        setUnlockError('');
      } catch {
        setUnlockError('Gagal memverifikasi, coba lagi');
      } finally {
        setUnlockLoading(false);
      }
    }, [unlockEntry, unlockInput]);
    const handleEdit    = useCallback((entry: VaultEntry) => { setDetailEntry(null); setEditEntry(entry); }, []);
    const handleSaved   = useCallback(() => showToast('Entri disimpan'), [showToast]);

    // Jika form aktif → tampilkan form penuh, menggantikan list
    if (showAddForm) {
      return (
        <EntryForm
          onClose={() => setShowAddForm(false)}
          onSaved={handleSaved}
        />
      );
    }
    if (editEntry) {
      return (
        <EntryForm
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={handleSaved}
        />
      );
    }

    return (
      <>
        {/* ── Header: sticky, tidak ikut scroll ── */}
        <div className="vault-list-header">
          <h2 className="vault-list-title">{filterLabel}</h2>
          <p className="vault-list-subtitle">
            {searchQuery
              ? `${entries.length} hasil untuk "${searchQuery}"`
              : `${entries.length} entri`}
          </p>
        </div>

        {/* ── Entries: scroll mandiri ── */}
        <div className="vault-entries-scroll">
          {entries.length === 0 ? (
            <div className="vault-empty">
              <div className="vault-empty__icon">
                {searchQuery
                  ? <SearchIcon size={40} strokeWidth={1.3} />
                  : currentFilter === 'bin'
                    ? <Trash2 size={40} strokeWidth={1.3} />
                    : <ShieldOff size={40} strokeWidth={1.3} />}
              </div>
              <p className="vault-empty__title">
                {searchQuery ? 'Tidak ada hasil'
                  : currentFilter === 'bin' ? 'Tong Sampah kosong'
                  : 'Belum ada entri'}
              </p>
              <p className="vault-empty__desc">
                {searchQuery
                  ? `Tidak ditemukan entri untuk "${searchQuery}"`
                  : currentFilter === 'bin' ? 'Entri yang dihapus akan muncul di sini'
                  : 'Tap + untuk menambahkan entri baru'}
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
                  onRequestUnlock={(e) => { setUnlockEntry(e); setUnlockInput(''); setUnlockError(''); }}
                />
              ))}
            </div>
          )}
        </div>

        <ToastContainer />

        {/* ── Unlock Modal — di root VaultListView, bebas dari overflow clip ── */}
        {unlockEntry && (
          <div
            className="vl-unlock-overlay"
            onClick={() => { setUnlockEntry(null); setUnlockInput(''); setUnlockError(''); }}
          >
            <div className="vl-unlock-card" onClick={(e) => e.stopPropagation()}>
              <div className="vl-unlock-header">
                <Lock size={20} style={{ color: 'var(--gold)' }} />
                <span className="vl-unlock-title">Buka Entri</span>
                <button className="vl-unlock-close" onClick={() => { setUnlockEntry(null); setUnlockInput(''); }}>
                  <X size={16} />
                </button>
              </div>
              <p className="vl-unlock-name">{unlockEntry.name}</p>
              <p className="vl-unlock-desc">Masukkan PIN atau Master Password</p>
              <input
                type="password"
                className="input vl-unlock-input"
                placeholder="PIN atau Master Password"
                value={unlockInput}
                autoFocus
                onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlockSubmit();
                  if (e.key === 'Escape') { setUnlockEntry(null); setUnlockInput(''); }
                }}
                disabled={unlockLoading}
              />
              {unlockError && <p className="vl-unlock-error">{unlockError}</p>}
              <div className="vl-unlock-actions">
                <button className="btn btn--ghost"
                  onClick={() => { setUnlockEntry(null); setUnlockInput(''); setUnlockError(''); }}
                  disabled={unlockLoading}>
                  Batal
                </button>
                <button className="btn btn--primary"
                  onClick={handleUnlockSubmit}
                  disabled={unlockLoading || !unlockInput.trim()}>
                  {unlockLoading ? 'Memverifikasi…' : 'Buka'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: render di luar scroll area (fixed overlay) ── */}
        {detailEntry && (
          <DetailView
            entry={detailEntry}
            onClose={() => setDetailEntry(null)}
            onEdit={handleEdit}
            onCopy={handleCopy}
          />
        )}


      </>
    );
  }
);
