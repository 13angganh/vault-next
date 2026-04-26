'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAppStore }           from '@/lib/store/appStore';
import { saveVault }              from '@/lib/vaultService';
import { CategoryIcon }           from '@/components/entries/CategoryIcon';
import { PasswordStrengthMeter }  from '@/components/ui/PasswordStrengthMeter';
import { PasswordGenerator }      from '@/components/ui/PasswordGenerator';
import { DEFAULT_CATEGORIES }     from '@/lib/types';
import type { VaultEntry, CustomCategory } from '@/lib/types';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface EntryFormProps {
  entry?:   VaultEntry;
  onClose:  () => void;
  onSaved:  (entry: VaultEntry) => void;
}

type FieldKey = keyof VaultEntry;

interface FieldDef {
  key:          FieldKey;
  label:        string;
  type?:        'text' | 'password' | 'url' | 'email' | 'textarea';
  placeholder?: string;
  sensitive?:   boolean;
  mono?:        boolean;
  hint?:        string;
}

const FIELDS_BY_CAT: Record<string, FieldDef[]> = {
  sosmed: [
    { key: 'user', label: 'Username', placeholder: '@username' },
    { key: 'pass', label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',  label: 'URL Profil', type: 'url', placeholder: 'https://...' },
    { key: 'note', label: 'Catatan', type: 'textarea' },
  ],
  email: [
    { key: 'emailAddr', label: 'Alamat Email', type: 'email', placeholder: 'nama@contoh.com' },
    { key: 'user',      label: 'Username (opsional)', placeholder: 'username login' },
    { key: 'pass',      label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',       label: 'URL Webmail', type: 'url', placeholder: 'https://mail.google.com' },
    { key: 'note',      label: 'Catatan', type: 'textarea' },
  ],
  bank: [
    { key: 'user', label: 'Username / No. Rekening' },
    { key: 'pass', label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',  label: 'URL Mobile Banking', type: 'url', placeholder: 'https://...' },
    { key: 'note', label: 'Catatan', type: 'textarea' },
  ],
  game: [
    { key: 'user', label: 'Username / ID' },
    { key: 'pass', label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',  label: 'URL / Platform', type: 'url' },
    { key: 'note', label: 'Catatan', type: 'textarea' },
  ],
  crypto: [
    { key: 'user',       label: 'Username (exchange)' },
    { key: 'pass',       label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'network',    label: 'Jaringan (Network)', placeholder: 'Ethereum, Solana…' },
    { key: 'walletAddr', label: 'Alamat Wallet', mono: true },
    { key: 'walletPw',   label: 'Password Wallet', type: 'password', mono: true },
    { key: 'note',       label: 'Catatan', type: 'textarea' },
    { key: 'url',        label: 'URL', type: 'url' },
  ],
  kartu: [
    { key: 'cardNo',     label: 'Nomor Kartu', placeholder: '0000 0000 0000 0000', mono: true },
    { key: 'cardHolder', label: 'Nama Pemegang', placeholder: 'NAMA SESUAI KARTU' },
    { key: 'cardExpiry', label: 'Masa Berlaku', placeholder: 'MM/YY' },
    { key: 'cardCVV',    label: 'CVV', placeholder: '123', mono: true },
    { key: 'pass',       label: 'PIN Kartu', type: 'password', mono: true },
    { key: 'note',       label: 'Catatan', type: 'textarea' },
  ],
  wifi: [
    { key: 'wifiSSID', label: 'Nama Jaringan (SSID)', placeholder: 'NamaWiFi' },
    { key: 'wifiPass', label: 'Password Wi-Fi', type: 'password', sensitive: true, mono: true },
    { key: 'note',     label: 'Catatan', type: 'textarea' },
  ],
  lainnya: [
    { key: 'user', label: 'Username' },
    { key: 'pass', label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',  label: 'URL', type: 'url' },
    { key: 'note', label: 'Catatan', type: 'textarea' },
  ],
};

function getFieldsForCat(catId: string, customCats: CustomCategory[]): FieldDef[] {
  if (FIELDS_BY_CAT[catId]) return FIELDS_BY_CAT[catId];
  void customCats;
  return FIELDS_BY_CAT['lainnya'];
}

export function EntryForm({ entry, onClose, onSaved }: EntryFormProps) {
  const store      = useAppStore();
  const customCats = store.customCats;
  const allCats    = [...DEFAULT_CATEGORIES, ...customCats];
  const isEdit     = !!entry;

  const [cat,         setCat]         = useState(entry?.cat ?? 'sosmed');
  const [name,        setName]        = useState(entry?.name ?? '');
  const [fav,         setFav]         = useState(entry?.fav ?? false);
  const [values,      setValues]      = useState<Partial<VaultEntry>>(entry ?? {});
  const [nameError,   setNameError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [showPwGen,   setShowPwGen]   = useState(false);
  const [pwGenTarget, setPwGenTarget] = useState<FieldKey>('pass');
  const [seedWords,   setSeedWords]   = useState<string[]>(entry?.seedPhrase ?? Array(12).fill(''));

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showPwGen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showPwGen]);

  const setField = useCallback((key: FieldKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Nama tidak boleh kosong');
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const newEntry: VaultEntry = {
        ...(entry ?? {}),
        ...values,
        id:   entry?.id ?? generateId(),
        cat,
        name: name.trim(),
        fav,
        ts:   Date.now(),
        ...(cat === 'crypto' && seedWords.some((w) => w.trim())
          ? { seedPhrase: seedWords.map((w) => w.trim()).filter(Boolean) }
          : {}),
      };
      let newVault: VaultEntry[];
      if (isEdit) {
        newVault = store.vault.map((e) => (e.id === newEntry.id ? newEntry : e));
      } else {
        newVault = [newEntry, ...store.vault];
      }
      store.setVault(newVault);
      await saveVault(store.masterPw, newVault, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds);
      onSaved(newEntry);
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan entri:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentFields = getFieldsForCat(cat, customCats);

  const renderField = (fd: FieldDef) => {
    const val = (values[fd.key] as string) ?? '';
    const id  = `form-field-${fd.key}`;
    if (fd.type === 'textarea') {
      return (
        <div key={fd.key} className="form-group">
          <label htmlFor={id} className="form-label">{fd.label}</label>
          {fd.hint && <p className="form-hint">{fd.hint}</p>}
          <textarea
            id={id}
            className={`input form-textarea ${fd.mono ? 'mono' : ''}`}
            value={val}
            placeholder={fd.placeholder}
            onChange={(e) => setField(fd.key, e.target.value)}
            rows={3}
          />
        </div>
      );
    }
    const isPw = fd.type === 'password';
    return (
      <div key={fd.key} className="form-group">
        <div className="form-label-row">
          <label htmlFor={id} className="form-label">{fd.label}</label>
          {isPw && (
            <button type="button" className="form-pw-gen-link"
              onClick={() => { setPwGenTarget(fd.key); setShowPwGen(true); }}>
              Generator
            </button>
          )}
        </div>
        <input
          id={id}
          type={isPw ? 'text' : (fd.type ?? 'text')}
          className={`input ${fd.mono ? 'mono' : ''}`}
          value={val}
          placeholder={fd.placeholder}
          onChange={(e) => setField(fd.key, e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {fd.sensitive && isPw && val && <PasswordStrengthMeter password={val} />}
      </div>
    );
  };

  const renderSeedSection = () => {
    if (cat !== 'crypto') return null;
    return (
      <div className="form-group">
        <label className="form-label">Seed Phrase (12 atau 24 kata)</label>
        <p className="form-hint">Isi satu kata per kotak</p>
        <div className="seed-grid">
          {seedWords.map((w, i) => (
            <div key={i} className="seed-grid__item">
              <span className="seed-grid__num">{i + 1}</span>
              <input
                type="text"
                className="input seed-grid__input mono"
                value={w}
                placeholder={`kata ${i + 1}`}
                onChange={(e) => {
                  const updated = [...seedWords];
                  updated[i] = e.target.value;
                  setSeedWords(updated);
                }}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
        <div className="seed-grid__actions">
          <button type="button" className="btn btn--ghost btn--sm"
            onClick={() => setSeedWords(Array(12).fill(''))}>Reset 12 kata</button>
          <button type="button" className="btn btn--ghost btn--sm"
            onClick={() => setSeedWords(Array(24).fill(''))}>Ganti ke 24 kata</button>
        </div>
      </div>
    );
  };

  // ── Render sebagai HALAMAN PENUH, bukan overlay ──
  // Menggantikan vault-list, bukan di atas konten
  return (
    <>
      {/* Full-page form — menggantikan list view */}
      <div className="entry-form-page">

        {/* Header sticky */}
        <div className="entry-form-page__header">
          <button className="entry-form-page__back" onClick={onClose} aria-label="Kembali">
            <ArrowLeft size={18} />
          </button>
          <h2 className="entry-form-page__title">
            {isEdit ? 'Edit Entri' : 'Tambah Entri Baru'}
          </h2>
          <button className="entry-form-page__close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="entry-form-page__body">

          {/* Nama */}
          <div className="form-group">
            <label htmlFor="form-name" className="form-label">
              Nama <span className="form-required">*</span>
            </label>
            <input
              ref={nameRef}
              id="form-name"
              type="text"
              className={`input ${nameError ? 'input--error' : ''}`}
              value={name}
              placeholder="Contoh: Gmail Utama"
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              autoComplete="off"
            />
            {nameError && <p className="form-error">{nameError}</p>}
          </div>

          {/* Kategori — tampil full, tidak scroll sendiri */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="cat-picker cat-picker--full">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-picker__item ${cat === c.id ? 'cat-picker__item--active' : ''}`}
                  onClick={() => { setCat(c.id); setValues({}); setSeedWords(Array(12).fill('')); }}
                  title={c.label}
                >
                  <CategoryIcon catId={c.id} customCats={customCats} size="sm" />
                  <span className="cat-picker__label">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorit */}
          <div className="form-group form-group--inline">
            <label htmlFor="form-fav" className="form-label">Tandai Favorit</label>
            <button
              id="form-fav"
              role="switch"
              aria-checked={fav}
              type="button"
              className={`settings-toggle ${fav ? 'settings-toggle--on' : ''}`}
              onClick={() => setFav(!fav)}
            />
          </div>

          <div className="form-divider" />

          {/* Dynamic fields */}
          {currentFields.map(renderField)}
          {renderSeedSection()}
        </div>

        {/* Footer sticky — selalu terlihat */}
        <div className="entry-form-page__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Entri'}
          </button>
        </div>
      </div>

      {/* Password Generator */}
      {showPwGen && (
        <div className="modal-overlay" role="dialog" aria-modal="true"
          onClick={() => setShowPwGen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PasswordGenerator
              onUse={(pw) => { setField(pwGenTarget, pw); setShowPwGen(false); }}
              onClose={() => setShowPwGen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
