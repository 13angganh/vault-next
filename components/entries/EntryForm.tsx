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
import type { VaultEntry, CustomCategory, CategoryFieldDef } from '@/lib/types';
import { generateId } from '@/lib/utils';  // F2-11

interface EntryFormProps {
  entry?:   VaultEntry;
  onClose:  () => void;
  onSaved:  (entry: VaultEntry) => void;
}

// v1.10.0: field kustom (dibuat pengguna lewat Pengaturan > Edit Kategori)
// punya key bebas, bukan hanya properti VaultEntry yang sudah dikenal.
// Pola "branded string" ini mempertahankan autocomplete IDE untuk key
// yang dikenal (fd.key === 'user' tetap type-checked) sambil tetap
// menerima string sembarang untuk field kustom.
type FieldKey = keyof VaultEntry | (string & {});

interface FieldDef {
  key:          FieldKey;
  label:        string;
  type?:        'text' | 'password' | 'url' | 'email' | 'textarea' | 'multi';
  placeholder?: string;
  sensitive?:   boolean;
  mono?:        boolean;
  hint?:        string;
  // v1.10.0: true jika field ini BUKAN properti asli VaultEntry —
  // nilainya dibaca/ditulis dari customFieldValues (state terpisah),
  // bukan dari `values` (Partial<VaultEntry>). Ditentukan otomatis oleh
  // fieldDefFromCategoryField() lewat KNOWN_ENTRY_KEYS di bawah, bukan
  // diisi manual.
  isCustom?:    boolean;
  // v1.10.1: jumlah isian tetap untuk field bertipe 'multi' (grid
  // multi-kotak, pola sama dengan seed phrase/kode cadangan). Hanya
  // relevan saat type === 'multi'.
  multiCount?:  number;
}

// v1.10.0: setiap properti VaultEntry yang bisa jadi target field form
// individual (mengecualikan id/cat/name/fav/ts yang dikelola terpisah
// oleh form, dan customFields yang merupakan WADAH bukan field itu
// sendiri, serta seedPhrase/twoFABackupCodes yang berbentuk array
// dan sudah punya UI section khusus sendiri, bukan renderField biasa).
// Dipakai untuk membedakan field BAWAAN (baca/tulis via `values`) vs
// field KUSTOM (baca/tulis via `customFieldValues`) saat menggabungkan
// FIELDS_BY_CAT dengan override dari pengguna.
export const KNOWN_ENTRY_KEYS = new Set<string>([
  'user', 'pass', 'url', 'note', 'network', 'walletAddr', 'walletPw',
  'cardNo', 'cardHolder', 'cardExpiry', 'cardCVV', 'wifiSSID', 'wifiPass',
  'emailAddr', 'twoFAEnabled', 'twoFAPhone', 'twoFARecoveryEmail',
]);

// v1.10.0: konversi CategoryFieldDef (bentuk tersimpan/serializable, di
// lib/types.ts) menjadi FieldDef (bentuk lokal untuk kebutuhan render
// EntryForm). Heuristik: field type 'password' otomatis dapat
// sensitive+mono, konsisten dengan pola semua field password bawaan
// yang sudah ada di FIELDS_BY_CAT — pengguna yang membuat field kustom
// bertipe password tidak perlu mengatur flag itu manual.
function fieldDefFromCategoryField(cf: CategoryFieldDef): FieldDef {
  const isPw = cf.type === 'password';
  return {
    key:         cf.key,
    label:       cf.label,
    type:        cf.type,
    placeholder: cf.placeholder,
    sensitive:   isPw,
    mono:        isPw,
    isCustom:    !KNOWN_ENTRY_KEYS.has(cf.key),
    multiCount:  cf.multiCount,
  };
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
  // v1.10.2: field 'user' & 'bankAccountNo' dipisah — sebelumnya
  // digabung satu field berlabel "Username / No. Rekening". Data lama
  // (di field 'user') tetap tampil sebagai Username, No. Rekening jadi
  // isian baru terpisah (field baru VaultEntry.bankAccountNo).
  bank: [
    { key: 'user',          label: 'Username' },
    { key: 'bankAccountNo', label: 'No. Rekening', placeholder: '1234567890' },
    { key: 'pass',          label: 'Password', type: 'password', sensitive: true, mono: true },
    { key: 'url',           label: 'URL Mobile Banking', type: 'url', placeholder: 'https://...' },
    { key: 'note',          label: 'Catatan', type: 'textarea' },
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

/**
 * v1.10.0: getFieldsForCat sekarang menggabungkan field bawaan
 * (FIELDS_BY_CAT, hardcode) dengan kustomisasi pengguna, bukan lagi
 * murni statis.
 *
 * - Kategori DEFAULT (ada di FIELDS_BY_CAT): jika pengguna sudah
 *   mengatur override lewat Pengaturan > Edit Kategori (tersimpan di
 *   store.defaultCatFieldOverrides[catId]), override itu yang dipakai.
 *   Jika belum ada override, field bawaan asli tetap berlaku persis
 *   seperti sebelum fitur ini ada — tidak ada perubahan perilaku untuk
 *   pengguna yang belum pernah menyentuh fitur kustomisasi.
 * - Kategori CUSTOM: jika CustomCategory.fields ada & tidak kosong,
 *   itu yang dipakai. Kalau tidak (kategori custom lama, dibuat
 *   sebelum fitur ini), fallback ke field 'lainnya' — perilaku lama,
 *   tidak berubah.
 */
export function getFieldsForCat(
  catId: string,
  customCats: CustomCategory[],
  defaultCatFieldOverrides: Record<string, CategoryFieldDef[]>,
): FieldDef[] {
  if (FIELDS_BY_CAT[catId]) {
    const override = defaultCatFieldOverrides[catId];
    if (override && override.length > 0) {
      return override.map(fieldDefFromCategoryField);
    }
    return FIELDS_BY_CAT[catId];
  }
  // Custom category — pakai field kustomnya jika ada, fallback ke 'lainnya'
  const customCat = customCats.find((c) => c.id === catId);
  if (customCat?.fields && customCat.fields.length > 0) {
    return customCat.fields.map(fieldDefFromCategoryField);
  }
  return FIELDS_BY_CAT['lainnya'];
}

/**
 * v1.10.0: konversi field BAWAAN kategori default (FIELDS_BY_CAT, bentuk
 * FieldDef lokal) menjadi CategoryFieldDef (bentuk tersimpan/serializable
 * di lib/types.ts) — arah kebalikan dari fieldDefFromCategoryField().
 * Diekspor untuk dipakai CategoryManager.tsx sebagai starting point saat
 * pengguna pertama kali membuka editor field kategori default (sebelum
 * override apa pun dibuat), dan sebagai mekanisme "reset ke bawaan".
 * catId di luar FIELDS_BY_CAT (kategori custom) mengembalikan array
 * kosong — pemanggil bertanggung jawab menangani kasus itu terpisah
 * (custom category sudah punya CustomCategory.fields sendiri).
 */
export function getBuiltinFieldsForCat(catId: string): CategoryFieldDef[] {
  const fields = FIELDS_BY_CAT[catId];
  if (!fields) return [];
  return fields.map((fd) => ({
    key:         fd.key,
    label:       fd.label,
    type:        fd.type,
    placeholder: fd.placeholder,
  }));
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
  // v1.10.0: field KUSTOM (key di luar VaultEntry) disimpan terpisah
  // dari `values` di atas karena `values` bertipe Partial<VaultEntry> —
  // key bebas tidak bisa masuk ke situ secara type-safe. Nilai awal
  // dari entry.customFields (data lama yang sudah tersimpan).
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
    entry?.customFields ?? {}
  );
  // v1.10.1: field kustom bertipe 'multi' (grid multi-isian, mis. daftar
  // resep/kode toko) disimpan TERPISAH dari customFieldValues di atas
  // karena bentuknya array per key, bukan string tunggal — meski nilai
  // akhirnya tetap digabung jadi satu string (dipisah newline) saat
  // masuk ke VaultEntry.customFields[key] saat save, konsisten dengan
  // customFields yang tetap Record<string,string>. Di-keyed by field
  // key karena bisa ada LEBIH DARI SATU field multi dalam satu
  // kategori (beda dari backupCodes yang hardcode untuk satu field
  // 2FA saja). Nilai awal: kalau entry.customFields[key] sudah ada,
  // pecah string gabungan itu jadi array lagi.
  const [customMultiValues, setCustomMultiValues] = useState<Record<string, string[]>>({});
  const [customMultiMode,   setCustomMultiMode]   = useState<Record<string, 'grid' | 'text'>>({});
  const [customMultiRawText, setCustomMultiRawText] = useState<Record<string, string>>({});
  const [nameError,   setNameError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  // Pesan saat saveVault gagal (mis. localStorage penuh) — sebelumnya error
  // ini hanya di-console.error tanpa ada indikasi apa pun ke pengguna,
  // sementara state vault di memori sudah kadung berubah (lihat doSave).
  const [saveError,   setSaveError]   = useState('');
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

  // v1.10.0: Verifikasi 2 Langkah (kategori Email) — state kode cadangan
  // memakai pola IDENTIK dengan seedWords/seedMode/seedRawText di atas,
  // hanya beda jumlah tetap (10, tanpa opsi ganti-panjang 12↔24 seperti
  // seed phrase crypto — kode cadangan 2FA selalu 10 kode).
  const [twoFAEnabled, setTwoFAEnabled] = useState(entry?.twoFAEnabled ?? false);
  // v1.10.2: 3 toggle baru untuk perluasan Verifikasi 2 Langkah — pola
  // useState terpisah IDENTIK twoFAEnabled di atas (BUKAN lewat
  // values/setField yang bertipe string — toggle adalah boolean).
  const [twoFAVideoSelfie, setTwoFAVideoSelfie] = useState(entry?.twoFAVideoSelfie ?? false);
  const [twoFAAuthenticatorApp, setTwoFAAuthenticatorApp] = useState(entry?.twoFAAuthenticatorApp ?? false);
  const [twoFAGoogleCommand, setTwoFAGoogleCommand] = useState(entry?.twoFAGoogleCommand ?? false);
  const BACKUP_CODE_COUNT = 10;
  const [backupCodes, setBackupCodes] = useState<string[]>(
    entry?.twoFABackupCodes && entry.twoFABackupCodes.length > 0
      ? Array(BACKUP_CODE_COUNT).fill('').map((_, i) => entry.twoFABackupCodes?.[i] ?? '')
      : Array(BACKUP_CODE_COUNT).fill('')
  );
  const [backupCodeMode, setBackupCodeMode] = useState<'grid' | 'text'>('grid');

  /* Konversi seedWords ↔ textarea text */
  const seedToText = (words: string[]) => words.map((w) => w.trim()).filter(Boolean).join(' ');
  const textToSeed = (text: string, count: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const arr = Array(count).fill('');
    words.slice(0, count).forEach((w, i) => { arr[i] = w; });
    return arr;
  };

  /* v1.10.0: Konversi backupCodes ↔ textarea text — pola sama dengan
   * seedToText/textToSeed di atas, tapi pemisah menerima spasi ATAU
   * baris baru (kode cadangan biasanya ditampilkan layanan satu per
   * baris, beda dari seed phrase yang selalu satu baris dipisah spasi). */
  const codesToText = (codes: string[]) => codes.map((c) => c.trim()).filter(Boolean).join('\n');
  const textToCodes = (text: string, count: number) => {
    const codes = text.trim().split(/[\s\n]+/).filter(Boolean);
    const arr = Array(count).fill('');
    codes.slice(0, count).forEach((c, i) => { arr[i] = c; });
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

  /* v1.10.0: Raw text state untuk backup codes textarea — pola identik
   * dengan seedRawText di atas. */
  const [backupCodesRawText, setBackupCodesRawText] = useState(() => codesToText(
    (typeof entry !== 'undefined' && entry?.twoFABackupCodes) ? entry.twoFABackupCodes : Array(BACKUP_CODE_COUNT).fill('')
  ));

  const switchBackupCodeMode = (next: 'grid' | 'text') => {
    if (next === 'text') {
      setBackupCodesRawText(codesToText(backupCodes));
    } else {
      setBackupCodes(textToCodes(backupCodesRawText, BACKUP_CODE_COUNT));
    }
    setBackupCodeMode(next);
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

  // v1.10.0: setter paralel untuk field kustom — lihat penjelasan di
  // deklarasi state customFieldValues di atas.
  const setCustomField = useCallback((key: string, val: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: val }));
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
    setSaveError('');
    // Simpan vault sebelumnya agar bisa di-rollback jika saveVault gagal —
    // state di memori (store.setVault) tidak boleh "terlanjur berubah" saat
    // penulisan ke localStorage sebenarnya gagal, atau UI jadi berbohong
    // tentang apa yang benar-benar tersimpan.
    const prevVault = store.vault;
    try {
      // Jika sedang di text mode, commit raw text ke seedWords sebelum save
      const finalSeedWords = seedMode === 'text'
        ? textToSeed(seedRawText, seedWords.length)
        : seedWords;

      // v1.10.0: sama seperti seed phrase — commit raw text mode dulu
      // sebelum save. Kode cadangan disimpan terlepas dari status toggle
      // twoFAEnabled (supaya data yang sudah diisi tidak hilang kalau
      // toggle tidak sengaja dimatikan sebelum save) — twoFAEnabled sendiri
      // tetap tersimpan sebagai penanda status terpisah.
      const finalBackupCodes = backupCodeMode === 'text'
        ? textToCodes(backupCodesRawText, BACKUP_CODE_COUNT)
        : backupCodes;

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
        ...(cat === 'email'
          ? {
              twoFAEnabled: twoFAEnabled,
              // v1.10.2: 3 toggle baru (state React terpisah, bukan
              // bagian dari `values` — sama seperti twoFAEnabled) harus
              // disertakan eksplisit di sini juga, tidak ikut otomatis
              // lewat spread ...values di atas.
              twoFAVideoSelfie: twoFAVideoSelfie,
              twoFAAuthenticatorApp: twoFAAuthenticatorApp,
              twoFAGoogleCommand: twoFAGoogleCommand,
              // v1.10.2: twoFAGoogleCommandDevice hanya relevan saat
              // togglenya aktif — kalau twoFAGoogleCommand mati, JANGAN
              // simpan device meski user sempat mengetiknya sebelum
              // mematikan toggle (data usang tidak boleh menempel diam-diam).
              ...(twoFAGoogleCommand ? {} : { twoFAGoogleCommandDevice: undefined }),
              ...(finalBackupCodes.some((c) => c.trim())
                ? { twoFABackupCodes: finalBackupCodes.map((c) => c.trim()).filter(Boolean) }
                : {}),
            }
          : {}),
        // v1.10.0: hanya sertakan customFields kalau kategori saat ini
        // benar-benar punya field kustom (filter berdasar currentFields,
        // BUKAN seluruh customFieldValues mentah) — mencegah nilai field
        // kustom dari kategori lain "menempel" terbawa saat entri
        // disimpan, konsisten dengan penanganan seedWords/backupCodes
        // di doCatChange saat ganti kategori.
        ...(() => {
          const customKeys = currentFields.filter((f) => f.isCustom).map((f) => f.key);
          if (customKeys.length === 0) return {};
          const filtered: Record<string, string> = {};
          for (const k of customKeys) {
            const fieldDef = currentFields.find((f) => f.key === k);
            if (fieldDef?.type === 'multi') {
              // v1.10.1: field multi — commit dulu kalau sedang di mode
              // teks (belum sempat blur), lalu serialisasi array jadi
              // satu string dipisah newline (pola sama seed phrase/kode
              // cadangan, tapi generik per field key).
              const count = fieldDef.multiCount ?? 10;
              const mode  = customMultiMode[k] ?? 'grid';
              const arr   = mode === 'text'
                ? (customMultiRawText[k] ?? '').trim().split(/[\s\n]+/).filter(Boolean).slice(0, count)
                : (customMultiValues[k] ?? []);
              const joined = arr.map((s) => s.trim()).filter(Boolean).join('\n');
              if (joined) filtered[k] = joined;
              continue;
            }
            const v = customFieldValues[k];
            if (v && v.trim()) filtered[k] = v.trim();
          }
          return Object.keys(filtered).length > 0 ? { customFields: filtered } : {};
        })(),
      };
      let newVault: VaultEntry[];
      if (isEdit) {
        newVault = store.vault.map((e) => (e.id === newEntry.id ? newEntry : e));
      } else {
        newVault = [newEntry, ...store.vault];
      }
      store.setVault(newVault);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await saveVault(store.masterPw, newVault, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds, store.lockedCatIds, store.defaultCatFieldOverrides);
      onSaved(newEntry);
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan entri:', err);
      store.setVault(prevVault); // rollback — jangan biarkan memori beda dari yang tersimpan
      setSaveError(
        err instanceof Error && err.message
          ? err.message
          : 'Gagal menyimpan entri. Coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  };

  // v1.4.0: ganti kategori menghapus field — cek isi dulu, konfirmasi jika perlu
  const hasFilledFields = () =>
    Object.entries(values).some(([k, v]) => k !== 'cat' && k !== 'name' && k !== 'fav' && !!v) ||
    seedWords.some((w) => w.trim() !== '') ||
    backupCodes.some((c) => c.trim() !== '') ||
    Object.values(customFieldValues).some((v) => v.trim() !== '') ||
    Object.values(customMultiValues).some((arr) => arr.some((v) => v.trim() !== ''));

  const doCatChange = (catId: string) => {
    setCat(catId);
    setValues({});
    setSeedWords(Array(12).fill(''));
    setSeedRawText('');
    // v1.10.0: reset state 2FA juga saat ganti kategori — sama seperti
    // seedWords, field kategori-spesifik tidak boleh "menempel" saat
    // pindah ke kategori lain lalu balik lagi.
    setTwoFAEnabled(false);
    // v1.10.2: reset 3 toggle baru juga — sama alasannya seperti twoFAEnabled.
    setTwoFAVideoSelfie(false);
    setTwoFAAuthenticatorApp(false);
    setTwoFAGoogleCommand(false);
    setBackupCodes(Array(BACKUP_CODE_COUNT).fill(''));
    setBackupCodesRawText('');
    // v1.10.0: reset field kustom juga — sama alasannya seperti di atas.
    setCustomFieldValues({});
    // v1.10.1: reset state field multi juga.
    setCustomMultiValues({});
    setCustomMultiMode({});
    setCustomMultiRawText({});
  };

  const handleCatChange = (catId: string) => {
    if (catId === cat) return;
    if (hasFilledFields()) {
      setPendingCat(catId);
    } else {
      doCatChange(catId);
    }
  };

  const currentFields = getFieldsForCat(cat, customCats, store.defaultCatFieldOverrides);

  // v1.10.1: inisialisasi customMultiValues dari entry.customFields untuk
  // field bertipe 'multi' — dijalankan sekali saat currentFields pertama
  // kali diketahui memuat field multi (mode edit entri lama). Guard
  // `Object.keys(customMultiValues).length === 0` mencegah effect ini
  // menimpa perubahan yang sedang diketik pengguna pada render berikutnya
  // (currentFields bisa berubah referensi tiap render karena dihitung
  // ulang, tapi inisialisasi hanya boleh terjadi SEKALI).
  useEffect(() => {
    if (!entry?.customFields) return;
    const multiFields = currentFields.filter((f) => f.type === 'multi');
    if (multiFields.length === 0) return;
    setCustomMultiValues((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const init: Record<string, string[]> = {};
      for (const f of multiFields) {
        const raw = entry.customFields?.[f.key];
        const count = f.multiCount ?? 10;
        init[f.key] = raw
          ? Array(count).fill('').map((_, i) => raw.split('\n')[i] ?? '')
          : Array(count).fill('');
      }
      return init;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFields.length]);

  /**
   * v1.10.1: render field kustom bertipe 'multi' — grid multi-kotak
   * bernomor ATAU mode teks satu blok, pola IDENTIK dengan
   * renderTwoFASection's backup codes di bawah, tapi generik untuk
   * field key APA PUN (bukan hardcode ke field 2FA), sehingga bisa
   * dipakai berkali-kali untuk beberapa field multi berbeda dalam satu
   * kategori. State diakses via fd.key sebagai key ke
   * customMultiValues/customMultiMode/customMultiRawText.
   */
  const renderMultiField = (fd: FieldDef) => {
    const count = fd.multiCount ?? 10;
    const arr   = customMultiValues[fd.key] ?? Array(count).fill('');
    const mode  = customMultiMode[fd.key] ?? 'grid';
    const rawText = customMultiRawText[fd.key] ?? '';

    const setArr = (next: string[]) => setCustomMultiValues((prev) => ({ ...prev, [fd.key]: next }));
    const setMode = (m: 'grid' | 'text') => setCustomMultiMode((prev) => ({ ...prev, [fd.key]: m }));
    const setRaw = (t: string) => setCustomMultiRawText((prev) => ({ ...prev, [fd.key]: t }));

    const arrToText = (a: string[]) => a.map((s) => s.trim()).filter(Boolean).join('\n');
    const textToArr = (t: string, n: number) => {
      const items = t.trim().split(/[\s\n]+/).filter(Boolean);
      const out = Array(n).fill('');
      items.slice(0, n).forEach((it, i) => { out[i] = it; });
      return out;
    };

    const switchMode = (next: 'grid' | 'text') => {
      if (next === 'text') setRaw(arrToText(arr));
      else setArr(textToArr(rawText, count));
      setMode(next);
    };

    return (
      <div key={fd.key} className="form-group">
        <div className="form-label-row">
          <label className="form-label">{fd.label || 'Field'} ({count} isian)</label>
          <div className="seed-mode-tabs">
            <button type="button" className={`seed-mode-tab${mode === 'grid' ? ' seed-mode-tab--active' : ''}`}
              onClick={() => switchMode('grid')}>Per Isian</button>
            <button type="button" className={`seed-mode-tab${mode === 'text' ? ' seed-mode-tab--active' : ''}`}
              onClick={() => switchMode('text')}>Teks</button>
          </div>
        </div>

        {mode === 'grid' && (
          <div className="seed-grid">
            {arr.map((v, i) => (
              <div key={i} className="seed-grid__item">
                <span className="seed-grid__num">{i + 1}</span>
                <input
                  type="text"
                  className="input seed-grid__input mono"
                  value={v}
                  placeholder={`isian ${i + 1}`}
                  onChange={(e) => {
                    const updated = [...arr];
                    updated[i] = e.target.value;
                    setArr(updated);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        )}

        {mode === 'text' && (
          <textarea
            className="input form-textarea mono"
            value={rawText}
            placeholder={`isian1\nisian2\n… (${count} isian)`}
            rows={5}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={(e) => setArr(textToArr(e.target.value, count))}
          />
        )}
      </div>
    );
  };

  const renderField = (fd: FieldDef) => {
    if (fd.type === 'multi') return renderMultiField(fd);
    // v1.10.0: field kustom baca/tulis dari customFieldValues (state
    // terpisah, key bebas), field bawaan tetap dari values seperti
    // sebelumnya — lihat penjelasan lengkap di deklarasi state
    // customFieldValues dan interface FieldDef.isCustom di atas.
    const val = fd.isCustom
      ? (customFieldValues[fd.key] ?? '')
      : ((values[fd.key as keyof VaultEntry] as string) ?? '');
    const handleChange = (v: string) => fd.isCustom ? setCustomField(fd.key, v) : setField(fd.key, v);
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
            onChange={(e) => handleChange(e.target.value)}
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
            // PENTING: type SELALU 'text' untuk field password, TIDAK
            // PERNAH 'password'. Root cause bug sebelumnya: MDN secara
            // eksplisit menyatakan -webkit-text-security "only affects
            // fields that are not of type=password" — jadi saat type masih
            // 'password' di state tersembunyi, browser boleh mengabaikan
            // CSS masking ini sepenuhnya dan mengandalkan masking native
            // type=password, yang lalu tidak konsisten ter-refresh saat
            // type berganti ke 'text' di state terlihat. Dengan type SELALU
            // 'text', masking 100% dikendalikan CSS (form-pw-input--masked
            // di bawah) tanpa ambiguitas sama sekali — dan karena atribut
            // type tidak pernah berubah lagi, TIDAK PERLU key dinamis untuk
            // memaksa remount: className yang berubah pada elemen yang
            // sama sudah cukup memicu browser menerapkan ulang CSS.
            // (key dinamis sempat dicoba tapi dilepas lagi — remount
            // ternyata mengganggu fokus/keyboard virtual saat toggle
            // dilakukan sambil sedang mengetik, dan memicu replay animasi
            // visual yang tidak diinginkan pada elemen.)
            type={isPw ? 'text' : (fd.type ?? 'text')}
            className={`input ${fd.mono ? 'mono' : ''} ${isPw ? 'form-pw-input' : ''} ${isPw && !isFieldVisible ? 'form-pw-input--masked' : ''}`}
            value={val}
            placeholder={fd.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {isPw && (
            <button
              type="button"
              className="form-pw-toggle btn-icon"
              // Cegah button mengambil fokus dari input saat ditekan sambil
              // sedang mengetik — mousedown/touchstart pada button biasanya
              // memicu blur di input terlebih dulu sebelum onClick jalan,
              // yang bisa race dengan keyboard virtual (gejala: toggle
              // "kadang tidak bisa" saat sedang mengetik). Fokus jadi
              // tetap di input sepanjang toggle terjadi.
              onMouseDown={(e) => e.preventDefault()}
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

  // v1.10.0: Verifikasi 2 Langkah (kategori Email). Pola input kode
  // cadangan IDENTIK dengan renderSeedSection() di atas (grid per-item
  // bernomor / mode teks satu blok) — beda hanya jumlah tetap 10 (tanpa
  // tombol ganti-panjang 12↔24 seperti seed phrase crypto, karena kode
  // cadangan 2FA selalu 10 kode) dan field toggle + 2 field pemulihan
  // tambahan sebelum blok kode.
  const renderTwoFASection = () => {
    if (cat !== 'email') return null;

    return (
      <div className="form-group">
        <div className="form-divider" />
        <div className="form-label-row">
          <label className="form-label">Verifikasi 2 Langkah</label>
          <Toggle checked={twoFAEnabled} onChange={setTwoFAEnabled} label="Verifikasi 2 Langkah" />
        </div>

        {twoFAEnabled && (
          <>
            <div className="form-group">
              <label htmlFor="form-2fa-phone" className="form-label">Nomor Telepon Pemulihan</label>
              <input
                id="form-2fa-phone"
                type="text"
                inputMode="tel"
                className="input"
                value={(values.twoFAPhone as string) ?? ''}
                placeholder="+62 812-3456-7890"
                onChange={(e) => setField('twoFAPhone', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-2fa-recovery-email" className="form-label">Email Pemulihan</label>
              <input
                id="form-2fa-recovery-email"
                type="email"
                className="input"
                value={(values.twoFARecoveryEmail as string) ?? ''}
                placeholder="pemulihan@contoh.com"
                onChange={(e) => setField('twoFARecoveryEmail', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* v1.10.2: 5 opsi tambahan Verifikasi 2 Langkah — permintaan
                eksplisit pengguna, di luar 3 field yang sudah ada di atas. */}
            <div className="form-group">
              <Toggle
                checked={twoFAVideoSelfie}
                onChange={setTwoFAVideoSelfie}
                label="Video Selfie"
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-2fa-security-key" className="form-label">Kunci Sandi &amp; Kunci Keamanan</label>
              <input
                id="form-2fa-security-key"
                type="text"
                className="input"
                value={(values.twoFASecurityKey as string) ?? ''}
                placeholder="mis. YubiKey 5C, Passkey iPhone"
                onChange={(e) => setField('twoFASecurityKey', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <Toggle
                checked={twoFAAuthenticatorApp}
                onChange={setTwoFAAuthenticatorApp}
                label="Authenticator App"
              />
            </div>

            <div className="form-group">
              <Toggle
                checked={twoFAGoogleCommand}
                onChange={setTwoFAGoogleCommand}
                label="Perintah Google"
              />
              {twoFAGoogleCommand && (
                <input
                  type="text"
                  className="input"
                  style={{ marginTop: 'var(--space-2)' }}
                  value={(values.twoFAGoogleCommandDevice as string) ?? ''}
                  placeholder="Merk & tipe HP terhubung, mis. Samsung Galaxy S24"
                  onChange={(e) => setField('twoFAGoogleCommandDevice', e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="form-2fa-primary-phone" className="form-label">Nomor Telepon Verifikasi 2 Langkah</label>
              <input
                id="form-2fa-primary-phone"
                type="text"
                inputMode="tel"
                className="input"
                value={(values.twoFAPrimaryPhone as string) ?? ''}
                placeholder="+62 812-3456-7890"
                onChange={(e) => setField('twoFAPrimaryPhone', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Kode Cadangan ({BACKUP_CODE_COUNT} kode)</label>
                <div className="seed-mode-tabs">
                  <button
                    type="button"
                    className={`seed-mode-tab${backupCodeMode === 'grid' ? ' seed-mode-tab--active' : ''}`}
                    onClick={() => switchBackupCodeMode('grid')}
                  >
                    Per Kode
                  </button>
                  <button
                    type="button"
                    className={`seed-mode-tab${backupCodeMode === 'text' ? ' seed-mode-tab--active' : ''}`}
                    onClick={() => switchBackupCodeMode('text')}
                  >
                    Teks
                  </button>
                </div>
              </div>

              {/* Mode 1: Grid per kode */}
              {backupCodeMode === 'grid' && (
                <>
                  <p className="form-hint">Isi satu kode per kotak</p>
                  <div className="seed-grid">
                    {backupCodes.map((c, i) => (
                      <div key={i} className="seed-grid__item">
                        <span className="seed-grid__num">{i + 1}</span>
                        <input
                          type="text"
                          className="input seed-grid__input mono"
                          value={c}
                          placeholder={`kode ${i + 1}`}
                          onChange={(e) => {
                            const updated = [...backupCodes];
                            updated[i] = e.target.value;
                            setBackupCodes(updated);
                          }}
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Mode 2: Textarea semua kode sekaligus (pisah spasi/baris) */}
              {backupCodeMode === 'text' && (
                <>
                  <p className="form-hint">
                    Ketik atau tempel semua kode cadangan, satu per baris atau dipisah spasi. {BACKUP_CODE_COUNT} kode.
                  </p>
                  <textarea
                    className="input form-textarea mono"
                    value={backupCodesRawText}
                    placeholder={`kode1\nkode2\nkode3\n… (${BACKUP_CODE_COUNT} kode)`}
                    rows={5}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="text"
                    enterKeyHint="next"
                    onChange={(e) => setBackupCodesRawText(e.target.value)}
                    onBlur={(e) => setBackupCodes(textToCodes(e.target.value, BACKUP_CODE_COUNT))}
                  />
                  {(() => {
                    const filled = backupCodesRawText.trim().split(/[\s\n]+/).filter(Boolean).length;
                    const hasContent = backupCodesRawText.trim().length > 0;
                    return hasContent ? (
                      <p className="form-hint" style={{
                        color: filled === BACKUP_CODE_COUNT ? 'var(--success)' : filled > BACKUP_CODE_COUNT ? 'var(--red)' : 'var(--muted2)',
                      }}>
                        {filled}/{BACKUP_CODE_COUNT} kode{filled === BACKUP_CODE_COUNT ? ' — lengkap ✓' : filled > BACKUP_CODE_COUNT ? ' — terlalu banyak' : ''}
                      </p>
                    ) : null;
                  })()}
                </>
              )}

              <div className="seed-grid__actions">
                <Button variant="ghost" size="sm" onClick={() => {
                  setBackupCodes(Array(BACKUP_CODE_COUNT).fill(''));
                  setBackupCodesRawText('');
                }}>
                  Kosongkan Kode
                </Button>
              </div>
            </div>
          </>
        )}
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
          {renderTwoFASection()}
        </div>

        {/* Footer sticky — selalu terlihat */}
        <div className="entry-form-page__footer">
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
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
