'use client';

import React, { useState, forwardRef, useImperativeHandle, useMemo, useCallback, useEffect } from 'react';
import { Search as SearchIcon, Trash2, Lock, X,
  Star, FolderOpen, PackageOpen, SortAsc, Check as CheckIcon,
} from 'lucide-react';
import { verifyPinAndGetMaster, saveVault } from '@/lib/vaultService';
import { Button, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui/primitives';
import { useAppStore }       from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { EntryCard }         from '@/components/entries/EntryCard';
import { DetailView }        from '@/components/entries/DetailView';
import { EntryForm }         from '@/components/entries/EntryForm';
import { useToast }          from '@/components/ui/Toast';
import type { VaultEntry }   from '@/lib/types';
import type { SortType }     from '@/lib/store/appStore';

export interface VaultListViewRef {
  openAddForm: () => void;
}

interface VaultListViewProps {
  isVaultLoading?: boolean;
}

/* ── Skeleton placeholder — 3 kartu saat vault sedang decrypt ── */
function VaultSkeletonList() {
  return (
    <div className="vault-entries vault-skeleton-list" aria-busy="true" aria-label="Memuat entri…">
      {[0, 1, 2].map((i) => (
        <div key={i} className="entry-card vault-skeleton-card">
          <div className="vault-skeleton-row">
            <Skeleton circle width={36} height={36} />
            <div className="vault-skeleton-text">
              <Skeleton width="55%" height={13} style={{ marginBottom: 6 }} />
              <Skeleton width="35%" height={10} />
            </div>
            <Skeleton width={16} height={16} style={{ borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export const VaultListView = forwardRef<VaultListViewRef, VaultListViewProps>(
  function VaultListView({ isVaultLoading = false }, ref) {
    const vault         = useAppStore((s) => s.vault);
    const recycleBin    = useAppStore((s) => s.recycleBin);
    const customCats    = useAppStore((s) => s.customCats);
    const currentFilter = useAppStore((s) => s.currentFilter);
    const searchQuery   = useAppStore((s) => s.searchQuery);
    const sortBy        = useAppStore((s) => s.sortBy);
    const setSortBy     = useAppStore((s) => s.setSortBy);

    const [detailEntry,      setDetailEntry]      = useState<VaultEntry | null>(null);
    const [editEntry,        setEditEntry]        = useState<VaultEntry | null>(null);
    const [showSortMenu,     setShowSortMenu]     = useState(false);
    const [activeFilter,     setActiveFilter]     = useState<'all'|'fav'|'locked'|'no_pass'>('all');
    const [confirmEmptyBin,  setConfirmEmptyBin]  = useState(false);
    const [showAddForm,      setShowAddForm]      = useState(false);
    const [unlockEntry,      setUnlockEntry]      = useState<VaultEntry | null>(null);
    const [unlockInput,      setUnlockInput]      = useState('');
    const [unlockError,      setUnlockError]      = useState('');
    const [unlockLoading,    setUnlockLoading]    = useState(false);
    // Skeleton muncul sebentar saat pertama load agar ada transisi halus
    const [showSkeleton,     setShowSkeleton]     = useState(isVaultLoading);

    useEffect(() => {
      if (isVaultLoading) {
        setShowSkeleton(true);
      } else {
        // Tunda sedikit agar animasi shimmer terlihat jika data sudah ada
        const t = setTimeout(() => setShowSkeleton(false), 300);
        return () => clearTimeout(t);
      }
    }, [isVaultLoading]);

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
      if (currentFilter === 'bin') return 'Sampah';
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
      // Quick filter
    if (activeFilter==='fav')     list=list.filter(e=>e.fav);
    if (activeFilter==='locked')  list=list.filter(e=>useAppStore.getState().lockedIds.includes(e.id));
    if (activeFilter==='no_pass') list=list.filter(e=>!e.pass&&!e.wifiPass&&!e.cardNo);
    // Sort
    const copy=[...list];
    switch(sortBy){
      case 'name_asc':  copy.sort((a,b)=>a.name.localeCompare(b.name,'id')); break;
      case 'name_desc': copy.sort((a,b)=>b.name.localeCompare(a.name,'id')); break;
      case 'newest':    copy.sort((a,b)=>(b.ts??0)-(a.ts??0)); break;
      case 'oldest':    copy.sort((a,b)=>(a.ts??0)-(b.ts??0)); break;
      case 'fav_first': copy.sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)); break;
      case 'cat_group':  copy.sort((a,b)=>a.cat.localeCompare(b.cat,'id')||a.name.localeCompare(b.name,'id')); break;
    }
    return copy;
    }, [vault, recycleBin, currentFilter, searchQuery, isRecycleBin, sortBy, activeFilter]);

    const handleCopy    = useCallback((_t: string, label: string) => showToast(`${label} disalin!`), [showToast]);

    const handleUnlockSubmit = useCallback(async () => {
      if (!unlockEntry || !unlockInput.trim()) return;
      setUnlockLoading(true);
      setUnlockError('');
      try {
        const store = useAppStore.getState();
        let valid = false;
        if (unlockInput === store.masterPw) {
          valid = true;
        } else {
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
        const newLockedIds = store.lockedIds.filter((id) => id !== unlockEntry.id);
        store.setLockedIds(newLockedIds);
        store.toggleExpanded(unlockEntry.id);
        // Simpan ke disk — tanpa ini, perubahan hilang saat app ditutup/dibuka lagi
        try {
          if (store.vaultMeta) {
            await saveVault(
              store.masterPw,
              store.vault,
              store.recycleBin,
              store.vaultMeta,
              store.customCats,
              newLockedIds,
            );
          }
        } catch {
          // Gagal simpan — rollback store agar konsisten dengan disk
          store.setLockedIds(store.lockedIds);
        }
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

    const handleEmptyBin = useCallback(async () => {
      const store = useAppStore.getState();
      store.setRecycleBin([]);
      if (store.autoSaveEnabled && store.vaultMeta) {
        try { await saveVault(store.masterPw,store.vault,[],store.vaultMeta,store.customCats,store.lockedIds); } catch {}
      }
      showToast('Sampah dikosongkan');
    }, [showToast]);

    /* ── Contextual empty state per filter ── */
    const renderEmptyState = () => {
      if (searchQuery) {
        return (
          <EmptyState
            icon={<SearchIcon size={40} strokeWidth={1.2} />}
            title="Tidak ada hasil"
            description={`Tidak ditemukan entri untuk "${searchQuery}"`}
          />
        );
      }
      if (currentFilter === 'bin') {
        return (
          <EmptyState
            icon={<Trash2 size={40} strokeWidth={1.2} />}
            title="Sampah kosong"
            description="Entri yang dihapus akan muncul di sini"
          />
        );
      }
      if (currentFilter === 'fav') {
        return (
          <EmptyState
            icon={<Star size={40} strokeWidth={1.2} />}
            title="Belum ada favorit"
            description="Tandai entri sebagai favorit untuk melihatnya di sini"
          />
        );
      }
      if (currentFilter !== 'all') {
        const cat = allCats.find((c) => c.id === currentFilter);
        return (
          <EmptyState
            icon={<FolderOpen size={40} strokeWidth={1.2} />}
            title={`Kategori ${cat?.label ?? currentFilter} kosong`}
            description="Tambahkan entri pertama di kategori ini"
            action={
              <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                + Tambah Entri
              </Button>
            }
          />
        );
      }
      return (
        <EmptyState
          icon={<PackageOpen size={40} strokeWidth={1.2} />}
          title="Vault masih kosong"
          description="Mulai simpan password dan data sensitif kamu dengan aman"
          action={
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              + Tambah Entri Pertama
            </Button>
          }
        />
      );
    };

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
          <div className="vault-list-header__top">
            <div>
              <h2 className="vault-list-title">{filterLabel}</h2>
              <p className="vault-list-subtitle">
                {searchQuery
                  ? `${entries.length} hasil untuk "${searchQuery}"`
                  : `${entries.length} entri`}
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              {/* Kosongkan sampah */}
              {isRecycleBin && recycleBin.length > 0 && (
                <button className="vault-empty-bin-btn" onClick={() => setConfirmEmptyBin(true)} aria-label="Kosongkan semua sampah">
                  Kosongkan
                </button>
              )}
              {/* Sort button */}
              {!isRecycleBin && (
                <div className="vault-sort-wrap">
                  <button className={`vault-sort-btn${showSortMenu?' vault-sort-btn--active':''}`}
                    onClick={() => setShowSortMenu(v=>!v)} aria-label="Urutkan entri">
                    <SortAsc size={14} />
                  </button>
                  {showSortMenu && (
                    <>
                      <div className="vault-sort-backdrop" onClick={() => setShowSortMenu(false)} />
                      <div className="vault-sort-menu">
                        {(['default','fav_first','name_asc','name_desc','newest','oldest','cat_group'] as SortType[]).map(val => {
                          const labels:Record<SortType,string>={default:'Default',fav_first:'Favorit dulu',name_asc:'Nama A–Z',name_desc:'Nama Z–A',newest:'Terbaru',oldest:'Terlama',cat_group:'Per Kategori'};
                          return (
                            <button key={val} className={`vault-sort-item${sortBy===val?' vault-sort-item--active':''}`}
                              onClick={()=>{setSortBy(val);setShowSortMenu(false);}}>
                              {sortBy===val && <CheckIcon size={12}/>}
                              {labels[val]}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Filter chips */}
          {!isRecycleBin && !searchQuery && (
            <div className="vault-filter-chips">
              {(['all','fav','locked','no_pass'] as const).map(val => {
                const labels={all:'Semua',fav:'★ Favorit',locked:'🔒 Terkunci',no_pass:'Tanpa Pass'};
                return (
                  <button key={val} className={`vault-chip${activeFilter===val?' vault-chip--active':''}`}
                    onClick={()=>setActiveFilter(val)}>
                    {labels[val]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Entries: scroll mandiri ── */}
        <div className="vault-entries-scroll">
          {showSkeleton ? (
            <VaultSkeletonList />
          ) : entries.length === 0 ? (
            <div className="vault-empty-wrap">
              {renderEmptyState()}
            </div>
          ) : (
            <div className="vault-entries">
              {sortBy === 'cat_group' ? (
                // Mode per kategori: tampilkan sub-header kategori di antara grup
                (() => {
                  const items: React.ReactNode[] = [];
                  let lastCat = '';
                  entries.forEach((entry) => {
                    if (entry.cat !== lastCat) {
                      const cat = allCats.find(c => c.id === entry.cat);
                      items.push(
                        <div key={`cat-${entry.cat}`} className="vault-cat-group-header">
                          <span className="vault-cat-group-label">{cat?.label ?? entry.cat}</span>
                        </div>
                      );
                      lastCat = entry.cat;
                    }
                    items.push(
                      <div className="vault-entry-item" key={entry.id}>
                        <EntryCard
                          entry={entry}
                          isRecycleBin={isRecycleBin}
                          onEdit={handleEdit}
                          onDetail={(e) => setDetailEntry(e)}
                          onCopy={handleCopy}
                          onRequestUnlock={(e) => { setUnlockEntry(e); setUnlockInput(''); setUnlockError(''); }}
                        />
                      </div>
                    );
                  });
                  return items;
                })()
              ) : (
                entries.map((entry) => (
                  <div className="vault-entry-item" key={entry.id}>
                    <EntryCard
                      entry={entry}
                      isRecycleBin={isRecycleBin}
                      onEdit={handleEdit}
                      onDetail={(e) => setDetailEntry(e)}
                      onCopy={handleCopy}
                      onRequestUnlock={(e) => { setUnlockEntry(e); setUnlockInput(''); setUnlockError(''); }}
                    />
                  </div>
                ))
              )}
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
                <Button variant="ghost"
                  onClick={() => { setUnlockEntry(null); setUnlockInput(''); setUnlockError(''); }}
                  disabled={unlockLoading}>
                  Batal
                </Button>
                <Button variant="primary"
                  onClick={handleUnlockSubmit}
                  loading={unlockLoading}
                  disabled={unlockLoading || !unlockInput.trim()}>
                  {unlockLoading ? 'Memverifikasi…' : 'Buka'}
                </Button>
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

      <ConfirmDialog
        open={confirmEmptyBin}
        onCancel={() => setConfirmEmptyBin(false)}
        onConfirm={() => { setConfirmEmptyBin(false); handleEmptyBin(); }}
        title="Kosongkan Semua Sampah?"
        message={`${recycleBin.length} entri akan dihapus permanen dan tidak bisa dipulihkan.`}
        confirmLabel="Kosongkan Semua"
        variant="danger"
      />

      </>
    );
  }
);
