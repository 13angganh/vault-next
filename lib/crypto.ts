/**
 * Vault Next — Crypto Engine
 * Format & algoritma TIDAK BOLEH BERUBAH untuk data baru.
 *
 * Format BARU (Vault Next): base64( iv[12] | salt[16] | ver[1] | aesGcmCipher )
 *   KDF: PBKDF2-SHA256 600k → export raw → PBKDF2-SHA512 100k (salt SAMA)
 *
 * Format LAMA (vault-private-offline): base64( ver[1] | salt[16] | iv[12] | aesGcmCipher )
 *   KDF enhanced: PBKDF2-SHA256 600k → PBKDF2-SHA512 100k (salt2 = SHA256(salt||bits1))
 *   KDF basic:    PBKDF2-SHA256 310k
 *
 * decrypt() otomatis detect format baru vs lama dari offset byte.
 * Sesi 6C: tambah legacyDecrypt() untuk import file .vault lama.
 */

const VER_ENHANCED = 0xAB;
const PBKDF2_ITER_1 = 600_000;
const PBKDF2_ITER_2 = 100_000;
const SALT_LEN = 16;
const IV_LEN   = 12;

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function pwToKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey', 'deriveBits'],
  );
}

// ─── KDF Baru (Vault Next) ────────────────────────────────────────────────────
// Salt sama untuk kedua lapis

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  enhanced = true,
): Promise<CryptoKey> {
  const baseKey = await pwToKey(password);
  const saltBuf = salt.buffer as ArrayBuffer;

  const round1 = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITER_1, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  if (!enhanced) return round1;

  const rawRound1 = await crypto.subtle.exportKey('raw', round1);
  const baseKey2  = await crypto.subtle.importKey('raw', rawRound1, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITER_2, hash: 'SHA-512' },
    baseKey2,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── KDF Lama (vault-private-offline) ────────────────────────────────────────
// Lapis 2 pakai salt2 = SHA-256(salt || bits1)

async function deriveKeyLegacy(
  password: string,
  salt: Uint8Array,
  enhanced: boolean,
): Promise<CryptoKey> {
  const pwBuf = new TextEncoder().encode(password);
  const saltBuf = salt.buffer as ArrayBuffer;

  if (enhanced) {
    // Lapis 1: deriveBits SHA-256 600k
    const km1   = await crypto.subtle.importKey('raw', pwBuf, 'PBKDF2', false, ['deriveBits']);
    const bits1  = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBuf, iterations: 600_000, hash: 'SHA-256' }, km1, 256,
    );
    // salt2 = SHA-256(salt || bits1)
    const combined = new Uint8Array([...salt, ...new Uint8Array(bits1)]);
    const salt2Buf = await crypto.subtle.digest('SHA-256', combined);
    // Lapis 2: deriveKey SHA-512 100k
    const km2 = await crypto.subtle.importKey('raw', bits1, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt2Buf, iterations: 100_000, hash: 'SHA-512' },
      km2, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
  } else {
    // Basic: SHA-256 310k
    const km = await crypto.subtle.importKey('raw', pwBuf, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBuf, iterations: 310_000, hash: 'SHA-256' },
      km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
  }
}

// ─── generateSalt ─────────────────────────────────────────────────────────────

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LEN));
}

// ─── sha256 ───────────────────────────────────────────────────────────────────

export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const hashStr = sha256;

// ─── Encrypt (format baru) ────────────────────────────────────────────────────
// Layout: iv[12] | salt[16] | ver[1] | ciphertext

export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = generateSalt();
  const iv   = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key  = await deriveKey(password, salt, true);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext),
  );

  const cipher = new Uint8Array(cipherBuf);
  const out = new Uint8Array(IV_LEN + SALT_LEN + 1 + cipher.byteLength);
  out.set(iv, 0);
  out.set(salt, IV_LEN);
  out[IV_LEN + SALT_LEN] = VER_ENHANCED;
  out.set(cipher, IV_LEN + SALT_LEN + 1);

  return bufToB64(out.buffer);
}

// ─── Decrypt (format baru) ────────────────────────────────────────────────────

export async function decrypt(b64: string, password: string): Promise<string> {
  const buf    = b64ToBuf(b64);
  const iv     = buf.slice(0, IV_LEN);
  const salt   = buf.slice(IV_LEN, IV_LEN + SALT_LEN);
  const ver    = buf[IV_LEN + SALT_LEN];
  const cipher = buf.slice(IV_LEN + SALT_LEN + 1);

  const enhanced = ver === VER_ENHANCED;
  const key      = await deriveKey(password, salt, enhanced);

  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plainBuf);
}

// ─── Decrypt Legacy (format lama vault-private-offline) ──────────────────────
// Layout lama: ver[1] | salt[16] | iv[12] | ciphertext

export async function decryptLegacy(b64: string, password: string): Promise<string> {
  const buf      = b64ToBuf(b64);
  const enhanced = buf[0] === VER_ENHANCED;
  const offset   = 1;                              // ver di index 0
  const salt     = buf.slice(offset, offset + SALT_LEN);
  const iv       = buf.slice(offset + SALT_LEN, offset + SALT_LEN + IV_LEN);
  const cipher   = buf.slice(offset + SALT_LEN + IV_LEN);

  const key      = await deriveKeyLegacy(password, salt, enhanced);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plainBuf);
}
