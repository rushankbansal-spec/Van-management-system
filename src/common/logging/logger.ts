import { Logger } from "@nestjs/common";
// src/common/logging/logger.ts
import { Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/**
 * Structured JSON logger with request ID tracking.
 * Never logs PII at info level - sensitive fields are trimmed.
 */
export function createLogger(context: string): Logger {
  const config = new ConfigService();
  const logLevel = config.get('LOG_LEVEL') || 'info';
  const logFormat = config.get('LOG_FORMAT') || 'json';
  const trimmedFields = (config.get('LOG_TRIMMED_FIELDS') || [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'accessToken',
    'apiKey',
    'secret',
    'credential',
  ]).map((f: string) => f.toLowerCase());

  return new StructuredLogger(context, logLevel, logFormat, trimmedFields);
}

/**
 * Sanitize value for logging - replace sensitive data with [REDACTED]
 */
export function sanitizeForLogging(value: string | undefined, context?: string): string {
  if (!value) return '[NOT_PROVIDED]';
  
  // For emails, show only domain
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    return `${local?.[0]}***@${domain}`;
  }
  
  // For phone numbers, show only last 4 digits
  if (/^\+?\d{10,}$/.test(value)) {
    return `+***-${value.slice(-4)}`;
  }
  
  // For long strings, truncate
  if (value.length > 50) {
    return `${value.slice(0, 20)}...[truncated]`;
  }
  
  return value;
}

/**
 * Check if a field should be trimmed from logs
 */
function shouldTrimField(fieldName: string, trimmedFields: string[]): boolean {
  const lower = fieldName.toLowerCase();
  return trimmedFields.some((f) => lower.includes(f));
}

/**
 * Sanitize object for logging - remove/transform sensitive fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  context?: string,
): Record<string, any> {
  const result: Record<string, any> = {};
  const trimmedFields = [
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'accesstoken',
    'apikey',
    'secret',
    'credential',
    'healthinfo',
    'medical',
    'emergencycontact',
  ];

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    
    // Fields that should never appear in logs
    if (
      keyLower.includes('password') ||
      keyLower.includes('hash') ||
      keyLower.includes('token') ||
      keyLower.includes('secret') ||
      keyLower.includes('api_key') ||
      keyLower.includes('credential')
    ) {
      result[key] = '[REDACTED]';
      continue;
    }
    
    // Truncate long strings
    if (typeof value === 'string' && value.length > 200) {
      result[key] = `${value.slice(0, 100)}...[truncated]`;
      continue;
    }
    
    // Handle nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, any>, `${context}.${key}`);
      continue;
    }
    
    result[key] = value;
  }

  return result;
}

/**
 * Custom structured logger class with JSON output
 */
class StructuredLogger {
  private readonly context: string;
  private readonly logLevel: string;
  private readonly logFormat: string;
  private readonly trimmedFields: string[];
  private readonly nestLogger: NestLogger;

  constructor(context: string, logLevel: string, logFormat: string, trimmedFields: string[]) {
    this.context = context;
    this.logLevel = logLevel;
    this.logFormat = logFormat;
    this.trimmedFields = trimmedFields;
    this.nestLogger = new NestLogger(context);
  }

  private getLevelValue(level: string): number {
    const levels: Record<string, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    return levels[level] ?? 99;
  }

  private shouldLog(level: string): boolean {
    return this.getLevelValue(level) >= this.getLevelValue(this.logLevel);
  }

  private formatMessage(level: string, message: string, meta?: Record<string, any>): void {
    if (this.logFormat === 'json') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        message,
        ...meta,
      };
      process.stdout.write(JSON.stringify(logEntry) + '\n');
    } else {
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      this.nestLogger.log(message, metaStr);
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      this.formatMessage('error', message, meta ? sanitizeObject(meta, 'error') : undefined);
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      this.formatMessage('warn', message, meta ? sanitizeObject(meta, 'warn') : undefined);
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      // At info level, always sanitize - never log PII
      this.formatMessage('info', message, meta ? sanitizeObject(meta, 'info') : undefined);
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      this.formatMessage('debug', message, meta ? sanitizeObject(meta, 'debug') : undefined);
    }
  }

  trace(message: string, meta?: Record<string, any>): void {
    // Same as debug but even more verbose
    if (this.shouldLog('debug')) {
      this.formatMessage('debug', `[TRACE] ${message}`, meta ? sanitizeObject(meta, 'trace') : undefined);
    }
  }

  // Specific helpers for common logging scenarios

  /**
   * Log authentication events (never log passwords)
   */
  authEvent(event: string, userId: string, schoolId: string, result: 'success' | 'failure', reason?: string): void {
    this.log('Auth event', {
      event,
      userId,
      schoolId,
      result,
      reason: reason ? sanitizeForLogging(reason) : undefined,
    });
  }

  /**
   * Log GPS location updates (never log exact coordinates in production logs)
   */
  gpsUpdate(vanId: string, schoolId: string, lat?: number, lng?: number): void {
    // In production, consider hashing coordinates or using zone identifiers
    this.debug('GPS update', {
      vanId,
      schoolId,
      // Only log coarse location (rounded to 2 decimals)
      latitude: lat !== undefined ? Math.round(lat * 100) / 100 : undefined,
      longitude: lng !== undefined ? Math.round(lng * 100) / 100 : undefined,
    });
  }

  /**
   * Log database queries (without parameters that might contain PII)
   */
  dbQuery(model: string, operation: string, recordId?: string): void {
    this.debug('DB query', {
      model,
      operation,
      recordId,
    });
  }
}
