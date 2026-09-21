import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import config from './config/environment';
import { errorHandler } from './middleware/error.middleware';
import { publicLimiter } from './middleware/rateLimit.middleware';
import { setupRoutes } from './routes';
import { storageService } from './services/storage.service';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload endpoint serving (for development)
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

// Rate limiting - apply to all routes
app.use(publicLimiter);

// API Routes
setupRoutes(app);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize storage
// storageService.init?.();

export { app };
