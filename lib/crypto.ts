/**
 * Vault Next — Enkripsi AES-256-GCM via Web Crypto API
 * Kompatibel dengan format .vault dari Vault v4
 */

// ─── Helper: Buffer ──────────────────────────────────────────────────────────

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const len = hex.length / 2;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return buf.buffer as ArrayBuffer;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
}

// ─── Salt & Key Derivation ───────────────────────────────────────────────────

/** Generate random salt (32 bytes) sebagai hex string */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return bufferToHex(salt.buffer as ArrayBuffer);
}

/** Derive AES-256 key dari password + salt menggunakan PBKDF2 */
export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBuffer(saltHex),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

/** Hash string dengan SHA-256, return hex */
export async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return bufferToHex(hash);
}

/** Hash PIN dengan salt untuk penyimpanan aman */
export async function hashPIN(pin: string, saltHex: string): Promise<string> {
  return sha256(`${saltHex}:pin:${pin}`);
}

/** Hash master password dengan salt */
export async function hashMasterPW(password: string, saltHex: string): Promise<string> {
  return sha256(`${saltHex}:master:${password}`);
}

// ─── Enkripsi / Dekripsi ─────────────────────────────────────────────────────

export interface EncryptedPayload {
  iv: string;    // base64
  data: string;  // base64
}

/** Enkripsi string menjadi EncryptedPayload */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV untuk GCM

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    data: bufferToBase64(encrypted),
  };
}

/** Dekripsi EncryptedPayload menjadi string */
export async function decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(payload.iv) },
    key,
    base64ToBuffer(payload.data)
  );
  return dec.decode(decrypted);
}

// ─── Seed Phrase ─────────────────────────────────────────────────────────────

/** Generate 12-kata seed phrase dari wordlist BIP39 sederhana (subset 512 kata) */
const WORDLIST_512 = [
  'abandon','ability','able','about','above','absent','absorb','abstract',
  'absurd','abuse','access','accident','account','accuse','achieve','acid',
  'acoustic','acquire','across','action','actor','actress','actual','adapt',
  'add','addict','address','adjust','admit','adult','advance','advice',
  'aerobic','afford','afraid','again','agent','agree','ahead','aim',
  'airport','alarm','album','alcohol','alert','alien','align','alive',
  'alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor',
  'ancient','anger','angle','animal','ankle','announce','annual','answer',
  'antenna','antique','anxiety','apart','april','april','arch','arctic',
  'area','arena','argue','arm','armor','army','around','arrange',
  'arrest','arrive','arrow','article','artist','artwork','ask','aspect',
  'assault','asset','assist','assume','asthma','athlete','atom','attack',
  'attend','attitude','attract','auction','audit','august','aunt','author',
  'auto','autumn','average','avocado','avoid','awake','aware','away',
  'awesome','awful','awkward','axis','baby','balance','bamboo','banana',
  'banner','barely','bargain','barrel','base','basic','basket','battle',
  'beach','bean','beauty','become','beef','begin','behave','behind',
  'believe','below','belt','bench','benefit','best','betray','better',
  'between','beyond','bicycle','bind','biology','bird','birth','bitter',
  'black','blade','blame','blanket','blast','bleak','bless','blind',
  'blood','blossom','blouse','blue','blur','blush','board','boat',
  'body','boil','bomb','bone','book','boost','border','boring',
  'borrow','boss','bottom','bounce','box','boy','bracket','brain',
  'brand','brave','breeze','brick','bridge','brief','bright','bring',
  'brisk','broccoli','broken','bronze','broom','brother','brown','brush',
  'bubble','buddy','budget','buffalo','build','bulb','bulk','bullet',
  'bundle','bunker','burden','burger','burst','bus','business','busy',
  'butter','buyer','buzz','cabbage','cabin','cable','cactus','cage',
  'cake','call','calm','camera','camp','canal','cancel','candy',
  'cannon','canvas','canyon','capable','capital','captain','carbon','card',
  'cargo','carpet','carry','cart','case','cash','castle','casual',
  'catalog','catch','category','cause','cave','ceiling','celery','cement',
  'census','century','cereal','certain','chair','chaos','chapter','charge',
  'chase','cheap','check','cheese','chef','cherry','chest','chicken',
  'chief','child','chimney','choice','choose','chronic','chuckle','chunk',
  'cigar','cinema','circle','citizen','city','civil','claim','clap',
  'clarify','claw','clay','clean','clerk','clever','click','client',
  'cliff','climb','clinic','clip','clock','clog','close','cloth',
  'cloud','clown','club','clump','cluster','clutch','coach','coast',
  'coconut','code','coffee','coil','coin','collect','color','column',
  'combine','come','comfort','comic','common','company','concert','conduct',
  'confirm','congress','connect','consider','control','convince','cook','cool',
  'copper','copy','coral','core','corn','correct','cost','cotton',
  'couch','country','couple','course','cousin','cover','coyote','crack',
  'cradle','craft','cram','crane','crash','crater','crawl','crazy',
  'cream','credit','creek','crew','cricket','crime','crisp','critic',
  'crop','cross','crouch','crowd','crucial','cruel','cruise','crumble',
  'crush','cry','crystal','cube','culture','cup','cupboard','curious',
  'current','curtain','curve','cushion','custom','cute','cycle','dad',
  'damage','damp','dance','danger','daring','dash','daughter','dawn',
];

export function generateSeedPhrase(): string {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF * WORDLIST_512.length);
    words.push(WORDLIST_512[idx]);
  }
  return words.join(' ');
}

/** Validasi format seed phrase (12 kata, semua lowercase huruf) */
export function validateSeedPhrase(phrase: string): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  return words.length === 12 && words.every((w) => /^[a-z]+$/.test(w));
}
