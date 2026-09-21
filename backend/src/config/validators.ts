// src/config/validators.ts
import { ConfigService } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

/**
 * Validates and transforms environment variables
 * Returns a validated config object
 */
export function validateEnv(config: Record<string, any>): Record<string, any> {
  return {
    ...config,
    // Parse comma-separated origins
    CORS_ORIGINS: config.CORS_ORIGINS?.split(',').map((o: string) => o.trim()) || ['*'],
    // Parse JSON arrays if needed
    LOG_TRIMMED_FIELDS: config.LOG_TRIMMED_FIELDS?.split(',').map((f: string) => f.trim()) || [],
    LOG_SENSITIVE_FIELDS: config.LOG_SENSITIVE_FIELDS?.split(',').map((f: string) => f.trim()) || [],
    // Parse boolean strings
    ENABLE_WEB_SOCKET: config.ENABLE_WEB_SOCKET === 'true' || config.ENABLE_WEB_SOCKET === true,
    ENABLE_PUSH_NOTIFICATIONS: config.ENABLE_PUSH_NOTIFICATIONS === 'true' || config.ENABLE_PUSH_NOTIFICATIONS === true,
    ENABLE_CSV_EXPORT: config.ENABLE_CSV_EXPORT === 'true' || config.ENABLE_CSV_EXPORT === true,
    ENABLE_IDEMPOTENCY: config.ENABLE_IDEMPOTENCY === 'true' || config.ENABLE_IDEMPOTENCY === true,
    CORS_CREDENTIALS: config.CORS_CREDENTIALS === 'true' || config.CORS_CREDENTIALS === true,
    REDIS_TLS: config.REDIS_TLS === 'true' || config.REDIS_TLS === true,
    // Parse numbers
    PORT: parseInt(config.PORT, 10) || 3000,
    RATE_LIMIT_TTL: parseInt(config.RATE_LIMIT_TTL, 10) || 60000,
    RATE_LIMIT_MAX_AUTH_REQUESTS: parseInt(config.RATE_LIMIT_MAX_AUTH_REQUESTS, 10) || 5,
    RATE_LIMIT_MAX_GPS_REQUESTS: parseInt(config.RATE_LIMIT_MAX_GPS_REQUESTS, 10) || 20,
    RATE_LIMIT_MAX_GENERAL: parseInt(config.RATE_LIMIT_MAX_GENERAL, 10) || 100,
    GPS_LOCATION_TTL_SECONDS: parseInt(config.GPS_LOCATION_TTL_SECONDS, 10) || 300,
    GPS_BATCH_SIZE: parseInt(config.GPS_BATCH_SIZE, 10) || 100,
    GPS_ARCHIVE_INTERVAL_SECONDS: parseInt(config.GPS_ARCHIVE_INTERVAL_SECONDS, 10) || 300,
    IDEMPOTENCY_TTL_SECONDS: parseInt(config.IDEMPOTENCY_TTL_SECONDS, 10) || 86400,
    ARGON2_MEMORY_COST: parseInt(config.ARGON2_MEMORY_COST, 10) || 65536,
    ARGON2_TIME_COST: parseInt(config.ARGON2_TIME_COST, 10) || 3,
    ARGON2_PARALLELISM: parseInt(config.ARGON2_PARALLELISM, 10) || 4,
  };
}

/**
 * Config registration for NestJS
 */
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',
  requestIdHeader: process.env.LOG_REQUEST_ID_HEADER || 'x-request-id',
  logTrimmedFields: (process.env.LOG_TRIMMED_FIELDS || 'password,passwordHash,token,refreshToken')
    .split(',')
    .map(f => f.trim()),
  logSensitiveFields: (process.env.LOG_SENSITIVE_FIELDS || 'password,passwordHash,personalIdentifier,nationalId,healthInfo')
    .split(',')
    .map(f => f.trim()),
  enableWebSocket: process.env.ENABLE_WEB_SOCKET === 'true' || process.env.ENABLE_WEB_SOCKET === true,
  enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true' || process.env.ENABLE_PUSH_NOTIFICATIONS === true,
  enableCsvExport: process.env.ENABLE_CSV_EXPORT === 'true' || process.env.ENABLE_CSV_EXPORT === true,
  enableIdempotency: process.env.ENABLE_IDEMPOTENCY === 'true' || process.env.ENABLE_IDEMPOTENCY === true,
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((o: string) => o.trim()),
  corsCredentials: process.env.CORS_CREDENTIALS === 'true' || process.env.CORS_CREDENTIALS === true,
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || '',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === true,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  audience: process.env.JWT_AUDIENCE || '',
  issuer: process.env.JWT_ISSUER || '',
}));

export const argon2Config = registerAs('argon2', () => ({
  memoryCost: parseInt(process.env.ARGON2_MEMORY_COST, 10) || 65536,
  timeCost: parseInt(process.env.ARGON2_TIME_COST, 10) || 3,
  parallelism: parseInt(process.env.ARGON2_PARALLELISM, 10) || 4,
}));

export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
  maxAuthRequests: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS, 10) || 5,
  maxGpsRequests: parseInt(process.env.RATE_LIMIT_MAX_GPS_REQUESTS, 10) || 20,
  maxGeneral: parseInt(process.env.RATE_LIMIT_MAX_GENERAL, 10) || 100,
}));

export const gpsConfig = registerAs('gps', () => ({
  locationTtlSeconds: parseInt(process.env.GPS_LOCATION_TTL_SECONDS, 10) || 300,
  batchSize: parseInt(process.env.GPS_BATCH_SIZE, 10) || 100,
  archiveIntervalSeconds: parseInt(process.env.GPS_ARCHIVE_INTERVAL_SECONDS, 10) || 300,
}));

export const fcmConfig = registerAs('fcm', () => ({
  serviceAccountFile: process.env.FCM_SERVICE_ACCOUNT_FILE,
  projectId: process.env.FCM_PROJECT_ID,
  privateKeyId: process.env.FCM_PRIVATE_KEY_ID,
  privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FCM_CLIENT_EMAIL,
  clientId: process.env.FCM_CLIENT_ID,
  authUri: process.env.FCM_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: process.env.FCM_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  authProviderX509CertUrl: process.env.FCM_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  clientX509CertUrl: process.env.FCM_CLIENT_X509_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project.iam.gserviceaccount.com',
}));

export const idempotencyConfig = registerAs('idempotency', () => ({
  ttlSeconds: parseInt(process.env.IDEMPOTENCY_TTL_SECONDS, 10) || 86400,
}));
