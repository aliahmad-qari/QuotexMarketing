import express from 'express';
import cookieParser from 'cookie-parser';
import { apiLimiter, corsMiddleware, errorHandler, securityHeaders } from './middleware/security.middleware';
import apiRoutes from './routes/api.routes';

export function createApp() {
  const app = express();

  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', apiLimiter);
  app.use('/api', apiRoutes);
  app.use(errorHandler);

  return app;
}
