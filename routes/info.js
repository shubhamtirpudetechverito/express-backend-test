import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'express-backend-test',
    version: '1.0.0',
    node: process.version,
    uptime: process.uptime(),
    endpoints: [
      { method: 'GET',    path: '/health' },
      { method: 'GET',    path: '/api/v1/info' },
      { method: 'POST',   path: '/api/v1/urls' },
      { method: 'GET',    path: '/api/v1/urls' },
      { method: 'GET',    path: '/api/v1/urls/:code' },
      { method: 'DELETE', path: '/api/v1/urls/:code' },
      { method: 'GET',    path: '/:code' },
    ],
  });
});

export default router;
