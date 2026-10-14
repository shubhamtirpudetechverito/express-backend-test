import { generateUniqueCode } from './shortcode.js';

class Store {
  constructor() {
    /** @type {Map<string, { code: string, longUrl: string, createdAt: string, expiresAt: string | null, expiresAtMs: number | null }>} */
    this.byCode = new Map();
    /** @type {Map<string, string>} longUrl -> code */
    this.byLongUrl = new Map();
  }

  async create({ longUrl, ttlMs }) {
    const code = generateUniqueCode((c) => this.byCode.has(c));
    const createdAt = new Date().toISOString();
    const expiresAtMs = ttlMs ? Date.now() + ttlMs : null;
    const expiresAt = expiresAtMs ? new Date(expiresAtMs).toISOString() : null;

    const entry = { code, longUrl, createdAt, expiresAt, expiresAtMs };
    this.byCode.set(code, entry);
    this.byLongUrl.set(longUrl, code);
    return entry;
  }

  async get(code) {
    const entry = this.byCode.get(code);
    if (!entry) return null;
    if (entry.expiresAtMs && entry.expiresAtMs <= Date.now()) {
      this.byCode.delete(entry.code);
      this.byLongUrl.delete(entry.longUrl);
      return null;
    }
    return entry;
  }

  async findByLongUrl(longUrl) {
    const code = this.byLongUrl.get(longUrl);
    if (!code) return null;
    return this.get(code);
  }

  async list() {
    this.cleanupExpired();
    return Array.from(this.byCode.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(({ expiresAtMs, ...rest }) => rest);
  }

  async delete(code) {
    const entry = this.byCode.get(code);
    if (!entry) return false;
    this.byCode.delete(code);
    this.byLongUrl.delete(entry.longUrl);
    return true;
  }

  cleanupExpired() {
    const now = Date.now();
    let removed = 0;
    for (const [code, entry] of this.byCode) {
      if (entry.expiresAtMs && entry.expiresAtMs <= now) {
        this.byCode.delete(code);
        this.byLongUrl.delete(entry.longUrl);
        removed++;
      }
    }
    return removed;
  }
}

export default new Store();
