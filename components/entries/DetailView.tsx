'use client';

/**
 * Vault Next — DetailView
 * View detail lengkap satu entri.
 * Desktop: modal overlay; Mobile: full-screen.
 *
 * Semua field, show/hide per field sensitif, copy semua field.
 * Edit / Hapus / Lock / Favorit action.
 * Escape key dismiss.
 */

import { useState, useEffect } from 'react';
import { X, Star, Lock, Unlock, Eye, EyeOff, Copy } from 'lucide-react';
import { useAppStore }       from '@/lib/store/appStore';
import { saveVault }          from '@/lib/vaultService';
import { CategoryIcon }       from '@/components/entries/CategoryIcon';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { VaultEntry }    from '@/lib/types';

interface DetailViewProps {
  entry:   VaultEntry;
  onClose: () => void;
  onEdit:  (entry: VaultEntry) => void;
  onCopy:  (text: string, label: string) => void;
}

export function DetailView({ entry, onClose, onEdit, onCopy }: DetailViewProps) {
  const store      = useAppStore();
  const customCats = store.customCats;
  const lockedIds  = store.lockedIds;
  const pwVisible  = store.pwVisible;
  const seedVisible = store.seedVisible;

  const isLocked = lockedIds.includes(entry.id);
  const pwShow   = pwVisible[entry.id]   ?? false;
  const seedShow = seedVisible[entry.id] ?? false;

  const [delConfirm, setDelConfirm] = useState(false);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const allCats  = [...DEFAULT_CATEGORIES, ...customCats];
  const catInfo  = allCats.find((c) => c.id === entry.cat) ?? { emoji: '🔑', label: entry.cat };

  const copy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => onCopy(text, label));
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

  const handleToggleLock = async () => {
    store.toggleLockedId(entry.id);
    const newLocked = lockedIds.includes(entry.id)
      ? lockedIds.filter((id) => id !== entry.id)
      : [...lockedIds, entry.id];
    if (store.autoSaveEnabled) {
      await saveVault(store.masterPw, store.vault, store.recycleBin, store.vaultMeta!, store.customCats, newLocked);
    }
  };

  const handleDelete = async () => {
    if (!delConfirm) { setDelConfirm(true); return; }
    const newVault = store.vault.filter((e) => e.id !== entry.id);
    const newBin   = [...store.recycleBin, { ...entry, ts: Date.now() }];
    store.setVault(newVault);
    store.setRecycleBin(newBin);
    if (store.autoSaveEnabled) {
      await saveVault(store.masterPw, newVault, newBin, store.vaultMeta!, store.customCats, store.lockedIds);
    }
    onClose();
  };

  // ── Field row ─────────────────────────────────────────────────────────

  const FieldRow = ({
    label, value, sensitive = false, isVisible, onToggleVisible, mono = false,
  }: {
    label: string;
    value?: string;
    sensitive?: boolean;
    isVisible?: boolean;
    onToggleVisible?: () => void;
    mono?: boolean;
  }) => {
    if (!value) return null;
    const display = sensitive && !isVisible ? '••••••••' : value;
    return (
      <div className="detail-field">
        <span className="detail-field__label">{label}</span>
        <div className="detail-field__row">
          <span className={`detail-field__value ${mono ? 'mono' : ''}`}>{display}</span>
          <div className="detail-field__btns">
            {sensitive && (
              <button className="btn-icon" onClick={onToggleVisible} aria-label={isVisible ? 'Sembunyikan' : 'Tampilkan'}>
                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button className="btn-icon" onClick={() => copy(value, label)} aria-label={`Salin ${label}`} title="Salin">
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Seed phrase ───────────────────────────────────────────────────────

  const SeedSection = () => {
    if (!entry.seedPhrase?.length) return null;
    const words = entry.seedPhrase;
    return (
      <div className="detail-field">
        <div className="detail-field__label-row">
          <span className="detail-field__label">Seed Phrase ({words.length} kata)</span>
          <div className="detail-field__btns">
            <button className="btn-icon" onClick={() => store.toggleSeedVisible(entry.id)} aria-label={seedShow ? 'Sembunyikan' : 'Tampilkan'}>
              {seedShow ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {seedShow && (
              <button className="btn-icon" onClick={() => copy(words.join(' '), 'Seed Phrase')} aria-label="Salin seed phrase">
                <Copy size={14} />
              </button>
            )}
          </div>
        </div>
        {seedShow ? (
          <div className="detail-seed-grid">
            {words.map((w, i) => (
              <span key={i} className="detail-seed-word mono">
                <span className="detail-seed-word__num">{i + 1}.</span> {w}
              </span>
            ))}
          </div>
        ) : (
          <span className="detail-field__value">{'•'.repeat(Math.min(words.length * 4, 40))}</span>
        )}
      </div>
    );
  };

  // ── All fields by category ────────────────────────────────────────────

  const renderAllFields = () => {
    const pw = (
      <FieldRow key="pass" label="Password" value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
    );

    switch (entry.cat) {
      case 'email':
        return <>
          {entry.emailAddr && <FieldRow label="Alamat Email" value={entry.emailAddr} />}
          <FieldRow label="Username" value={entry.user} />
          {pw}
          <FieldRow label="URL" value={entry.url} />
          <FieldRow label="Catatan" value={entry.note} />
        </>;
      case 'kartu':
        return <>
          <FieldRow label="Nomor Kartu" value={entry.cardNo} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <FieldRow label="Nama Pemegang" value={entry.cardHolder} />
          <FieldRow label="Masa Berlaku" value={entry.cardExpiry} />
          <FieldRow label="CVV" value={entry.cardCVV} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <FieldRow label="PIN Kartu" value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <FieldRow label="Catatan" value={entry.note} />
        </>;
      case 'wifi':
        return <>
          <FieldRow label="Nama Jaringan (SSID)" value={entry.wifiSSID ?? entry.user} />
          <FieldRow label="Password Wi-Fi" value={entry.wifiPass ?? entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <FieldRow label="Catatan" value={entry.note} />
        </>;
      case 'crypto':
        return <>
          <FieldRow label="Username" value={entry.user} />
          {pw}
          <FieldRow label="Network" value={entry.network} />
          <FieldRow label="Alamat Wallet" value={entry.walletAddr} mono />
          <FieldRow label="Password Wallet" value={entry.walletPw} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
          <SeedSection />
          <FieldRow label="URL" value={entry.url} />
          <FieldRow label="Catatan" value={entry.note} />
        </>;
      default:
        return <>
          <FieldRow label="Username" value={entry.user} />
          {pw}
          <FieldRow label="URL" value={entry.url} />
          <FieldRow label="Catatan" value={entry.note} />
        </>;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="modal-overlay detail-overlay" role="dialog" aria-modal="true" aria-label={`Detail: ${entry.name}`} onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-header">
          <CategoryIcon catId={entry.cat} customCats={customCats} size="lg" />
          <div className="detail-header__info">
            <h2 className="detail-header__name">{entry.name}</h2>
            <span className="detail-header__cat">{catInfo.emoji} {catInfo.label}</span>
          </div>
          <div className="detail-header__badges">
            {entry.fav   && <span aria-label="Favorit"><Star size={14} fill="currentColor" style={{ color: 'var(--gold)' }} /></span>}
            {isLocked    && <span aria-label="Terkunci"><Lock size={14} /></span>}
          </div>
          <button className="btn-icon detail-header__close" onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="detail-body">
          {renderAllFields()}

          {entry.ts && (
            <p className="detail-ts">
              Terakhir diperbarui: {new Date(entry.ts).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Action bar */}
        <div className="detail-actions">
          <button className="detail-action-btn" onClick={() => onEdit(entry)} title="Edit">
            ✎ Edit
          </button>
          <button className="detail-action-btn" onClick={handleToggleLock} title={isLocked ? 'Lepas kunci' : 'Kunci'}>
            {isLocked ? <><Unlock size={14} /> Lepas</> : <><Lock size={14} /> Kunci</>}
          </button>
          <button
            className={`detail-action-btn ${entry.fav ? 'detail-action-btn--fav-active' : ''}`}
            onClick={handleFav}
            title={entry.fav ? 'Hapus favorit' : 'Tambah favorit'}
          >
            {entry.fav ? '★' : '☆'} Favorit
          </button>
          <button
            className={`detail-action-btn detail-action-btn--delete ${delConfirm ? 'detail-action-btn--confirm' : ''}`}
            onClick={handleDelete}
            title="Hapus"
          >
            {delConfirm ? '⚠ Konfirmasi?' : '🗑 Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
