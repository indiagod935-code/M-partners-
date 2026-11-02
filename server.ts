import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './server/routes/auth.ts';
import customerRouter from './server/routes/customer.ts';
import runnerRouter from './server/routes/runner.ts';
import adminRouter from './server/routes/admin.ts';
import chatRouter from './server/routes/chat.ts';
import publicRouter from './server/routes/public.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // RESTful API endpoints under /api/v1/
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/customer', customerRouter);
  app.use('/api/v1/runner', runnerRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/public', publicRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      platform: 'M-PARTNER',
      brand: 'Powered by Mãrçò 💯',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`M-PARTNER Server (Powered by Mãrçò 💯) running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
