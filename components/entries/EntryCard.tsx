'use client';

/**
 * Vault Next — EntryCard
 * Diperbaiki: Menggunakan createPortal untuk Unlock Overlay agar tidak terpotong (Stacking Context bebas).
 */

import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Lock, Unlock, Star, RotateCcw, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useAppStore }      from '@/lib/store/appStore';
import { saveVault }         from '@/lib/vaultService';
import { CategoryIcon }      from '@/components/entries/CategoryIcon';
import type { VaultEntry }   from '@/lib/types';

interface EntryCardProps {
  entry:         VaultEntry;
  isRecycleBin?: boolean;
  onEdit?:       (entry: VaultEntry) => void;
  onDetail?:     (entry: VaultEntry) => void;
  onCopy?:       (text: string, label: string) => void;
}

export function EntryCard({
  entry,
  isRecycleBin = false,
  onEdit,
  onDetail,
  onCopy,
}: EntryCardProps) {
  const store       = useAppStore();
  const customCats  = store.customCats;
  const lockedIds   = store.lockedIds;
  const expandedIds = store.expandedIds;
  const pwVisible   = store.pwVisible;
  const seedVisible = store.seedVisible;

  const isLocked   = lockedIds.includes(entry.id);
  const isExpanded = expandedIds.includes(entry.id);

  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [unlockInput,      setUnlockInput]      = useState('');
  const [unlockError,      setUnlockError]      = useState('');
  const [unlockLoading,    setUnlockLoading]    = useState(false);
  const [mounted,          setMounted]          = useState(false);
  const unlockRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showUnlockPrompt && unlockRef.current) {
      unlockRef.current.focus();
    }
  }, [showUnlockPrompt]);

  const handleToggleExpand = () => {
    if (isLocked && !isExpanded) {
      setShowUnlockPrompt(true);
      return;
    }
    store.toggleExpanded(entry.id);
  };

  const handleUnlockEntry = async () => {
    if (!unlockInput.trim()) return;
    setUnlockLoading(true);
    setUnlockError('');

    try {
      const { verifyPin, hasPinSetup } = await import('@/lib/vaultService');
      let ok = false;

      if (hasPinSetup()) {
        ok = await verifyPin(unlockInput);
      }
      if (!ok && unlockInput === store.masterPw) {
        ok = true;
      }

      if (ok) {
        setShowUnlockPrompt(false);
        setUnlockInput('');
        store.toggleExpanded(entry.id);
      } else {
        setUnlockError('PIN atau password salah');
      }
    } catch {
      setUnlockError('Terjadi kesalahan');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleFav = async () => {
    const updated = store.vault.map((e) =>
      e.id === entry.id ? { ...e, fav: !e.fav } : e,
    );
    store.setVault(updated);
    if (store.autoSaveEnabled) {
      await saveVault(store.masterPw, updated, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds);
    }
  };

  const handleDelete = async () => {
    if (isRecycleBin) {
      const updated = store.recycleBin.filter((e) => e.id !== entry.id);
      store.setRecycleBin(updated);
      if (store.autoSaveEnabled) {
        await saveVault(store.masterPw, store.vault, updated, store.vaultMeta!, store.customCats, store.lockedIds);
      }
    } else {
      const newVault = store.vault.filter((e) => e.id !== entry.id);
      const newBin   = [...store.recycleBin, { ...entry, ts: Date.now() }];
      store.setVault(newVault);
      store.setRecycleBin(newBin);
      if (store.autoSaveEnabled) {
        await saveVault(store.masterPw, newVault, newBin, store.vaultMeta!, store.customCats, store.lockedIds);
      }
    }
  };

  const handleRestore = async () => {
    const newBin   = store.recycleBin.filter((e) => e.id !== entry.id);
    const newVault = [...store.vault, { ...entry }];
    store.setRecycleBin(newBin);
    store.setVault(newVault);
    if (store.autoSaveEnabled) {
      await saveVault(store.masterPw, newVault, newBin, store.vaultMeta!, store.customCats, store.lockedIds);
    }
  };

  const handleToggleLock = async () => {
    store.toggleLockedId(entry.id);
    if (!lockedIds.includes(entry.id) && isExpanded) {
      store.toggleExpanded(entry.id);
    }
    if (store.autoSaveEnabled) {
      const newLocked = lockedIds.includes(entry.id)
        ? lockedIds.filter((id) => id !== entry.id)
        : [...lockedIds, entry.id];
      await saveVault(store.masterPw, store.vault, store.recycleBin, store.vaultMeta!, store.customCats, newLocked);
    }
  };

  const copy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      onCopy?.(text, label);
    });
  };

  const pwShow   = pwVisible[entry.id]   ?? false;
  const seedShow = seedVisible[entry.id] ?? false;

  const Field = ({ label, value, sensitive = false, isVisible, onToggleVisible, mono = false }: any) => {
    if (!value) return null;
    const display = sensitive && !isVisible ? '••••••••' : value;
    return (
      <div className="entry-field">
        <span className="entry-field__label">{label}</span>
        <div className="entry-field__row">
          <span className={`entry-field__value ${mono ? 'mono' : ''}`}>{display}</span>
          <div className="entry-field__actions">
            {sensitive && (
              <button className="entry-field__btn" onClick={onToggleVisible} title={isVisible ? 'Sembunyikan' : 'Tampilkan'}>
                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button className="entry-field__btn" onClick={() => copy(value, label)} title={`Salin ${label}`}>
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SeedField = () => {
    if (!entry.seedPhrase?.length) return null;
    const words = entry.seedPhrase;
    return (
      <div className="entry-field">
        <span className="entry-field__label">Seed Phrase</span>
        {seedShow ? (
          <div className="entry-seed-grid">
            {words.map((w, i) => (
              <span key={i} className="entry-seed-word mono">
                <span className="entry-seed-word__num">{i + 1}.</span> {w}
              </span>
            ))}
          </div>
        ) : (
          <span className="entry-field__value">{'•'.repeat(Math.min(words.length * 4, 32))}</span>
        )}
        <div className="entry-field__actions entry-field__actions--seed">
          <button className="entry-field__btn" onClick={() => store.toggleSeedVisible(entry.id)}>
            {seedShow ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {seedShow && (
            <button className="entry-field__btn" onClick={() => copy(words.join(' '), 'Seed Phrase')}>
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFields = () => {
    switch (entry.cat) {
      case 'crypto':
        return <>
          <Field label="Username"         value={entry.user} />
          <Field label="Password"         value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="Network"          value={entry.network} />
          <Field label="Alamat Wallet"    value={entry.walletAddr} mono />
          <Field label="Password Wallet"  value={entry.walletPw} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <SeedField />
          <Field label="URL"              value={entry.url} />
          <Field label="Catatan"          value={entry.note} />
        </>;
      case 'kartu':
        return <>
          <Field label="Nomor Kartu"  value={entry.cardNo}     sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="Nama Pemegang" value={entry.cardHolder} />
          <Field label="Masa Berlaku" value={entry.cardExpiry} />
          <Field label="CVV"          value={entry.cardCVV}    sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="PIN"          value={entry.pass}       sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="Catatan"      value={entry.note} />
        </>;
      case 'wifi':
        return <>
          <Field label="Nama Jaringan (SSID)" value={entry.wifiSSID ?? entry.user} />
          <Field label="Password Wi-Fi"       value={entry.wifiPass ?? entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="Catatan"              value={entry.note} />
        </>;
      case 'bank':
        return <>
          <Field label="Username / No. Rekening" value={entry.user} />
          <Field label="Password"                value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="URL"                     value={entry.url} />
          <Field label="Catatan"                 value={entry.note} />
        </>;
      case 'email':
        return <>
          <Field label="Alamat Email"   value={entry.emailAddr ?? entry.user} />
          <Field label="Username"       value={entry.emailAddr ? entry.user : undefined} />
          <Field label="Password"       value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="URL"            value={entry.url} />
          <Field label="Catatan"        value={entry.note} />
        </>;
      default:
        return <>
          <Field label="Username" value={entry.user} />
          <Field label="Password" value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <Field label="URL"      value={entry.url} />
          <Field label="Catatan"  value={entry.note} />
        </>;
    }
  };

  const subLabel = (() => {
    if (entry.cat === 'wifi')  return entry.wifiSSID ?? entry.user ?? '';
    if (entry.cat === 'kartu') return entry.cardHolder ?? '';
    if (entry.cat === 'email') return entry.emailAddr ?? entry.user ?? '';
    return entry.user ?? entry.url ?? '';
  })();

  return (
    <div className={`entry-card ${isExpanded ? 'entry-card--expanded' : ''} ${isLocked ? 'entry-card--locked' : ''} ${isRecycleBin ? 'entry-card--bin' : ''}`} data-id={entry.id}>
      <div className="entry-card__header" onClick={handleToggleExpand} role="button" tabIndex={0} aria-expanded={isExpanded} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleExpand(); } }}>
        <CategoryIcon catId={entry.cat} customCats={customCats} size="md" />
        <div className="entry-card__title-wrap">
          <span className="entry-card__name">{entry.name}</span>
          {subLabel && <span className="entry-card__sub">{subLabel}</span>}
        </div>
        <div className="entry-card__badges">
          {entry.fav && <span className="entry-card__fav"><Star size={12} fill="currentColor" /></span>}
          {isLocked  && <span className="entry-card__lock-badge"><Lock size={12} /></span>}
        </div>
        <span className={`entry-card__chevron ${isExpanded ? 'entry-card__chevron--up' : ''}`} aria-hidden="true">›</span>
      </div>

      {isExpanded && (
        <div className="entry-card__body-wrap">
          <div className="entry-card__body-inner">
            <div className="entry-card__body">
              <div className="entry-card__fields">{renderFields()}</div>
              <div className="entry-card__actions">
                {!isRecycleBin && onEdit && (
                  <button className="entry-action-btn entry-action-btn--edit" onClick={() => onEdit(entry)}><Pencil size={13} /> Edit</button>
                )}
                {!isRecycleBin && (
                  <button className="entry-action-btn entry-action-btn--lock" onClick={handleToggleLock}>
                    {isLocked ? <><Unlock size={13} /> Lepas</> : <><Lock size={13} /> Kunci</>}
                  </button>
                )}
                {!isRecycleBin && (
                  <button className={`entry-action-btn entry-action-btn--fav ${entry.fav ? 'entry-action-btn--fav-active' : ''}`} onClick={handleFav}>
                    <Star size={13} fill={entry.fav ? 'currentColor' : 'none'} /> Favorit
                  </button>
                )}
                {isRecycleBin && (
                  <button className="entry-action-btn entry-action-btn--restore" onClick={handleRestore}><RotateCcw size={13} /> Pulihkan</button>
                )}
                <button className="entry-action-btn entry-action-btn--delete" onClick={handleDelete}>
                  <Trash2 size={13} /> {isRecycleBin ? 'Hapus Permanen' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REACT PORTAL: Modal dikirim ke root agar tidak terpotong parent list */}
      {showUnlockPrompt && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" onClick={() => { setShowUnlockPrompt(false); setUnlockInput(''); }}>
          <div className="bg-[#07080f] border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center text-yellow-500 mb-2"><Lock size={32} /></div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">Entri Terkunci</p>
              <p className="text-sm text-gray-400 mt-1">Masukkan PIN atau Master Password untuk melihat entri ini</p>
            </div>
            
            <input
              ref={unlockRef}
              type="password"
              className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none transition-all"
              placeholder="PIN atau Master Password"
              value={unlockInput}
              onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(''); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlockEntry();
                if (e.key === 'Escape') { setShowUnlockPrompt(false); setUnlockInput(''); }
              }}
              disabled={unlockLoading}
            />
            
            {unlockError && <p className="text-sm text-red-500 text-center">{unlockError}</p>}
            
            <div className="flex gap-3 mt-2">
              <button className="flex-1 px-4 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors" onClick={() => { setShowUnlockPrompt(false); setUnlockInput(''); setUnlockError(''); }} disabled={unlockLoading}>
                Batal
              </button>
              <button className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleUnlockEntry} disabled={unlockLoading || !unlockInput.trim()}>
                {unlockLoading ? 'Verifikasi…' : 'Buka'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export const EntryCardMemo = memo(EntryCard);