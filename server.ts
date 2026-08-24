import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import { apiLimiter, corsMiddleware, errorHandler, securityHeaders } from './server/middleware/security.middleware';
import apiRoutes from './server/routes/api.routes';
import { marketHubService } from './server/services/MarketHubService';
import { setupWebSocketServer } from './server/websocket/wsServer';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security and core middlewares
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(express.json());

  // API rate limiter
  app.use('/api', apiLimiter);

  // Mount API routes FIRST
  app.use('/api', apiRoutes);

  // Create HTTP server instance
  const httpServer = http.createServer(app);

  // Attach WebSocket server for real-time market streams
  setupWebSocketServer(httpServer);

  // Mount Vite middleware in dev or serve static build in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  // Connect MongoDB Atlas if configured
  await connectDB();

  // Initialize Market Hub orchestration
  await marketHubService.initialize();

  // Start HTTP & WS listening on port 3000
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Candle Probability Lab] Server online and listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    httpServer.close(() => {
      console.log('[Server] HTTP/WS servers closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]', err);
  process.exit(1);
});
