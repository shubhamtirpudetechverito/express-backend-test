import crypto from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CODE_LENGTH = 7;

export function generateCode(length = CODE_LENGTH) {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateUniqueCode(isTaken) {
  const MAX_ATTEMPTS = 5;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateCode();
    if (!isTaken(code)) return code;
  }
  throw new Error('shortcode_collision_exhausted');
}
