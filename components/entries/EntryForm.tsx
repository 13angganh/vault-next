'use client';

/**
 * Vault Next — EntryForm
 * Diperbaiki: Struktur Flexbox ketat untuk memastikan Card Form memiliki scroll independen
 * dan Background Body terkunci.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAppStore }             from '@/lib/store/appStore';
import { saveVault }                from '@/lib/vaultService';
import { CategoryIcon }             from '@/components/entries/CategoryIcon';
import { PasswordStrengthMeter }    from '@/components/ui/PasswordStrengthMeter';
import { PasswordGenerator }        from '@/components/ui/PasswordGenerator';
import { DEFAULT_CATEGORIES }       from '@/lib/types';
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
  key:         FieldKey;
  label:       string;
  type?:       'text' | 'password' | 'url' | 'email' | 'textarea';
  placeholder?: string;
  sensitive?:  boolean;
  mono?:       boolean;
  hint?:       string;
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
    { key: 'note',       label: 'Catatan / Seed Phrase (teks)', type: 'textarea', hint: 'Atau masukkan seed phrase di bawah (word-by-word)' },
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
  return FIELDS_BY_CAT['lainnya'];
}

export function EntryForm({ entry, onClose, onSaved }: EntryFormProps) {
  const store      = useAppStore();
  const customCats = store.customCats;
  const allCats    = [...DEFAULT_CATEGORIES, ...customCats];

  const isEdit = !!entry;

  const [cat,         setCat]         = useState(entry?.cat ?? 'sosmed');
  const [name,        setName]        = useState(entry?.name ?? '');
  const [fav,         setFav]         = useState(entry?.fav ?? false);
  const [values,      setValues]      = useState<Partial<VaultEntry>>(entry ?? {});
  const [nameError,   setNameError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [showPwGen,   setShowPwGen]   = useState(false);
  const [pwGenTarget, setPwGenTarget] = useState<FieldKey>('pass');

  const [seedWords, setSeedWords] = useState<string[]>(entry?.seedPhrase ?? Array(12).fill(''));

  const nameRef = useRef<HTMLInputElement>(null);

  // Kunci Scroll Layar Belakang saat Form Muncul
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

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

  const handlePwGenUse = (pw: string) => {
    setField(pwGenTarget, pw);
    setShowPwGen(false);
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

    const isPasswordField = fd.type === 'password';

    return (
      <div key={fd.key} className="form-group">
        <div className="form-label-row flex justify-between items-center mb-1">
          <label htmlFor={id} className="form-label mb-0">{fd.label}</label>
          {isPasswordField && (
            <button type="button" className="text-xs text-yellow-500 font-medium hover:text-yellow-400" onClick={() => { setPwGenTarget(fd.key); setShowPwGen(true); }}>
              Generator
            </button>
          )}
        </div>
        <input
          id={id}
          type={isPasswordField ? 'text' : (fd.type ?? 'text')}
          className={`input ${fd.mono ? 'mono' : ''}`}
          value={val}
          placeholder={fd.placeholder}
          onChange={(e) => setField(fd.key, e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {fd.sensitive && isPasswordField && val && (
          <PasswordStrengthMeter password={val} />
        )}
      </div>
    );
  };

  const renderSeedSection = () => {
    if (cat !== 'crypto') return null;
    return (
      <div className="form-group">
        <label className="form-label">Seed Phrase (12 atau 24 kata)</label>
        <p className="form-hint mb-2">Isi satu kata per kotak, atau kosongkan jika tidak ada</p>
        <div className="seed-grid grid grid-cols-2 sm:grid-cols-3 gap-2">
          {seedWords.map((w, i) => (
            <div key={i} className="seed-grid__item relative flex items-center">
              <span className="seed-grid__num absolute left-3 text-xs text-gray-500 font-mono">{i + 1}</span>
              <input
                type="text"
                className="input seed-grid__input mono w-full pl-8 pr-2 py-2 bg-[#0d1017] border border-gray-800 rounded-md text-sm"
                value={w}
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
        <div className="seed-grid__actions flex gap-2 mt-3">
          <button type="button" className="btn btn--ghost btn--sm text-xs py-1 px-3" onClick={() => setSeedWords(Array(12).fill(''))}>
            Reset 12 kata
          </button>
          <button type="button" className="btn btn--ghost btn--sm text-xs py-1 px-3" onClick={() => setSeedWords(Array(24).fill(''))}>
            Ganti ke 24 kata
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Entri' : 'Tambah Entri Baru'}>
      {/* Wrapper Utama Modal: Flex-Col dan Max-Height untuk mengunci scroll mandiri */}
      <div className="w-full max-w-md bg-[#07080f] border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header - Tidak ikut terscroll (shrink-0) */}
        <div className="flex-none p-4 border-b border-gray-800 flex justify-between items-center bg-[#07080f] z-10">
          <h2 className="text-lg font-bold text-white m-0">{isEdit ? 'Edit Entri' : 'Tambah Entri Baru'}</h2>
          <button className="text-gray-400 hover:text-white transition-colors" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        {/* Body - Memiliki scroll independen (flex-1 overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          <div className="form-group">
            <label htmlFor="form-name" className="form-label flex gap-1">Nama <span className="text-red-500">*</span></label>
            <input
              ref={nameRef}
              id="form-name"
              type="text"
              className={`input ${nameError ? 'border-red-500' : ''}`}
              value={name}
              placeholder="Contoh: Gmail Utama"
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              autoComplete="off"
            />
            {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="cat-picker flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`flex-none flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${cat === c.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-[#0d1017] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}`}
                  onClick={() => { setCat(c.id); setValues({}); setSeedWords(Array(12).fill('')); }}
                  title={c.label}
                >
                  <CategoryIcon catId={c.id} customCats={customCats} size="sm" />
                  <span className="text-sm font-medium whitespace-nowrap">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group flex items-center justify-between bg-[#0d1017] p-3 rounded-lg border border-gray-800">
            <label htmlFor="form-fav" className="text-sm font-medium text-gray-200 cursor-pointer">Tandai Favorit</label>
            <button
              id="form-fav"
              role="switch"
              aria-checked={fav}
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fav ? 'bg-yellow-500' : 'bg-gray-600'}`}
              onClick={() => setFav(!fav)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fav ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="h-px bg-gray-800 my-4" />
          
          <div className="space-y-4">
            {currentFields.map(renderField)}
            {renderSeedSection()}
          </div>
        </div>

        {/* Footer - Tidak ikut terscroll (shrink-0) */}
        <div className="flex-none p-4 border-t border-gray-800 bg-[#07080f] flex justify-end gap-3 z-10">
          <button className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="px-5 py-2.5 rounded-lg font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Entri'}
          </button>
        </div>
      </div>

      {/* Modal Generator Password juga dilindungi z-index absolut */}
      {showPwGen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-[#07080f] border border-gray-800 rounded-2xl shadow-2xl p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <PasswordGenerator onUse={handlePwGenUse} onClose={() => setShowPwGen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}