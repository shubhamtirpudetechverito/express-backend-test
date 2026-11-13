import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';
import infoRouter from './routes/info.js';
import urlsRouter, { redirectRouter } from './routes/urls.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import store from './lib/store.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '100kb' }));

// Minimal request logger: method + path + status
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`
    );
  });
  next();
});



// API routers first
app.use('/health', healthRouter);
app.use('/api/v1/info', infoRouter);
app.use('/api/v1/urls', urlsRouter);

// Static frontend (must come before the top-level /:code redirect)
app.use(express.static(PUBLIC_DIR));
// Top-level /:code redirect MUST be last so it doesn't shadow the API
app.use('/', redirectRouter);

// 404 + error handlers last
app.use(notFound);
app.use(errorHandler);

// Periodic cleanup of expired codes
const cleanupTimer = setInterval(() => {
  try {
    store.cleanupExpired();
  } catch (err) {
    console.error('cleanupExpired failed:', err);
  }
}, 60_000);
cleanupTimer.unref?.();

const server = app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  clearInterval(cleanupTimer);
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    process.exit(0);
  });
  // Force-exit if connections hang
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
