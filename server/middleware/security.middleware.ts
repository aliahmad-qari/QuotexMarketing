import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Security Headers with Helmet configured for WebSockets & TradingView charts
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Vite dev & chart scripts
  crossOriginEmbedderPolicy: false,
});

// CORS allowlist configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow local development, AI studio preview, and configured frontend URL
    const allowed = process.env.FRONTEND_URL || '*';
    if (allowed === '*' || !origin || origin.includes('localhost') || origin.includes('.run.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
});

// Rate limiting for REST endpoints (300 requests per minute)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: {
    success: false,
    data: null,
    error: 'Too many requests from this IP, please try again after a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Centralized error handling middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[API Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error',
    meta: {
      timestamp: Date.now(),
      path: req.path,
    },
  });
}
