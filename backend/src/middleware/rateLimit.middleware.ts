import rateLimit from 'express-rate-limit';
import config from '../config/environment';

// Public API rate limiter (for frontend and public access)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Auth endpoint rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Contact form rate limiter
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact submissions, please try again later',
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Admin API rate limiter (stricter, per user)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});
