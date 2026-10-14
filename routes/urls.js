import { Router } from 'express';
import store from '../lib/store.js';

const router = Router();
export const redirectRouter = Router();

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// Helper: validate a URL string
function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

// POST /api/v1/urls
router.post('/', async (req, res, next) => {
  try {
    const { url, ttl } = req.body ?? {};

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ error: 'invalid_url' });
    }

    let ttlMs;
    if (ttl !== undefined) {
      if (!Number.isFinite(ttl) || ttl <= 0) {
        return res.status(400).json({ error: 'invalid_ttl' });
      }
      ttlMs = ttl * 1000; // ttl in seconds
    }

    const existing = await store.findByLongUrl(url);
    if (existing) {
      return res.status(409).json({
        error: 'duplicate',
        code: existing.code,
        shortUrl: `${BASE_URL}/${existing.code}`,
        longUrl: existing.longUrl,
        createdAt: existing.createdAt,
        expiresAt: existing.expiresAt ?? null,
      });
    }

    const entry = await store.create({ longUrl: url, ttlMs });

    res.status(201).json({
      code: entry.code,
      shortUrl: `${BASE_URL}/${entry.code}`,
      longUrl: entry.longUrl,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/urls?limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset ?? '0', 10) || 0, 0);

    const all = await store.list();
    const page = all.slice(offset, offset + limit);

    res.json({
      total: all.length,
      limit,
      offset,
      items: page.map((e) => ({
        code: e.code,
        shortUrl: `${BASE_URL}/${e.code}`,
        longUrl: e.longUrl,
        createdAt: e.createdAt,
        expiresAt: e.expiresAt ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/urls/:code
router.get('/:code', async (req, res, next) => {
  try {
    const entry = await store.get(req.params.code);
    if (!entry) return res.status(404).json({ error: 'not_found' });

    res.json({
      code: entry.code,
      shortUrl: `${BASE_URL}/${entry.code}`,
      longUrl: entry.longUrl,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/urls/:code
router.delete('/:code', async (req, res, next) => {
  try {
    const removed = await store.delete(req.params.code);
    if (!removed) return res.status(404).json({ error: 'not_found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /:code  — 302 redirect
redirectRouter.get('/:code', async (req, res, next) => {
  try {
    const entry = await store.get(req.params.code);
    if (!entry) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.redirect(302, entry.longUrl);
  } catch (err) {
    next(err);
  }
});

export default router;
