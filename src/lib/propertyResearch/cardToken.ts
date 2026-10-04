// Opaque card id (card f1798734): the visitor's card never shows the source, but the "Érdekel" lead
// must tell the team which card was chosen and where it came from. The id is the card's server-side
// details sealed with AES-256-GCM: the browser only carries it back, it cannot read or forge it.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export type CardSecret = {
  sourceUrl: string;
  quote: string | null;
  category: string;
  place: string;
  area: string | null;
  priceBand: string | null;
  verification: 'verified' | 'pending';
  query: string;
  issuedAt: number;
};

const keyOf = (secret: string) => createHash('sha256').update(secret, 'utf8').digest();

export function sealCard(data: CardSecret, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyOf(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

/** null when the token was tampered with, sealed with another secret, or is not a token at all. */
export function openCard(token: string, secret: string): CardSecret | null {
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyOf(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    return JSON.parse(plain) as CardSecret;
  } catch {
    return null;
  }
}
