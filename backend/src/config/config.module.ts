// src/config/config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { validateEnv } from './validators';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [validateEnv],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        REDIS_TLS: Joi.boolean().default(false),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        JWT_AUDIENCE: Joi.string().required(),
        JWT_ISSUER: Joi.string().required(),
        ARGON2_MEMORY_COST: Joi.number().default(65536),
        ARGON2_TIME_COST: Joi.number().default(3),
        ARGON2_PARALLELISM: Joi.number().default(4),
        FCM_SERVICE_ACCOUNT_FILE: Joi.string().optional(),
        FCM_PROJECT_ID: Joi.string().optional(),
        FCM_PRIVATE_KEY_ID: Joi.string().optional(),
        FCM_PRIVATE_KEY: Joi.string().optional(),
        FCM_CLIENT_EMAIL: Joi.string().optional(),
        FCM_CLIENT_ID: Joi.string().optional(),
        RATE_LIMIT_TTL: Joi.number().default(60000),
        RATE_LIMIT_MAX_AUTH_REQUESTS: Joi.number().default(5),
        RATE_LIMIT_MAX_GPS_REQUESTS: Joi.number().default(20),
        RATE_LIMIT_MAX_GENERAL: Joi.number().default(100),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        LOG_FORMAT: Joi.string().valid('json', 'text').default('json'),
        LOG_REQUEST_ID_HEADER: Joi.string().default('x-request-id'),
        LOG_SENSITIVE_FIELDS: Joi.string().default('password,passwordHash,personalIdentifier,nationalId,healthInfo'),
        ENABLE_WEB_SOCKET: Joi.boolean().default(true),
        ENABLE_PUSH_NOTIFICATIONS: Joi.boolean().default(true),
        ENABLE_CSV_EXPORT: Joi.boolean().default(true),
        CORS_ORIGINS: Joi.string().default('*'),
        CORS_CREDENTIALS: Joi.boolean().default(true),
        GPS_LOCATION_TTL_SECONDS: Joi.number().default(300),
        GPS_BATCH_SIZE: Joi.number().default(100),
        GPS_ARCHIVE_INTERVAL_SECONDS: Joi.number().default(300),
        IDEMPOTENCY_TTL_SECONDS: Joi.number().default(86400),
        ENABLE_IDEMPOTENCY: Joi.boolean().default(true),
        LOG_TRIMMED_FIELDS: Joi.string().default('password,passwordHash,token,refreshToken,accessToken,apiKey,secret,credential'),
      }),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
