import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';
import { PerformanceController } from '../controllers/performance.controller';
import { PredictionController } from '../controllers/prediction.controller';
import { isDbConnected } from '../config/db';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      dbConnected: isDbConnected(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    meta: {},
    error: null,
  });
});

// Market endpoints
router.get('/markets', MarketController.getMarkets);
router.get('/candles/:symbol', MarketController.getCandles);

// Prediction endpoints
router.get('/predictions', PredictionController.getPredictions);
router.get('/predictions/:symbol', PredictionController.getPredictions);

// Performance analytics endpoints
router.get('/performance', PerformanceController.getPerformance);
router.get('/performance/:symbol', PerformanceController.getPerformanceBySymbol);

export default router;
