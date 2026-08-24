import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Security headers configured for API and WebSocket responses.
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

function getAllowedOrigins(): string[] {
  return [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

// Exact CORS allowlist configuration for the Vercel frontend.
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');

    if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 204,
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
