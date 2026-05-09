import { randomBytes } from 'crypto';

/**
 * Minimal RFC4122-ish v4 UUID using Node's crypto. Avoids adding an `uuid`
 * dependency for one usage in the auth module.
 */
export function v4(): string {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
