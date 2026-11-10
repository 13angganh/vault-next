'use client';

/**
 * Vault Next — PINSettingsPanel
 * Sesi B: refactor pakai Button primitive.
 */

import { useState } from 'react';
import { Lock, Unlock, Plus, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { setupPin, verifyPin, removePin, hasPinSetup } from '@/lib/vaultService';
import { useAppStore } from '@/lib/store/appStore';
import { Button }      from '@/components/ui/primitives';
import { getPinLength, setPinLength, clearPinLength, type PinLength } from '@/lib/pinLength';

type PINMode = 'idle' | 'setup' | 'change-verify' | 'change-new' | 'remove-verify';

export function PINSettingsPanel() {
  const masterPw  = useAppStore((s) => s.masterPw);
  const pinExists = hasPinSetup();

  const [mode,           setMode]           = useState<PINMode>('idle');
  const [pin,            setPin]            = useState('');
  const [pinConf,        setPinConf]        = useState('');
  const [pinErr,         setPinErr]         = useState('');
  const [pinSuccess,     setPinSuccess]     = useState('');
  const [loading,        setLoading]        = useState(false);
  const [localPinExists, setLocalPinExists] = useState(pinExists);
  const [len, setLen] = useState<PinLength>(getPinLength() ?? 6);

  const reset = () => { setMode('idle'); setPin(''); setPinConf(''); setPinErr(''); setPinSuccess(''); };

  const handleSetupSubmit = async () => {
    if (pin.length !== len) { setPinErr(`PIN harus tepat ${len} digit`); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    if (!masterPw) { setPinErr('Tidak dapat membaca master password sesi ini'); return; }
    setLoading(true);
    try {
      await setupPin(pin, masterPw); setPinLength(len);
      setLocalPinExists(true); setPinSuccess('PIN berhasil dibuat!'); setTimeout(reset, 1500);
    } catch { setPinErr('Gagal menyimpan PIN'); } finally { setLoading(false); }
  };

  const handleChangeVerify = async () => {
    if (!pin) { setPinErr('Masukkan PIN lama'); return; }
    setLoading(true);
    try {
      const ok = await verifyPin(pin);
      if (!ok) { setPinErr('PIN salah'); setLoading(false); return; }
      setMode('change-new'); setPin(''); setPinConf(''); setPinErr('');
    } finally { setLoading(false); }
  };

  const handleChangeNew = async () => {
    if (pin.length !== len) { setPinErr(`PIN baru harus tepat ${len} digit`); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    if (!masterPw) { setPinErr('Tidak dapat membaca master password sesi ini'); return; }
    setLoading(true);
    try {
      await setupPin(pin, masterPw); setPinLength(len);
      setPinSuccess('PIN berhasil diubah!'); setTimeout(reset, 1500);
    } catch { setPinErr('Gagal menyimpan PIN baru'); } finally { setLoading(false); }
  };

  const handleRemoveVerify = async () => {
    if (!pin) { setPinErr('Masukkan PIN untuk konfirmasi'); return; }
    setLoading(true);
    try {
      const ok = await verifyPin(pin);
      if (!ok) { setPinErr('PIN salah'); setLoading(false); return; }
      removePin(); clearPinLength(); setLocalPinExists(false); setPinSuccess('PIN berhasil dihapus.'); setTimeout(reset, 1500);
    } finally { setLoading(false); }
  };

  const isNewMode = mode === 'setup' || mode === 'change-new';
  const cap = isNewMode ? len : (getPinLength() ?? 8);
  const renderPinInputs = (withConfirm = false) => (
    <div className="pin-settings__inputs">
      {isNewMode && (
        <div className="pin-len" role="radiogroup" aria-label="Panjang PIN">
          {([6, 4] as PinLength[]).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={len === n}
              className={`pin-len__opt${len === n ? ' pin-len__opt--on' : ''}`}
              onClick={() => { setLen(n); setPin(''); setPinConf(''); setPinErr(''); }}>
              <b>{n} digit</b><small>{n === 6 ? 'Disarankan' : 'Lebih cepat'}</small>
            </button>
          ))}
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="ps-pin">
          {mode === 'change-verify' ? 'PIN Lama' : mode === 'remove-verify' ? 'PIN (konfirmasi)' : mode === 'change-new' ? 'PIN Baru' : `PIN (${len} digit)`}
        </label>
        <input id="ps-pin" className={`input mono ${pinErr ? 'input--error' : ''}`}
          type="password" inputMode="numeric" value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, cap)); setPinErr(''); }}
          placeholder={'•'.repeat(isNewMode ? len : (getPinLength() ?? 4))} autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (mode === 'setup')          handleSetupSubmit();
              if (mode === 'change-verify')  handleChangeVerify();
              if (mode === 'change-new')     handleChangeNew();
              if (mode === 'remove-verify')  handleRemoveVerify();
            }
            if (e.key === 'Escape') reset();
          }}
        />
      </div>
      {withConfirm && (
        <div className="form-group">
          <label className="form-label" htmlFor="ps-pin-conf">Ulangi PIN</label>
          <input id="ps-pin-conf" className={`input mono ${pinErr ? 'input--error' : ''}`}
            type="password" inputMode="numeric" value={pinConf}
            onChange={(e) => { setPinConf(e.target.value.replace(/\D/g, '').slice(0, len)); setPinErr(''); }}
            placeholder={'•'.repeat(len)}
            onKeyDown={(e) => { if (e.key === 'Enter') { if (mode === 'setup') handleSetupSubmit(); if (mode === 'change-new') handleChangeNew(); } }}
          />
        </div>
      )}
      {pinErr    && <p className="form-error">{pinErr}</p>}
      {pinSuccess && <p className="form-hint" style={{ color: 'var(--success)' }}>{pinSuccess}</p>}
    </div>
  );

  const spinner = <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />;

  return (
    <div className="pin-settings">
      {mode === 'idle' && (
        <>
          <div className="pin-settings__status">
            <span className="pin-settings__status-icon">{localPinExists ? <Lock size={20} /> : <Unlock size={20} />}</span>
            <span className="pin-settings__status-text">
              {localPinExists ? `PIN aktif (${getPinLength() ?? '4–8'} digit) — login cepat tersedia` : 'PIN belum dikonfigurasi'}
            </span>
          </div>
          <div className="pin-settings__actions">
            {!localPinExists ? (
              <Button variant="primary" onClick={() => { setMode('setup'); setPinErr(''); }} leftIcon={<Plus size={17} />}>
                Buat PIN
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { setMode('change-verify'); setPinErr(''); }} leftIcon={<Pencil size={17} />}>
                  Ganti PIN
                </Button>
                <Button variant="danger" onClick={() => { setMode('remove-verify'); setPinErr(''); }} leftIcon={<Trash2 size={17} />}>
                  Hapus PIN
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {mode === 'setup' && (
        <>
          <h4 className="pin-settings__form-title">Buat PIN Baru</h4>
          {renderPinInputs(true)}
          <div className="pin-settings__form-actions">
            <Button variant="ghost" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" onClick={handleSetupSubmit} disabled={loading}>
              {loading ? spinner : 'Buat PIN'}
            </Button>
          </div>
        </>
      )}

      {mode === 'change-verify' && (
        <>
          <h4 className="pin-settings__form-title">Verifikasi PIN Lama</h4>
          {renderPinInputs(false)}
          <div className="pin-settings__form-actions">
            <Button variant="ghost" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" onClick={handleChangeVerify} disabled={loading}>
              {loading ? spinner : 'Lanjut'}
            </Button>
          </div>
        </>
      )}

      {mode === 'change-new' && (
        <>
          <h4 className="pin-settings__form-title">PIN Baru</h4>
          {renderPinInputs(true)}
          <div className="pin-settings__form-actions">
            <Button variant="ghost" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" onClick={handleChangeNew} disabled={loading}>
              {loading ? spinner : 'Simpan PIN Baru'}
            </Button>
          </div>
        </>
      )}

      {mode === 'remove-verify' && (
        <>
          <h4 className="pin-settings__form-title">Hapus PIN</h4>
          <p className="pin-settings__warn">
            <AlertTriangle size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Masukkan PIN untuk mengonfirmasi penghapusan.
          </p>
          {renderPinInputs(false)}
          <div className="pin-settings__form-actions">
            <Button variant="ghost" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="danger" onClick={handleRemoveVerify} disabled={loading} leftIcon={!loading ? <Trash2 size={17} /> : undefined}>
              {loading ? spinner : 'Hapus PIN'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
