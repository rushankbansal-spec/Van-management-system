// src/main.ts - Application entry point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { setupSwagger } from './common/utils/swagger.setup';
import { setupRedis } from './database/redis/redis.module';
import { setupPrisma } from './database/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allow iframed admin panels
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  // Request ID middleware for tracing
  app.use(new RequestIdMiddleware().use);

  // HTTP logging with JSON format
  const logFormat = process.env.LOG_FORMAT === 'json' ? 'combined' : 'dev';
  app.use(morgan(logFormat, {
    skip: (req, res) => {
      // Skip health checks and favicon
      return req.path === '/health' || req.path === '/favicon.ico';
    },
  }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS for web clients
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || true,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-request-id',
      'x-tenant-id',
      'x-idempotency-key',
    ],
  });

  // Global validation pipe - strict mode
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Reject if non-whitelisted properties present
      transform: true, // Transform payloads to DTO objects
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
          children: err.children?.map((c: any) => ({
            property: c.property,
            constraints: c.constraints,
          })) || [],
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('School Van Tracker API')
    .setDescription(
      'Multi-tenant SaaS API for real-time school van tracking.\n\n' +
      '## Authentication\n' +
      'All endpoints require JWT authentication. Use Bearer token in Authorization header.\n\n' +
      '## Multi-tenancy\n' +
      'Every request is scoped to the authenticated user\'s school. ' +
      'Cross-school access is blocked at the infrastructure level.\n\n' +
      '## Rate Limiting\n' +
      'Auth endpoints: 5 requests/min\n' +
      'GPS endpoints: 20 requests/min\n' +
      'General endpoints: 100 requests/min',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from /auth/login',
      },
      'JWT',
    )
    .addServer(process.env.HOST || 'http://localhost:3000', 'Local development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  // Setup Redis connection
  const redisModule = app.get('RedisModule');
  await setupRedis(redisModule);

  // Setup Prisma
  const prismaService = app.get(PrismaService);
  await setupPrisma(prismaService);

  // Health check readiness
  app.connectRedis = () => redisModule.getRedisClient();
  app.connectPrisma = () => prismaService;

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚐 School Van Tracker API running at http://${host}:${port}`);
  console.log(`📚 API docs available at http://${host}:${port}/api/docs`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
