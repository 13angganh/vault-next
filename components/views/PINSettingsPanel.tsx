'use client';

/**
 * Vault Next — PINSettingsPanel
 * Setup, ganti, atau hapus PIN dari SettingsView.
 * Sesi 5.
 */

import { useState } from 'react';
import { setupPin, verifyPin, hasPinSetup } from '@/lib/vaultService';
import { lsRemove, LS_PIN } from '@/lib/storage';

type PINMode = 'idle' | 'setup' | 'change-verify' | 'change-new' | 'remove-verify';

export function PINSettingsPanel() {
  const pinExists = hasPinSetup();
  const [mode,      setMode]      = useState<PINMode>('idle');
  const [pin,       setPin]       = useState('');
  const [pinConf,   setPinConf]   = useState('');
  const [pinErr,    setPinErr]    = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [localPinExists, setLocalPinExists] = useState(pinExists);

  const reset = () => {
    setMode('idle'); setPin(''); setPinConf(''); setPinErr(''); setPinSuccess('');
  };

  // ── Setup PIN baru ───────────────────────────────────────────────────────────
  const handleSetupSubmit = async () => {
    if (pin.length < 4) { setPinErr('PIN minimal 4 digit'); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    setLoading(true);
    try {
      await setupPin(pin);
      setLocalPinExists(true);
      setPinSuccess('✅ PIN berhasil dibuat!');
      setTimeout(reset, 1500);
    } catch {
      setPinErr('Gagal menyimpan PIN');
    } finally { setLoading(false); }
  };

  // ── Ganti PIN: verifikasi lama ────────────────────────────────────────────────
  const handleChangeVerify = async () => {
    if (!pin) { setPinErr('Masukkan PIN lama'); return; }
    setLoading(true);
    try {
      const ok = await verifyPin(pin);
      if (!ok) { setPinErr('PIN salah'); setLoading(false); return; }
      setMode('change-new');
      setPin(''); setPinConf(''); setPinErr('');
    } finally { setLoading(false); }
  };

  // ── Ganti PIN: simpan baru ────────────────────────────────────────────────────
  const handleChangeNew = async () => {
    if (pin.length < 4) { setPinErr('PIN baru minimal 4 digit'); return; }
    if (pin !== pinConf) { setPinErr('PIN tidak cocok'); return; }
    setLoading(true);
    try {
      await setupPin(pin);
      setPinSuccess('✅ PIN berhasil diubah!');
      setTimeout(reset, 1500);
    } catch {
      setPinErr('Gagal menyimpan PIN baru');
    } finally { setLoading(false); }
  };

  // ── Hapus PIN ─────────────────────────────────────────────────────────────────
  const handleRemoveVerify = async () => {
    if (!pin) { setPinErr('Masukkan PIN untuk konfirmasi'); return; }
    setLoading(true);
    try {
      const ok = await verifyPin(pin);
      if (!ok) { setPinErr('PIN salah'); setLoading(false); return; }
      lsRemove(LS_PIN);
      setLocalPinExists(false);
      setPinSuccess('✅ PIN berhasil dihapus.');
      setTimeout(reset, 1500);
    } finally { setLoading(false); }
  };

  const renderPinInputs = (isConfirm = false) => (
    <div className="pin-settings__inputs">
      <div className="form-group">
        <label className="form-label" htmlFor="ps-pin">
          {mode === 'change-verify' ? 'PIN Lama'
           : mode === 'remove-verify' ? 'PIN (konfirmasi)'
           : mode === 'change-new' ? 'PIN Baru'
           : 'PIN (4–8 digit)'}
        </label>
        <input
          id="ps-pin"
          className={`input mono ${pinErr ? 'input--error' : ''}`}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinErr(''); }}
          placeholder="••••"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (mode === 'setup') handleSetupSubmit();
              if (mode === 'change-verify') handleChangeVerify();
              if (mode === 'change-new') handleChangeNew();
              if (mode === 'remove-verify') handleRemoveVerify();
            }
            if (e.key === 'Escape') reset();
          }}
        />
      </div>
      {isConfirm && (
        <div className="form-group">
          <label className="form-label" htmlFor="ps-pin-conf">Ulangi PIN</label>
          <input
            id="ps-pin-conf"
            className={`input mono ${pinErr ? 'input--error' : ''}`}
            type="password"
            inputMode="numeric"
            value={pinConf}
            onChange={(e) => { setPinConf(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinErr(''); }}
            placeholder="••••"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (mode === 'setup') handleSetupSubmit();
                if (mode === 'change-new') handleChangeNew();
              }
            }}
          />
        </div>
      )}
      {pinErr     && <p className="form-error">{pinErr}</p>}
      {pinSuccess  && <p className="form-hint" style={{ color: 'var(--c-success)' }}>{pinSuccess}</p>}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pin-settings">
      {mode === 'idle' && (
        <>
          <div className="pin-settings__status">
            <span className="pin-settings__status-icon">{localPinExists ? '🔒' : '🔓'}</span>
            <span className="pin-settings__status-text">
              {localPinExists ? 'PIN aktif — login cepat tersedia' : 'PIN belum dikonfigurasi'}
            </span>
          </div>
          <div className="pin-settings__actions">
            {!localPinExists ? (
              <button className="btn btn-primary btn--sm" onClick={() => { setMode('setup'); setPinErr(''); }}>
                ➕ Buat PIN
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn--sm" onClick={() => { setMode('change-verify'); setPinErr(''); }}>
                  ✏️ Ganti PIN
                </button>
                <button className="btn btn-ghost btn--sm btn--danger-ghost" onClick={() => { setMode('remove-verify'); setPinErr(''); }}>
                  🗑️ Hapus PIN
                </button>
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
            <button className="btn btn-ghost btn--sm" onClick={reset} disabled={loading}>Batal</button>
            <button className="btn btn-primary btn--sm" onClick={handleSetupSubmit} disabled={loading}>
              {loading ? '⏳' : 'Buat PIN'}
            </button>
          </div>
        </>
      )}

      {mode === 'change-verify' && (
        <>
          <h4 className="pin-settings__form-title">Verifikasi PIN Lama</h4>
          {renderPinInputs(false)}
          <div className="pin-settings__form-actions">
            <button className="btn btn-ghost btn--sm" onClick={reset} disabled={loading}>Batal</button>
            <button className="btn btn-primary btn--sm" onClick={handleChangeVerify} disabled={loading}>
              {loading ? '⏳' : 'Lanjut'}
            </button>
          </div>
        </>
      )}

      {mode === 'change-new' && (
        <>
          <h4 className="pin-settings__form-title">PIN Baru</h4>
          {renderPinInputs(true)}
          <div className="pin-settings__form-actions">
            <button className="btn btn-ghost btn--sm" onClick={reset} disabled={loading}>Batal</button>
            <button className="btn btn-primary btn--sm" onClick={handleChangeNew} disabled={loading}>
              {loading ? '⏳' : 'Simpan PIN Baru'}
            </button>
          </div>
        </>
      )}

      {mode === 'remove-verify' && (
        <>
          <h4 className="pin-settings__form-title">Hapus PIN</h4>
          <p className="pin-settings__warn">⚠️ Masukkan PIN untuk mengonfirmasi penghapusan.</p>
          {renderPinInputs(false)}
          <div className="pin-settings__form-actions">
            <button className="btn btn-ghost btn--sm" onClick={reset} disabled={loading}>Batal</button>
            <button className="btn btn--sm btn--danger" onClick={handleRemoveVerify} disabled={loading}>
              {loading ? '⏳' : '🗑️ Hapus PIN'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
