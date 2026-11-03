import express from 'express';
import authRouter from './routes/auth.ts';
import customerRouter from './routes/customer.ts';
import runnerRouter from './routes/runner.ts';
import adminRouter from './routes/admin.ts';
import chatRouter from './routes/chat.ts';
import publicRouter from './routes/public.ts';

export function createApiApp() {
  const app = express();
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

  return app;
}

export const apiApp = createApiApp();
export default apiApp;
