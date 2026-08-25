import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { connectDB } from './config/db';
import { createApp } from './app';
import { marketHubService } from './services/MarketHubService';
import { otcPriceService } from './services/OtcPriceService';
import { setupWebSocketServer } from './websocket/wsServer';

async function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const httpServer = http.createServer(app);

  setupWebSocketServer(httpServer);

  await connectDB();
  await marketHubService.initialize();

  // Start background OTC price polling (Forex, Commodities, Indices, Stocks)
  otcPriceService.start();

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Candle Probability Lab API] Listening on http://0.0.0.0:${port}`);
  });

  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    httpServer.close(() => {
      console.log('[Server] HTTP and WebSocket servers closed.');
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
