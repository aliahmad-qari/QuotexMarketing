import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Security headers configured for API and WebSocket responses.
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// CORS allowlist configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const configuredFrontendUrl = process.env.FRONTEND_URL;
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');

    if (!origin || isLocalhost || !configuredFrontendUrl || origin === configuredFrontendUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
  skip: () => process.env.NODE_ENV === 'test',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    data: null,
    error: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
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
