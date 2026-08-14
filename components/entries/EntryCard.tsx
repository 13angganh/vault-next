'use client';

/**
 * Vault Next — EntryCard
 * Kartu entri expandable di VaultListView.
 *
 * Collapsed: emoji kategori + nama + user/URL + badge fav + badge lock
 * Expanded:  semua field per kategori, copy, show/hide password, actions
 * Locked:    tampilkan gembok, klik → expand minta PIN/master password
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pencil, Lock, Unlock, Star, RotateCcw, Trash2, Copy, Eye, EyeOff, Check, ChevronDown, User, Key } from 'lucide-react';
import { useAppStore }      from '@/lib/store/appStore';
import { saveVault }         from '@/lib/vaultService';
import { CategoryIcon }      from '@/components/entries/CategoryIcon';
import { ConfirmDialog }     from '@/components/ui/primitives';
import type { VaultEntry }   from '@/lib/types';
import { DUR, EASE } from '@/lib/animation';

interface EntryCardProps {
  entry:            VaultEntry;
  isRecycleBin?:    boolean;
  onEdit?:          (entry: VaultEntry) => void;
  onDetail?:        (entry: VaultEntry) => void;
  onCopy?:          (text: string, label: string) => void;
  onRequestUnlock?: (entry: VaultEntry) => void;
}

/* ── Field: top-level component, bukan dideklarasikan di dalam EntryCard ──
   v1.4.0: pola yang sama dengan fix SectionWrap (v1.3.6) dan FieldRow
   di DetailView — re-creation komponen tiap render menyebabkan children
   unmount+mount = berkedip pada hover/transition state.
   ─────────────────────────────────────────────────────────────────────── */
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

export function EntryCard({
  entry,
  isRecycleBin = false,
  onEdit,
  onDetail: _onDetail,
  onCopy,
  onRequestUnlock,
}: EntryCardProps) {
  const store          = useAppStore();
  const customCats     = store.customCats;
  const lockedIds      = store.lockedIds;
  const expandedIds    = store.expandedIds;
  const pwVisible      = store.pwVisible;
  const seedVisible    = store.seedVisible;
  const prefersReduced = useReducedMotion();

  const isLocked   = lockedIds.includes(entry.id);
  const isExpanded = expandedIds.includes(entry.id);

  // Local: show unlock prompt overlay
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [unlockInput,      setUnlockInput]      = useState('');
  const [_unlockError,      setUnlockError]      = useState('');
  const [_unlockLoading,    setUnlockLoading]    = useState(false);
  const unlockRef = useRef<HTMLInputElement>(null);

  // Konfirmasi dialog states
  const [quickCopied, setQuickCopied] = useState<'user'|'pass'|null>(null);
  const handleQuickCopy=(text:string|undefined,field:'user'|'pass')=>{if(!text||isLocked)return;navigator.clipboard.writeText(text).then(()=>{setQuickCopied(field);if(onCopy)onCopy(text,field==='user'?'Username':'Password');setTimeout(()=>setQuickCopied(null),1500);});};

  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [confirmLock,    setConfirmLock]    = useState(false);
  const [confirmUnlock,  setConfirmUnlock]  = useState(false);
  const [confirmFav,     setConfirmFav]     = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (showUnlockPrompt && unlockRef.current) {
      unlockRef.current.focus();
    }
  }, [showUnlockPrompt]);

  const handleToggleExpand = () => {
    if (isLocked && !isExpanded) {
      // Pakai callback ke parent (VaultListView) yang render overlay di luar transform context
      if (onRequestUnlock) {
        onRequestUnlock(entry);
      } else {
        setShowUnlockPrompt(true);
      }
      return;
    }
    store.toggleExpanded(entry.id);
  };

  const _handleUnlockEntry = async () => {
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
        // Setelah verifikasi berhasil, expand entry (tanpa unlock permanen)
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

  const doFav = async () => {
    const updated = store.vault.map((e) =>
      e.id === entry.id ? { ...e, fav: !e.fav } : e,
    );
    store.setVault(updated);
    if (store.autoSaveEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, updated, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds, store.lockedCatIds, store.defaultCatFieldOverrides);
    }
  };

  const handleFav = () => setConfirmFav(true);

  const doDelete = async () => {
    if (isRecycleBin) {
      // Permanent delete
      const updated = store.recycleBin.filter((e) => e.id !== entry.id);
      store.setRecycleBin(updated);
      if (store.autoSaveEnabled) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await saveVault(store.masterPw, store.vault, updated, store.vaultMeta!, store.customCats, store.lockedIds, store.lockedCatIds, store.defaultCatFieldOverrides);
      }
    } else {
      // Move to recycle bin
      const newVault = store.vault.filter((e) => e.id !== entry.id);
      const newBin   = [...store.recycleBin, { ...entry, ts: Date.now() }];
      store.setVault(newVault);
      store.setRecycleBin(newBin);
      if (store.autoSaveEnabled) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, newVault, newBin, store.vaultMeta!, store.customCats, store.lockedIds, store.lockedCatIds, store.defaultCatFieldOverrides);
      }
    }
  };

  const handleDelete = () => setConfirmDelete(true);

  const doRestore = async () => {
    const newBin   = store.recycleBin.filter((e) => e.id !== entry.id);
    const newVault = [...store.vault, { ...entry }];
    store.setRecycleBin(newBin);
    store.setVault(newVault);
    if (store.autoSaveEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, newVault, newBin, store.vaultMeta!, store.customCats, store.lockedIds, store.lockedCatIds, store.defaultCatFieldOverrides);
    }
  };

  const handleRestore = () => setConfirmRestore(true);

  const doToggleLock = async () => {
    // Hitung newLocked dulu dari closure yang konsisten — hindari race condition
    const newLocked = lockedIds.includes(entry.id)
      ? lockedIds.filter((id) => id !== entry.id)
      : [...lockedIds, entry.id];
    // Update store
    store.setLockedIds(newLocked);
    // Collapse jika sedang dikunci
    if (!lockedIds.includes(entry.id) && isExpanded) {
      store.toggleExpanded(entry.id);
    }
    // Selalu simpan locked state — ini data penting, tidak tergantung autoSave
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, store.vault, store.recycleBin, store.vaultMeta!, store.customCats, newLocked, store.lockedCatIds, store.defaultCatFieldOverrides);
    } catch {
      // Rollback jika save gagal
      store.setLockedIds(lockedIds);
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      setConfirmUnlock(true);
    } else {
      setConfirmLock(true);
    }
  };

  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const copy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      onCopy?.(text, label);
      // Tampilkan checkmark sesaat di tombol yang diklik
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 1500);
    }).catch(() => {
      // Fallback untuk browser/PWA yang restrict clipboard
      onCopy?.(text, label);
    });
  };

  const pwShow   = pwVisible[entry.id]   ?? false;
  const seedShow = seedVisible[entry.id] ?? false;

  // ── Category-specific fields ─────────────────────────────────────────────

  const renderFields = () => {
    switch (entry.cat) {
      case 'crypto':
        return <>
          <Field label="Username"         value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"         value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Network"          value={entry.network} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Alamat Wallet"    value={entry.walletAddr} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password Wallet"  value={entry.walletPw} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <SeedField seedPhrase={entry.seedPhrase} seedShow={seedShow} onToggleVisible={() => store.toggleSeedVisible(entry.id)} onCopyField={copy} />
          <Field label="URL"              value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"          value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'kartu':
        return <>
          <Field label="Nomor Kartu"  value={entry.cardNo}     sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Nama Pemegang" value={entry.cardHolder} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Masa Berlaku" value={entry.cardExpiry} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="CVV"          value={entry.cardCVV}    sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="PIN"          value={entry.pass}       sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"      value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'wifi':
        return <>
          <Field label="Nama Jaringan (SSID)" value={entry.wifiSSID ?? entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password Wi-Fi"       value={entry.wifiPass ?? entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"              value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'bank':
        return <>
          <Field label="Username / No. Rekening" value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"                value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="URL"                     value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"                 value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      case 'email':
        return <>
          <Field label="Alamat Email"   value={entry.emailAddr ?? entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Username"       value={entry.emailAddr ? entry.user : undefined} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password"       value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="URL"            value={entry.url} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Catatan"        value={entry.note} copiedLabel={copiedLabel} onCopyField={copy} />
        </>;

      default:
        return <>
          <Field label="Username" value={entry.user} copiedLabel={copiedLabel} onCopyField={copy} />
          <Field label="Password" value={entry.pass} sensitive isVisible={pwShow} onToggleVisible={() => store.togglePwVisible(entry.id)} mono copiedLabel={copiedLabel} onCopyField={copy} />
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

  // ── Render ───────────────────────────────────────────────────────────────

  // Framer Motion variants (ease harus string atau EasingFunction bukan number[])
  const cardVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
  };
  const cardTransition = { duration: DUR.normal, ease: EASE.out };

  return (
    <>
    <motion.div
      className={`entry-card ${isExpanded ? 'entry-card--expanded' : ''} ${isLocked ? 'entry-card--locked' : ''} ${isRecycleBin ? 'entry-card--bin' : ''}`}
      data-id={entry.id}
      layout="position"
      layoutId={`card-${entry.id}`}
      variants={prefersReduced ? undefined : cardVariants}
      initial={prefersReduced ? false : 'initial'}
      animate={prefersReduced ? false : 'animate'}
      whileHover={prefersReduced ? {} : { y: -1 }}
      whileTap={prefersReduced ? {} : { scale: 0.995 }}
      transition={cardTransition}
    >
      {/* ── Collapsed row ── */}
      <div
        className="entry-card__header"
        onClick={handleToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? `Tutup ${entry.name}` : `Buka ${entry.name}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleExpand(); } }}
      >
        <CategoryIcon catId={entry.cat} customCats={customCats} size="md" />

        <div className="entry-card__title-wrap">
          <span className="entry-card__name">{entry.name}</span>
          {subLabel && (
            <span className="entry-card__sub">{subLabel}</span>
          )}
        </div>

        <div className="entry-card__badges">
          {entry.fav && <span className="entry-card__fav" aria-label="Favorit"><Star size={12} fill="currentColor" /></span>}
          {isLocked  && <span className="entry-card__lock-badge" aria-label="Terkunci"><Lock size={12} /></span>}
        </div>

        {!isExpanded && !isLocked && !isRecycleBin && (entry.user || entry.pass) && (
          <div className="entry-card__quick-copy" onClick={(e)=>e.stopPropagation()}>
            {entry.user && (
              <motion.button className={`entry-card__qc-btn${quickCopied==='user'?' entry-card__qc-btn--copied':''}`}
                onClick={()=>handleQuickCopy(entry.user,'user')} aria-label="Salin username" title="Salin Username"
                whileTap={prefersReduced?{}:{scale:0.85}} transition={{duration:DUR.tap}}>
                {quickCopied==='user'?<Check size={11}/>:<User size={11}/>}
              </motion.button>
            )}
            {entry.pass && (
              <motion.button className={`entry-card__qc-btn${quickCopied==='pass'?' entry-card__qc-btn--copied':''}`}
                onClick={()=>handleQuickCopy(entry.pass,'pass')} aria-label="Salin password" title="Salin Password"
                whileTap={prefersReduced?{}:{scale:0.85}} transition={{duration:DUR.tap}}>
                {quickCopied==='pass'?<Check size={11}/>:<Key size={11}/>}
              </motion.button>
            )}
          </div>
        )}
        <motion.span
          className="entry-card__chevron"
          aria-hidden="true"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.2, ease: EASE.inOut }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </div>

      {/* ── Expanded body — AnimatePresence untuk smooth height ── */}
      <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          className="entry-card__body-wrap"
          key={`body-${entry.id}`}
          initial={prefersReduced ? false : { opacity: 0, height: 0 }}
          animate={prefersReduced ? {} : { opacity: 1, height: 'auto' }}
          exit={prefersReduced ? {} : { opacity: 0, height: 0 }}
          transition={{ duration: DUR.expand, ease: EASE.inOut }}
          style={{ overflow: 'hidden' }}
        >
          <div className="entry-card__body-inner">
          <div className="entry-card__body">
          {/* Fields */}
          <div className="entry-card__fields">
            {renderFields()}
          </div>

          {/* Action row */}
          <div className="entry-card__actions">
            {!isRecycleBin && onEdit && (
              <motion.button className="entry-action-btn entry-action-btn--edit"
                onClick={() => onEdit(entry)} title="Edit"
                whileTap={prefersReduced ? {} : { scale: 0.9 }}
                transition={{ duration: DUR.tap }}>
                <Pencil size={13} /> Edit
              </motion.button>
            )}

            {!isRecycleBin && (
              <motion.button className="entry-action-btn entry-action-btn--lock"
                onClick={handleToggleLock}
                title={isLocked ? 'Lepas kunci' : 'Kunci entri'}
                whileTap={prefersReduced ? {} : { scale: 0.9 }}
                transition={{ duration: DUR.tap }}>
                {isLocked ? <><Unlock size={13} /> Lepas</> : <><Lock size={13} /> Kunci</>}
              </motion.button>
            )}

            {!isRecycleBin && (
              <motion.button
                className={`entry-action-btn entry-action-btn--fav ${entry.fav ? 'entry-action-btn--fav-active' : ''}`}
                onClick={handleFav}
                title={entry.fav ? 'Hapus favorit' : 'Tandai favorit'}
                whileTap={prefersReduced ? {} : { scale: 0.88 }}
                transition={{ duration: DUR.tap }}>
                <motion.span
                  animate={prefersReduced ? {} : { rotate: entry.fav ? [0, -15, 15, 0] : 0 }}
                  transition={{ duration: DUR.emph }}
                  style={{ display:'inline-flex' }}>
                  <Star size={13} fill={entry.fav ? 'currentColor' : 'none'} />
                </motion.span>
                {entry.fav ? 'Favorit' : 'Favorit'}
              </motion.button>
            )}

            {isRecycleBin && (
              <motion.button className="entry-action-btn entry-action-btn--restore"
                onClick={handleRestore} title="Pulihkan"
                whileTap={prefersReduced ? {} : { scale: 0.9 }}
                transition={{ duration: DUR.tap }}>
                <RotateCcw size={13} /> Pulihkan
              </motion.button>
            )}

            <motion.button className="entry-action-btn entry-action-btn--delete"
              onClick={handleDelete}
              title={isRecycleBin ? 'Hapus permanen' : 'Hapus'}
              whileTap={prefersReduced ? {} : { scale: 0.88 }}
              transition={{ duration: DUR.tap }}>
              <Trash2 size={13} />
              {isRecycleBin ? 'Hapus Permanen' : 'Hapus'}
            </motion.button>
          </div>
          </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>


    </motion.div>

    {/* ── Confirm: Hapus / Hapus Permanen ── */}
    <ConfirmDialog
      open={confirmDelete}
      onCancel={() => setConfirmDelete(false)}
      onConfirm={() => { setConfirmDelete(false); doDelete(); }}
      title={isRecycleBin ? 'Hapus Permanen?' : 'Pindahkan ke Sampah?'}
      message={
        isRecycleBin
          ? <><strong>{entry.name}</strong> akan dihapus selamanya dan tidak bisa dipulihkan.</>
          : <><strong>{entry.name}</strong> akan dipindahkan ke sampah. Bisa dipulihkan nanti.</>
      }
      confirmLabel={isRecycleBin ? 'Hapus Permanen' : 'Pindahkan'}
      variant="danger"
    />

    {/* ── Confirm: Kunci Entri ── */}
    <ConfirmDialog
      open={confirmLock}
      onCancel={() => setConfirmLock(false)}
      onConfirm={() => { setConfirmLock(false); doToggleLock(); }}
      title="Kunci Entri?"
      message={<>Entri <strong>{entry.name}</strong> akan dikunci. Butuh PIN/password untuk membukanya.</>}
      confirmLabel="Kunci"
      variant="lock"
    />

    {/* ── Confirm: Lepas Kunci Entri ── */}
    <ConfirmDialog
      open={confirmUnlock}
      onCancel={() => setConfirmUnlock(false)}
      onConfirm={() => { setConfirmUnlock(false); doToggleLock(); }}
      title="Lepas Kunci Entri?"
      message={<>Entri <strong>{entry.name}</strong> tidak akan memerlukan PIN lagi untuk dibuka.</>}
      confirmLabel="Lepas Kunci"
      variant="warning"
    />

    {/* ── Confirm: Toggle Favorit ── */}
    <ConfirmDialog
      open={confirmFav}
      onCancel={() => setConfirmFav(false)}
      onConfirm={() => { setConfirmFav(false); doFav(); }}
      title={entry.fav ? 'Hapus dari Favorit?' : 'Tandai Favorit?'}
      message={
        entry.fav
          ? <><strong>{entry.name}</strong> akan dihapus dari daftar favorit.</>
          : <><strong>{entry.name}</strong> akan ditambahkan ke daftar favorit.</>
      }
      confirmLabel={entry.fav ? 'Hapus Favorit' : 'Tandai Favorit'}
      variant="warning"
    />

    {/* ── Confirm: Pulihkan dari Sampah ── */}
    <ConfirmDialog
      open={confirmRestore}
      onCancel={() => setConfirmRestore(false)}
      onConfirm={() => { setConfirmRestore(false); doRestore(); }}
      title="Pulihkan Entri?"
      message={<><strong>{entry.name}</strong> akan dipindahkan kembali ke vault.</>}
      confirmLabel="Pulihkan"
      variant="warning"
    />
    </>
  );
}

// Sesi 6: memo untuk hindari re-render tidak perlu
// EntryCard di-render banyak kali di list, memo signifikan
export const EntryCardMemo = memo(EntryCard);
