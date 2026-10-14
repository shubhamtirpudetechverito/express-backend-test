# express-backend-test

A production-ready Express URL Shortener API, built to exercise automated codebase import detection.

## Requirements

- Node.js >= 18
- npm

## Setup

```bash
npm install
```

This generates a `package-lock.json` and installs the single runtime dependency (`express`).

## Running

```bash
npm start          # production
npm run dev        # watch mode
npm run build      # no-op echo
npm test           # node:test runner
```

The server listens on `process.env.PORT || 3000`, bound to `0.0.0.0`.

## UI

A static frontend is served from `public/` and mounted with `express.static` in `server.js`. Start the server and open the app in a browser:

```bash
npm start
# then open http://localhost:3000
```

The page lets you create a short link (with an optional TTL in seconds), list existing links, copy a short URL, and delete entries. It talks to the same `/api/v1/urls` endpoints documented below, so no separate build step or dev server is required. In watch mode, use `npm run dev` instead.

## Environment

Copy `.env.example` to `.env` and adjust:

| Var        | Default                  | Purpose                            |
|------------|--------------------------|------------------------------------|
| `PORT`     | `3000`                   | HTTP listen port                   |
| `BASE_URL` | `http://localhost:3000`  | Prefix used to build `shortUrl`    |
| `NODE_ENV` | `development`            | Enables stack traces in errors     |

## API

| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/health`               | `{ status, uptime }`                     |
| GET    | `/api/v1/info`          | Service metadata + endpoint list         |
| POST   | `/api/v1/urls`          | Create short URL — body `{ url, ttl? }`  |
| GET    | `/api/v1/urls`          | List — `?limit=&offset=`                 |
| GET    | `/api/v1/urls/:code`    | Metadata for one code                    |
| DELETE | `/api/v1/urls/:code`    | Delete — `204`                           |
| GET    | `/:code`                | `302` redirect to long URL               |

### Examples

```bash
# Health
curl http://localhost:3000/health

# Create
curl -X POST http://localhost:3000/api/v1/urls \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","ttl":3600}'

# Follow
curl -i http://localhost:3000/<code>
```

## Errors

| Status | Body                                  | Cause                       |
|--------|---------------------------------------|-----------------------------|
| 400    | `{ "error": "invalid_url" }`          | Malformed or non-http URL   |
| 400    | `{ "error": "invalid_ttl" }`          | ttl not a positive number   |
| 404    | `{ "error": "not_found" }`            | Unknown or expired code     |
| 409    | `{ "error": "duplicate", ... }`       | Long URL already shortened  |
| 500    | `{ "error": "internal_error" }`       | Unexpected — stack only in dev |

## Storage

In-memory `Map` store (`lib/store.js`). The interface is async (`await store.get(...)`) so it can be swapped for Redis/SQLite without touching routes. Expired entries are swept every 60 seconds by an interval registered in `server.js`.

## Notes

- ESM only. No TypeScript, JSX, bundlers, or frontend tooling.
- The UI is plain HTML/CSS/JS under `public/`, served statically by Express with no build step.
- Zero runtime dependencies beyond `express`.
- The `/:code` redirect route is mounted **last** so it does not shadow `/api/v1/*`, and the static frontend is mounted before it so `/` serves the UI.
