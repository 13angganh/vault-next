'use client';

/**
 * Vault Next — RecoveryPanel
 * Fix Keyboard A-01:
 *  - inputMode="text" → cegah keyboard dismiss di iOS/Android
 *  - enterKeyHint="done" → tampilkan tombol Done di keyboard
 *  - autoCorrect/autoCapitalize/autoComplete off → cegah suggestion popup
 *    yang bikin keyboard re-render dan autohide
 *  - scrollIntoView saat focus → pastikan textarea visible saat keyboard naik
 */

import { useState, useRef, useCallback } from 'react';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

interface RecoveryPanelProps {
  loading?: boolean;
  error?: string;
  onSubmit: (phrase: string) => void;
  /** v2.0.0 (Tahap 3): tidak dipakai lagi — LockScreen sudah menampilkan tautan "Kembali ke login" di bawah kartu (sebelumnya ganda). */
  onBack?: () => void;
}

export function RecoveryPanel({ loading, error, onSubmit }: RecoveryPanelProps) {
  const [phrase, setPhrase] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!phrase.trim() || loading) return;
    onSubmit(phrase.trim());
  };

  // Saat focus: scroll textarea ke dalam viewport agar tidak tertutup keyboard
  const handleFocus = useCallback(() => {
    if (!textareaRef.current) return;
    setTimeout(() => {
      // v2.0.0 (Tahap 3): hormati prefers-reduced-motion (tanpa animasi gulir bila diminta)
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
      textareaRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }, 300); // delay agar keyboard sudah naik
  }, []);

  // v2.0.0 (Tahap 3): gaya inline (termasuk literal rgba) dipindah ke kelas .rcv-* di redesign.css
  return (
    <div className="rcv">
      <div className="rcv-warn">
        <TriangleAlert size={20} className="rcv-warn__icon" />
        <span className="rcv-warn__text">
          Recovery phrase hanya digunakan untuk <strong>memulihkan master password</strong>.
          Pastikan kamu berada di tempat aman.
        </span>
      </div>

      <div className="rcv-field">
        <label className="rcv-label" htmlFor="rcv-phrase">
          Recovery phrase / seed phrase
        </label>
        <textarea
          id="rcv-phrase"
          ref={textareaRef}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onFocus={handleFocus}
          placeholder="Ketikkan 5 kata recovery phrase, pisahkan spasi…"
          rows={4}
          /* ── Keyboard autohide fixes ── */
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          className={`rcv-textarea${error ? ' rcv-textarea--error' : ''}`}
          aria-invalid={error ? true : undefined}
        />
        {error && <div className="rcv-error" role="alert">{error}</div>}
      </div>

      <Button variant="gold" full loading={!!loading} disabled={!phrase.trim() || !!loading}
        onClick={handleSubmit} leftIcon={!loading ? <ShieldCheck size={18} /> : undefined}>
        {loading ? 'Memulihkan…' : 'Pulihkan Akses'}
      </Button>
    </div>
  );
}
