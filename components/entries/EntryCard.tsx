'use client';

/**
 * components/entries/EntryCard.tsx — Vault Next v2 (redesain performa)
 *
 * Perubahan dari v1.11.0 (murni untuk menghilangkan lag saat klik/expand):
 *  - Tidak lagi subscribe ke SELURUH store: tiap kartu hanya subscribe ke
 *    boolean miliknya sendiri → expand 1 kartu tidak me-render ulang semua kartu.
 *  - Tidak ada framer-motion layout/layoutId per kartu (penyebab utama lag:
 *    setiap expand memicu pengukuran & animasi layout seluruh daftar).
 *  - Expand/collapse via CSS grid-template-rows (0fr→1fr), tanpa JS per frame.
 *  - 5 ConfirmDialog per kartu diganti 1 dialog yang hanya dibuat saat dibutuhkan.
 *  - Badan kartu baru dibuat saat pertama kali dibuka.
 */
import { useState, useEffect, memo } from 'react';
import { Pencil, Lock, Unlock, Star, RotateCcw, Trash2, Copy, Eye, EyeOff, Check, ChevronDown, User, Key } from 'lucide-react';
import { useAppStore }      from '@/lib/store/appStore';
import { saveVault }         from '@/lib/vaultService';
import { EntryIcon }         from '@/components/entries/EntryIcon';
import { getBrandIconBySlug } from '@/lib/brand-icons';
import { ConfirmDialog }     from '@/components/ui/primitives';
import type { VaultEntry }   from '@/lib/types';

interface EntryCardProps {
  entry:            VaultEntry;
  isRecycleBin?:    boolean;
  onEdit?:          (entry: VaultEntry) => void;
  onDetail?:        (entry: VaultEntry) => void;
  onCopy?:          (text: string, label: string) => void;
  onRequestUnlock?: (entry: VaultEntry) => void;
}

interface FieldProps {
  label:            string;
  value?:           string;
  sensitive?:       boolean;
  isVisible?:       boolean;
  onToggleVisible?: () => void;
  mono?:            boolean;
  copiedLabel:      string | null;
  onCopyField:      (value: string, label: string) => void;
}

function Field({
  label, value, sensitive = false, isVisible, onToggleVisible, mono = false,
  copiedLabel, onCopyField,
}: FieldProps) {
  if (!value) return null;
  const display = sensitive && !isVisible ? '••••••••' : value;
  return (
    <div className="entry-field">
      <span className="entry-field__label">{label}</span>
      <div className="entry-field__row">
        <span className={`entry-field__value ${mono ? 'mono' : ''}`}>{display}</span>
        <div className="entry-field__actions">
          {sensitive && (
            <button
              className="entry-field__btn"
              onClick={onToggleVisible}
              aria-label={isVisible ? 'Sembunyikan' : 'Tampilkan'}
              title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
            >
              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <button
            className={`entry-field__btn${copiedLabel === label ? ' entry-field__btn--copied' : ''}`}
            onClick={() => onCopyField(value, label)}
            aria-label={`Salin ${label}`}
            title={`Salin ${label}`}
          >
            {copiedLabel === label ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── SeedField: top-level component ── */
interface SeedFieldProps {
  seedPhrase?:     string[];
  seedShow:        boolean;
  onToggleVisible: () => void;
  onCopyField:     (value: string, label: string) => void;
}

function SeedField({ seedPhrase, seedShow, onToggleVisible, onCopyField }: SeedFieldProps) {
  if (!seedPhrase?.length) return null;
  const words = seedPhrase;
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
        <button
          className="entry-field__btn"
          onClick={onToggleVisible}
          aria-label={seedShow ? 'Sembunyikan seed' : 'Tampilkan seed'}
        >
          {seedShow ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        {seedShow && (
          <button
            className="entry-field__btn"
            onClick={() => onCopyField(words.join(' '), 'Seed Phrase')}
            aria-label="Salin seed phrase"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}


type ConfirmKind = 'delete' | 'lock' | 'unlock' | 'fav' | 'restore';

const persist = async (vault: VaultEntry[], bin: VaultEntry[], lockedIds: string[]) => {
  const st = useAppStore.getState();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await saveVault(st.masterPw, vault, bin, st.vaultMeta!, st.customCats, lockedIds, st.lockedCatIds, st.defaultCatFieldOverrides, st.customNetworks);
};

export function EntryCard({ entry, isRecycleBin = false, onEdit, onCopy, onRequestUnlock }: EntryCardProps) {
  const customCats = useAppStore((s) => s.customCats);
  const isLocked   = useAppStore((s) => s.lockedIds.includes(entry.id));
  const isExpanded = useAppStore((s) => s.expandedIds.includes(entry.id));
  const pwShow     = useAppStore((s) => !!s.pwVisible[entry.id]);
  const seedShow   = useAppStore((s) => !!s.seedVisible[entry.id]);
  const tgPw   = () => useAppStore.getState().togglePwVisible(entry.id);
  const tgSeed = () => useAppStore.getState().toggleSeedVisible(entry.id);

  const [everOpen, setEverOpen] = useState(isExpanded);
  const [ready, setReady]       = useState(false);
  useEffect(() => {
    if (!isExpanded) { setReady(false); return; }
    setEverOpen(true);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [isExpanded]);
  const open = isExpanded && ready;

  const [confirm, setConfirm]         = useState<ConfirmKind | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [quickCopied, setQuickCopied] = useState<'user' | 'pass' | null>(null);

  const handleToggleExpand = () => {
    if (isLocked && !isExpanded) { onRequestUnlock?.(entry); return; }
    useAppStore.getState().toggleExpanded(entry.id);
  };

  const doFav = async () => {
    const st = useAppStore.getState();
    const updated = st.vault.map((e) => (e.id === entry.id ? { ...e, fav: !e.fav } : e));
    st.setVault(updated);
    if (st.autoSaveEnabled) await persist(updated, st.recycleBin, st.lockedIds);
  };
  const doDelete = async () => {
    const st = useAppStore.getState();
    if (isRecycleBin) {
      const updated = st.recycleBin.filter((e) => e.id !== entry.id);
      st.setRecycleBin(updated);
      if (st.autoSaveEnabled) await persist(st.vault, updated, st.lockedIds);
    } else {
      const newVault = st.vault.filter((e) => e.id !== entry.id);
      const newBin   = [...st.recycleBin, { ...entry, ts: Date.now() }];
      st.setVault(newVault);
      st.setRecycleBin(newBin);
      if (st.autoSaveEnabled) await persist(newVault, newBin, st.lockedIds);
    }
  };
  const doRestore = async () => {
    const st = useAppStore.getState();
    const newBin   = st.recycleBin.filter((e) => e.id !== entry.id);
    const newVault = [...st.vault, { ...entry }];
    st.setRecycleBin(newBin);
    st.setVault(newVault);
    if (st.autoSaveEnabled) await persist(newVault, newBin, st.lockedIds);
  };
  const doToggleLock = async () => {
    const st = useAppStore.getState();
    const prev = st.lockedIds;
    const newLocked = prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id];
    st.setLockedIds(newLocked);
    if (!prev.includes(entry.id) && isExpanded) st.toggleExpanded(entry.id);
    try { await persist(st.vault, st.recycleBin, newLocked); }
    catch { useAppStore.getState().setLockedIds(prev); }
  };

  const copy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      onCopy?.(text, label);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 1500);
    }).catch(() => { onCopy?.(text, label); });
  };
  const handleQuickCopy = (text: string | undefined, field: 'user' | 'pass') => {
    if (!text || isLocked) return;
    navigator.clipboard.writeText(text).then(() => {
      setQuickCopied(field);
      onCopy?.(text, field === 'user' ? 'Username' : 'Password');
      setTimeout(() => setQuickCopied(null), 1500);
    });
  };

  const renderFields = () => {
    switch (entry.cat) {
      case 'crypto':
        return <>
          <Field label="Username"         value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"         value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Network"          value={entry.network} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Alamat Wallet"    value={entry.walletAddr} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password Wallet"  value={entry.walletPw} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <SeedField seedPhrase={entry.seedPhrase} seedShow={seedShow} onToggleVisible={() => tgSeed()} onCopyField={copy} />
          <Field label="URL"              value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"          value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'kartu':
        return <>
          <Field label="Nomor Kartu"  value={entry.cardNo}     sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Nama Pemegang" value={entry.cardHolder} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Masa Berlaku" value={entry.cardExpiry} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="CVV"          value={entry.cardCVV}    sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="PIN"          value={entry.pass}       sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"      value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'wifi':
        return <>
          <Field label="Nama Jaringan (SSID)" value={entry.wifiSSID ?? entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password Wi-Fi"       value={entry.wifiPass ?? entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"              value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'bank':
        return <>
          <Field label="Username / No. Rekening" value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"                value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="URL"                     value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"                 value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'email':
        return <>
          <Field label="Alamat Email"   value={entry.emailAddr ?? entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Username"       value={entry.emailAddr ? entry.user : undefined} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"       value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="URL"            value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"        value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      default:
        return <>
          <Field label="Username" value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password" value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => tgPw()} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="URL"      value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"  value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;
    }
  };

  // ── Sub-label under name in collapsed view ───────────────────────────────
  const subLabel = (() => {
    if (entry.cat === 'wifi')  return entry.wifiSSID ?? entry.user ?? '';
    if (entry.cat === 'kartu') return entry.cardHolder ?? '';
    if (entry.cat === 'email') return entry.emailAddr ?? entry.user ?? '';
    return entry.user ?? entry.url ?? '';
  })();

  const brand = entry.brandIconSlug ? getBrandIconBySlug(entry.brandIconSlug) : undefined;
  const brandVar = brand ? ({ '--brand': `#${brand.accent ?? brand.hex}` } as React.CSSProperties) : undefined;

  const confirmCfg = (() => {
    switch (confirm) {
      case 'delete':  return { title: isRecycleBin ? 'Hapus Permanen?' : 'Pindahkan ke Sampah?', variant: 'danger' as const, confirmLabel: isRecycleBin ? 'Hapus Permanen' : 'Pindahkan', run: doDelete,
        message: isRecycleBin ? <><strong>{entry.name}</strong> akan dihapus selamanya dan tidak bisa dipulihkan.</> : <><strong>{entry.name}</strong> akan dipindahkan ke sampah. Bisa dipulihkan nanti.</> };
      case 'lock':    return { title: 'Kunci Entri?', variant: 'lock' as const, confirmLabel: 'Kunci', run: doToggleLock, message: <>Entri <strong>{entry.name}</strong> akan dikunci. Butuh PIN/password untuk membukanya.</> };
      case 'unlock':  return { title: 'Lepas Kunci Entri?', variant: 'warning' as const, confirmLabel: 'Lepas Kunci', run: doToggleLock, message: <>Entri <strong>{entry.name}</strong> tidak akan memerlukan PIN lagi untuk dibuka.</> };
      case 'fav':     return { title: entry.fav ? 'Hapus dari Favorit?' : 'Tandai Favorit?', variant: 'warning' as const, confirmLabel: entry.fav ? 'Hapus Favorit' : 'Tandai Favorit', run: doFav,
        message: entry.fav ? <><strong>{entry.name}</strong> akan dihapus dari daftar favorit.</> : <><strong>{entry.name}</strong> akan ditambahkan ke daftar favorit.</> };
      case 'restore': return { title: 'Pulihkan Entri?', variant: 'warning' as const, confirmLabel: 'Pulihkan', run: doRestore, message: <><strong>{entry.name}</strong> akan dipindahkan kembali ke vault.</> };
      default: return null;
    }
  })();

  return (
    <>
      <div
        className={`entry-card ${isExpanded ? 'entry-card--expanded' : ''} ${isLocked ? 'entry-card--locked' : ''} ${isRecycleBin ? 'entry-card--bin' : ''}`}
        style={brandVar}
        data-id={entry.id}
      >
        <div
          className="entry-card__header"
          onClick={handleToggleExpand}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Tutup ${entry.name}` : `Buka ${entry.name}`}
          // v2.0.0 (Tahap 4C): hanya tanggapi keyboard milik kepala ITU SENDIRI. Tombol salin cepat berada di
          // dalam kepala (role=button); tanpa pengecekan target, Enter/Spasi pada tombol itu naik (bubble) ke sini,
          // mengembangkan kartu dan preventDefault membatalkan klik tombol — salin cepat mustahil lewat keyboard.
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleExpand(); }
          }}
        >
          <EntryIcon entry={entry} customCats={customCats} size="xl" />
          <div className="entry-card__title-wrap">
            <span className="entry-card__name-row">
              <span className="entry-card__name">{entry.name}</span>
              {entry.fav && <span className="entry-card__fav" aria-label="Favorit"><Star size={14} fill="currentColor" /></span>}
              {isLocked && <span className="entry-card__lock-badge" aria-label="Terkunci"><Lock size={14} /></span>}
            </span>
            {subLabel && <span className="entry-card__sub">{subLabel}</span>}
          </div>
          {!isExpanded && !isLocked && !isRecycleBin && (entry.user || entry.pass) && (
            <div className="entry-card__quick-copy" onClick={(e) => e.stopPropagation()}>
              {entry.user && (
                <button type="button" className={`entry-card__qc-btn${quickCopied === 'user' ? ' entry-card__qc-btn--copied' : ''}`}
                  onClick={() => handleQuickCopy(entry.user, 'user')} aria-label="Salin username" title="Salin Username">
                  {quickCopied === 'user' ? <Check size={13} /> : <User size={13} />}
                </button>
              )}
              {entry.pass && (
                <button type="button" className={`entry-card__qc-btn${quickCopied === 'pass' ? ' entry-card__qc-btn--copied' : ''}`}
                  onClick={() => handleQuickCopy(entry.pass, 'pass')} aria-label="Salin password" title="Salin Password">
                  {quickCopied === 'pass' ? <Check size={13} /> : <Key size={13} />}
                </button>
              )}
            </div>
          )}
          <span className="entry-card__chevron" aria-hidden="true"><ChevronDown size={18} /></span>
        </div>

        {everOpen && (
          <div className={`entry-card__body-wrap${open ? ' entry-card__body-wrap--open' : ''}`} inert={!open}>
            <div className="entry-card__body-inner">
              <div className="entry-card__body">
                <div className="entry-card__fields">{renderFields()}</div>
                <div className="entry-card__actions">
                  {!isRecycleBin && onEdit && (
                    <button type="button" className="entry-action-btn entry-action-btn--edit" onClick={() => onEdit(entry)}>
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                  {!isRecycleBin && (
                    <button type="button" className="entry-action-btn entry-action-btn--lock" onClick={() => setConfirm(isLocked ? 'unlock' : 'lock')}>
                      {isLocked ? <><Unlock size={14} /> Lepas</> : <><Lock size={14} /> Kunci</>}
                    </button>
                  )}
                  {!isRecycleBin && (
                    <button type="button" className={`entry-action-btn entry-action-btn--fav ${entry.fav ? 'entry-action-btn--fav-active' : ''}`} onClick={() => setConfirm('fav')}>
                      <Star size={14} fill={entry.fav ? 'currentColor' : 'none'} /> Favorit
                    </button>
                  )}
                  {isRecycleBin && (
                    <button type="button" className="entry-action-btn entry-action-btn--restore" onClick={() => setConfirm('restore')}>
                      <RotateCcw size={14} /> Pulihkan
                    </button>
                  )}
                  <button type="button" className="entry-action-btn entry-action-btn--delete" onClick={() => setConfirm('delete')}>
                    <Trash2 size={14} /> {isRecycleBin ? 'Hapus Permanen' : 'Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmCfg && (
        <ConfirmDialog
          open
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); confirmCfg.run(); }}
          title={confirmCfg.title}
          message={confirmCfg.message}
          confirmLabel={confirmCfg.confirmLabel}
          variant={confirmCfg.variant}
        />
      )}
    </>
  );
}

export const EntryCardMemo = memo(EntryCard);
