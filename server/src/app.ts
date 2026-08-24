import express from 'express';
import { apiLimiter, corsMiddleware, errorHandler, securityHeaders } from './middleware/security.middleware';
import apiRoutes from './routes/api.routes';

export function createApp() {
  const app = express();

  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(express.json());
  app.use('/api', apiLimiter);
  app.use('/api', apiRoutes);
  app.use(errorHandler);

  return app;
}
