/**
 * Vault Next — lib/hooks/useClipboard.ts
 * Hook copy ke clipboard dengan auto-clear setelah timeout.
 * PENTING: Auto-clear adalah fitur keamanan password manager —
 * password tidak boleh tersimpan di clipboard selamanya.
 *
 * Standar: auto-clear setelah 30 detik (dapat dikonfigurasi).
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseClipboardOptions {
  /** Durasi clear otomatis dalam ms. Default: 30_000 (30 detik) */
  clearAfterMs?: number;
}

interface UseClipboardReturn {
  /** ID field yang sedang dalam state "baru disalin" */
  copiedId:   string | null;
  /** Sisa detik sebelum clipboard di-clear. null = tidak aktif */
  countdown:  number | null;
  /** Salin teks ke clipboard dan set auto-clear */
  copy:       (text: string, id: string) => Promise<void>;
}

export function useClipboard({
  clearAfterMs = 30_000,
}: UseClipboardOptions = {}): UseClipboardReturn {
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const clearTimer     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const intervalTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (clearTimer.current)    clearTimeout(clearTimer.current);
      if (intervalTimer.current) clearInterval(intervalTimer.current);
    };
  }, []);

  const clearClipboard = useCallback(() => {
    // Timers
    if (clearTimer.current)    clearTimeout(clearTimer.current);
    if (intervalTimer.current) clearInterval(intervalTimer.current);
    clearTimer.current    = null;
    intervalTimer.current = null;

    // Clear clipboard (tulis string kosong)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    } catch {}

    setCopiedId(null);
    setCountdown(null);
  }, []);

  const copy = useCallback(async (text: string, id: string): Promise<void> => {
    // Reset timer lama jika ada
    if (clearTimer.current)    clearTimeout(clearTimer.current);
    if (intervalTimer.current) clearInterval(intervalTimer.current);

    // Tulis ke clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback untuk browser lama
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch (err) {
      // Copy gagal — jangan ubah state
      throw new Error('Gagal menyalin ke clipboard');
    }

    // Set state dan mulai countdown
    setCopiedId(id);
    const totalSecs = Math.ceil(clearAfterMs / 1000);
    setCountdown(totalSecs);

    // Countdown per detik
    let remaining = totalSecs;
    intervalTimer.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (intervalTimer.current) clearInterval(intervalTimer.current);
        intervalTimer.current = null;
      }
    }, 1000);

    // Auto-clear setelah clearAfterMs
    clearTimer.current = setTimeout(() => {
      clearClipboard();
    }, clearAfterMs);
  }, [clearAfterMs, clearClipboard]);

  return { copiedId, countdown, copy };
}
