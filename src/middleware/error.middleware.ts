import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errors?: Record<string, string>;
  code?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Record<string, string>): ApiError {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message: string): ApiError {
    return new ApiError(message, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }

  static validation(message: string, errors?: Record<string, string>): ApiError {
    return new ApiError(message, 422, errors);
  }

  static tooManyRequests(message: string): ApiError {
    return new ApiError(message, 429);
  }

  static internal(message: string): ApiError {
    return new ApiError(message, 500);
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Handle validation errors (Mongoose)
  if (err.name === 'ValidationError' && typeof err === 'object' && 'errors' in err) {
    const errors: Record<string, string> = {};
    const errs = err.errors as Record<string, { message?: string }>;
    Object.keys(errs).forEach((key) => {
      errors[key] = errs[key]?.message || 'Validation error';
    });
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Handle Multer errors
  if (typeof err === 'object' && 'code' in err) {
    const code = err.code as string;
    if (code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File too large',
      });
      return;
    }
    if (code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'Unexpected file field',
      });
      return;
    }
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError' && typeof err === 'object' && 'kind' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  // Handle TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // API error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && typeof err === 'object' && 'stack' in err ? { stack: err.stack } : {}),
  });
};
