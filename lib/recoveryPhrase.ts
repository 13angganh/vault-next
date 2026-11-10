import { WORDLIST } from '@/lib/wordlist';

/** Jumlah kata recovery phrase (digenerate otomatis, tidak boleh diketik user). */
export const RECOVERY_WORD_COUNT = 5;

/**
 * Generate recovery phrase: 5 kata Inggris acak dari 2048 kata.
 * Memakai crypto.getRandomValues; 65536 habis dibagi 2048 → tidak ada modulo bias.
 */
export function generateRecoveryPhrase(count: number = RECOVERY_WORD_COUNT): string {
  const buf = new Uint16Array(count);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => WORDLIST[n % WORDLIST.length]).join(' ');
}
