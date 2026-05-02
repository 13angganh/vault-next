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

  const reset = () => { setMode('idle'); setPin(''); setPinConf(''); setPinErr(''); setPinSuccess(''); };

  const handleSetupSubmit = async () => {
    if (pin.length < 4) { setPinErr('PIN minimal 4 digit'); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    if (!masterPw) { setPinErr('Tidak dapat membaca master password sesi ini'); return; }
    setLoading(true);
    try {
      await setupPin(pin, masterPw);
      setLocalPinExists(true); setPinSuccess('✅ PIN berhasil dibuat!'); setTimeout(reset, 1500);
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
    if (pin.length < 4) { setPinErr('PIN baru minimal 4 digit'); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    if (!masterPw) { setPinErr('Tidak dapat membaca master password sesi ini'); return; }
    setLoading(true);
    try {
      await setupPin(pin, masterPw);
      setPinSuccess('✅ PIN berhasil diubah!'); setTimeout(reset, 1500);
    } catch { setPinErr('Gagal menyimpan PIN baru'); } finally { setLoading(false); }
  };

  const handleRemoveVerify = async () => {
    if (!pin) { setPinErr('Masukkan PIN untuk konfirmasi'); return; }
    setLoading(true);
    try {
      const ok = await verifyPin(pin);
      if (!ok) { setPinErr('PIN salah'); setLoading(false); return; }
      removePin(); setLocalPinExists(false); setPinSuccess('✅ PIN berhasil dihapus.'); setTimeout(reset, 1500);
    } finally { setLoading(false); }
  };

  const renderPinInputs = (withConfirm = false) => (
    <div className="pin-settings__inputs">
      <div className="form-group">
        <label className="form-label" htmlFor="ps-pin">
          {mode === 'change-verify' ? 'PIN Lama' : mode === 'remove-verify' ? 'PIN (konfirmasi)' : mode === 'change-new' ? 'PIN Baru' : 'PIN (4–8 digit)'}
        </label>
        <input id="ps-pin" className={`input mono ${pinErr ? 'input--error' : ''}`}
          type="password" inputMode="numeric" value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinErr(''); }}
          placeholder="••••" autoFocus
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
            onChange={(e) => { setPinConf(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinErr(''); }}
            placeholder="••••"
            onKeyDown={(e) => { if (e.key === 'Enter') { if (mode === 'setup') handleSetupSubmit(); if (mode === 'change-new') handleChangeNew(); } }}
          />
        </div>
      )}
      {pinErr    && <p className="form-error">{pinErr}</p>}
      {pinSuccess && <p className="form-hint" style={{ color: 'var(--success)' }}>{pinSuccess}</p>}
    </div>
  );

  const spinner = <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />;

  return (
    <div className="pin-settings">
      {mode === 'idle' && (
        <>
          <div className="pin-settings__status">
            <span className="pin-settings__status-icon">{localPinExists ? <Lock size={16} /> : <Unlock size={16} />}</span>
            <span className="pin-settings__status-text">
              {localPinExists ? 'PIN aktif — login cepat tersedia' : 'PIN belum dikonfigurasi'}
            </span>
          </div>
          <div className="pin-settings__actions">
            {!localPinExists ? (
              <Button variant="primary" size="sm" onClick={() => { setMode('setup'); setPinErr(''); }} leftIcon={<Plus size={14} />}>
                Buat PIN
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setMode('change-verify'); setPinErr(''); }} leftIcon={<Pencil size={14} />}>
                  Ganti PIN
                </Button>
                <Button variant="danger" size="sm" onClick={() => { setMode('remove-verify'); setPinErr(''); }} leftIcon={<Trash2 size={14} />}>
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
            <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleSetupSubmit} disabled={loading}>
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
            <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleChangeVerify} disabled={loading}>
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
            <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleChangeNew} disabled={loading}>
              {loading ? spinner : 'Simpan PIN Baru'}
            </Button>
          </div>
        </>
      )}

      {mode === 'remove-verify' && (
        <>
          <h4 className="pin-settings__form-title">Hapus PIN</h4>
          <p className="pin-settings__warn">
            <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Masukkan PIN untuk mengonfirmasi penghapusan.
          </p>
          {renderPinInputs(false)}
          <div className="pin-settings__form-actions">
            <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>Batal</Button>
            <Button variant="danger" size="sm" onClick={handleRemoveVerify} disabled={loading} leftIcon={!loading ? <Trash2 size={14} /> : undefined}>
              {loading ? spinner : 'Hapus PIN'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
