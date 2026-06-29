'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button, Toggle, ConfirmDialog } from '@/components/ui/primitives';
import { useAppStore }           from '@/lib/store/appStore';
import { saveVault }              from '@/lib/vaultService';
import { CategoryIcon }           from '@/components/entries/CategoryIcon';
import { PasswordStrengthMeter }  from '@/components/ui/PasswordStrengthMeter';
import { PasswordGenerator }      from '@/components/ui/PasswordGenerator';
import { DEFAULT_CATEGORIES }     from '@/lib/types';
import type { VaultEntry, CustomCategory } from '@/lib/types';
import { generateId } from '@/lib/utils';  // F2-11

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
  note: [
    { key: 'note', label: 'Isi Catatan', type: 'textarea' },
    { key: 'url',  label: 'Referensi / URL', type: 'url' },
  ],
};

function getFieldsForCat(catId: string, customCats: CustomCategory[]): FieldDef[] {
  if (FIELDS_BY_CAT[catId]) return FIELDS_BY_CAT[catId];
  // Custom category — cek apakah punya config, fallback ke 'lainnya' (F2-10)
  const customCat = customCats.find((c) => c.id === catId);
  if (customCat) return FIELDS_BY_CAT['lainnya'];
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
  // v1.4.0: visibility toggle per field password — default tersembunyi
  const [pwVisible,   setPwVisible]   = useState<Record<string, boolean>>({});
  const togglePwVisible = (key: string) =>
    setPwVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  // v1.4.0: konfirmasi sebelum ganti kategori menghapus field yang sudah diisi
  const [pendingCat,  setPendingCat]  = useState<string | null>(null);
  const [confirmEmptyEntry, setConfirmEmptyEntry] = useState(false);
  const [seedWords,   setSeedWords]   = useState<string[]>(entry?.seedPhrase ?? Array(12).fill(''));
  const [seedMode,    setSeedMode]    = useState<'grid' | 'text'>('grid');

  /* Konversi seedWords ↔ textarea text */
  const seedToText = (words: string[]) => words.map((w) => w.trim()).filter(Boolean).join(' ');
  const textToSeed = (text: string, count: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const arr = Array(count).fill('');
    words.slice(0, count).forEach((w, i) => { arr[i] = w; });
    return arr;
  };

  /* Raw text state untuk seed textarea — agar spasi bisa diketik bebas
   * seedWords di-update saat blur (selesai ketik), bukan tiap keystroke */
  const [seedRawText, setSeedRawText] = useState(() => seedToText(
    (typeof entry !== 'undefined' && entry?.seedPhrase) ? entry.seedPhrase : Array(12).fill('')
  ));

  const switchSeedMode = (next: 'grid' | 'text') => {
    if (next === 'text') {
      // Sync raw text dari seedWords terkini saat masuk mode text
      setSeedRawText(seedToText(seedWords));
    } else {
      // Commit raw text ke seedWords sebelum pindah ke grid
      setSeedWords(textToSeed(seedRawText, seedWords.length));
    }
    setSeedMode(next);
  };

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
    // v1.4.0: warning jika entri akan disimpan tanpa data apapun selain nama
    if (!hasFilledFields()) {
      setConfirmEmptyEntry(true);
      return;
    }
    await doSave();
  };
  const doSave = async () => {
    setSaving(true);
    try {
      // Jika sedang di text mode, commit raw text ke seedWords sebelum save
      const finalSeedWords = seedMode === 'text'
        ? textToSeed(seedRawText, seedWords.length)
        : seedWords;

      const newEntry: VaultEntry = {
        ...(entry ?? {}),
        ...values,
        id:   entry?.id ?? generateId(),
        cat,
        name: name.trim(),
        fav,
        ts:   Date.now(),
        ...(cat === 'crypto' && finalSeedWords.some((w) => w.trim())
          ? { seedPhrase: finalSeedWords.map((w) => w.trim()).filter(Boolean) }
          : {}),
      };
      let newVault: VaultEntry[];
      if (isEdit) {
        newVault = store.vault.map((e) => (e.id === newEntry.id ? newEntry : e));
      } else {
        newVault = [newEntry, ...store.vault];
      }
      store.setVault(newVault);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, newVault, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds);
      onSaved(newEntry);
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan entri:', err);
    } finally {
      setSaving(false);
    }
  };

  // v1.4.0: ganti kategori menghapus field — cek isi dulu, konfirmasi jika perlu
  const hasFilledFields = () =>
    Object.entries(values).some(([k, v]) => k !== 'cat' && k !== 'name' && k !== 'fav' && !!v) ||
    seedWords.some((w) => w.trim() !== '');

  const doCatChange = (catId: string) => {
    setCat(catId);
    setValues({});
    setSeedWords(Array(12).fill(''));
  };

  const handleCatChange = (catId: string) => {
    if (catId === cat) return;
    if (hasFilledFields()) {
      setPendingCat(catId);
    } else {
      doCatChange(catId);
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
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
          />
        </div>
      );
    }
    const isPw = fd.type === 'password';
    const isFieldVisible = pwVisible[fd.key] ?? false;
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
        <div className={isPw ? 'form-pw-input-row' : undefined}>
          <input
            id={id}
            type={isPw && !isFieldVisible ? 'password' : (fd.type ?? 'text')}
            className={`input ${fd.mono ? 'mono' : ''} ${isPw ? 'form-pw-input' : ''}`}
            value={val}
            placeholder={fd.placeholder}
            onChange={(e) => setField(fd.key, e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {isPw && (
            <button
              type="button"
              className="form-pw-toggle btn-icon"
              onClick={() => togglePwVisible(fd.key)}
              aria-label={isFieldVisible ? `Sembunyikan ${fd.label}` : `Tampilkan ${fd.label}`}
              tabIndex={-1}
            >
              {isFieldVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {fd.sensitive && isPw && val && <PasswordStrengthMeter password={val} />}
      </div>
    );
  };

  const renderSeedSection = () => {
    if (cat !== 'crypto') return null;
    const wordCount = seedWords.length; // 12 atau 24

    return (
      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Seed Phrase ({wordCount} kata)</label>
          {/* Tab switcher mode */}
          <div className="seed-mode-tabs">
            <button
              type="button"
              className={`seed-mode-tab${seedMode === 'grid' ? ' seed-mode-tab--active' : ''}`}
              onClick={() => switchSeedMode('grid')}
            >
              Per Kata
            </button>
            <button
              type="button"
              className={`seed-mode-tab${seedMode === 'text' ? ' seed-mode-tab--active' : ''}`}
              onClick={() => switchSeedMode('text')}
            >
              Teks
            </button>
          </div>
        </div>

        {/* Mode 1: Grid per kata */}
        {seedMode === 'grid' && (
          <>
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
          </>
        )}

        {/* Mode 2: Textarea semua kata sekaligus (pisah spasi) */}
        {seedMode === 'text' && (
          <>
            <p className="form-hint">
              Ketik atau tempel semua kata seed phrase, pisahkan dengan spasi. {wordCount} kata.
            </p>
            <textarea
              className="input form-textarea mono"
              value={seedRawText}
              placeholder={`kata1 kata2 kata3 … (${wordCount} kata, pisahkan spasi)`}
              rows={wordCount === 12 ? 3 : 5}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="next"
              onChange={(e) => {
                // Simpan raw text apa adanya — jangan parse, agar spasi bisa diketik
                setSeedRawText(e.target.value);
              }}
              onBlur={(e) => {
                // Parse ke seedWords hanya saat selesai ketik (blur)
                setSeedWords(textToSeed(e.target.value, wordCount));
              }}
            />
            {/* Tampilkan jumlah kata terisi */}
            {(() => {
              const filled = seedRawText.trim().split(/\s+/).filter(Boolean).length;
              const hasContent = seedRawText.trim().length > 0;
              return hasContent ? (
                <p className="form-hint" style={{
                  color: filled === wordCount ? 'var(--success)' : filled > wordCount ? 'var(--red)' : 'var(--muted2)',
                }}>
                  {filled}/{wordCount} kata{filled === wordCount ? ' — lengkap ✓' : filled > wordCount ? ' — terlalu banyak' : ''}
                </p>
              ) : null;
            })()}
          </>
        )}

        {/* Actions: reset + ganti panjang — berlaku di kedua mode */}
        <div className="seed-grid__actions">
          <Button variant="ghost" size="sm" onClick={() => {
            setSeedWords(Array(12).fill(''));
            setSeedRawText('');
          }}>
            Reset 12 kata
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            // Saat ganti panjang, pertahankan kata yang sudah ada
            const current = seedMode === 'text'
              ? textToSeed(seedRawText, 24)
              : seedWords.filter((w) => w.trim()).map((w, _i) => w).concat(Array(24).fill('')).slice(0, 24);
            const next = Array(24).fill('');
            current.slice(0, 24).forEach((w, i) => { next[i] = w; });
            setSeedWords(next);
            setSeedRawText(seedToText(next));
          }}>
            Ganti ke 24 kata
          </Button>
          {wordCount === 24 && (
            <Button variant="ghost" size="sm" onClick={() => {
              const current = seedMode === 'text'
                ? textToSeed(seedRawText, 12)
                : seedWords.filter((w) => w.trim()).slice(0, 12);
              const next = Array(12).fill('');
              current.slice(0, 12).forEach((w, i) => { next[i] = w; });
              setSeedWords(next);
              setSeedRawText(seedToText(next));
            }}>
              Kembali ke 12 kata
            </Button>
          )}
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

        {/* Header sticky — konsisten dengan page-header token */}
        <div className="page-header">
          <button className="page-header__back" onClick={onClose} aria-label="Kembali">
            <ArrowLeft size={18} />
          </button>
          <h2 className="page-header__title">
            {isEdit ? 'Edit Entri' : 'Tambah Entri Baru'}
          </h2>
          <button className="page-header__back" onClick={onClose} aria-label="Tutup" title="Tutup">
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
                  onClick={() => handleCatChange(c.id)}
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
            <Toggle checked={fav} onChange={setFav} label="Tandai Favorit" />
          </div>

          <div className="form-divider" />

          {/* Dynamic fields */}
          {currentFields.map(renderField)}
          {renderSeedSection()}
        </div>

        {/* Footer sticky — selalu terlihat */}
        <div className="entry-form-page__footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Batal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Entri'}
          </Button>
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

      {/* ── Confirm: Ganti Kategori (akan hapus field yang sudah diisi) ── */}
      <ConfirmDialog
        open={pendingCat !== null}
        onCancel={() => setPendingCat(null)}
        onConfirm={() => {
          if (pendingCat) doCatChange(pendingCat);
          setPendingCat(null);
        }}
        title="Ganti Kategori?"
        message="Field yang sudah diisi akan dikosongkan karena setiap kategori punya field berbeda. Data yang belum disimpan akan hilang."
        confirmLabel="Ganti Kategori"
        variant="warning"
      />

      {/* ── Confirm: Simpan Entri Kosong ── */}
      <ConfirmDialog
        open={confirmEmptyEntry}
        onCancel={() => setConfirmEmptyEntry(false)}
        onConfirm={() => { setConfirmEmptyEntry(false); doSave(); }}
        title="Simpan Entri Tanpa Data?"
        message={<>Entri <strong>{name.trim()}</strong> akan disimpan tanpa password, username, atau data lain. Anda bisa mengisinya nanti.</>}
        confirmLabel="Simpan Tetap"
        variant="warning"
      />
    </>
  );
}
