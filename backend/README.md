# School Van Tracker - Multi-Tenant SaaS Backend

A production-grade, secure, multi-tenant SaaS backend for real-time school van tracking. Built with NestJS, TypeScript, PostgreSQL, Redis, and WebSockets.

## Features

### Multi-Tenancy (Critical)
- Single shared PostgreSQL database with `school_id` on every tenant-scoped table
- Centralized tenant scoping via middleware that extracts `school_id` from JWT claims (never from request params)
- Automated cross-tenant access denial tests
- Composite indexes on `(school_id, id)` and other frequently queried columns

### Authentication & Authorization
- JWT authentication with short-lived access tokens (15min) and refresh token rotation (7d)
- Argon2id password hashing with configurable parameters
- Role-based access control (RBAC): ADMIN, DRIVER, PARENT
- Resource ownership guards: parents see only their children, drivers only their vans

### Real-Time GPS Tracking
- WebSocket (Socket.IO) for live GPS broadcast from drivers
- Redis for latest position caching (fast reads, 5-min TTL)
- Batched PostgreSQL writes for location history (every 5 min)
- Graceful reconnection handling for dropped driver connections

### API Endpoints

**Auth:**
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/register (internal)

**Admin (school-scoped):**
- CRUD /schools/:schoolId/vans
- CRUD /schools/:schoolId/drivers
- CRUD /schools/:schoolId/students
- CRUD /schools/:schoolId/routes
- GET /schools/:schoolId/vans/live (from Redis)
- GET /schools/:schoolId/registers?date=&vanId= (CSV export)
- POST /schools/:schoolId/alerts

**Driver:**
- POST /trips (create trip for assigned van)
- POST /trips/:tripId/start
- POST /trips/:tripId/end
- POST /trips/:tripId/location (GPS ping)
- POST /trips/:tripId/students/:studentId/pickup (idempotent)
- POST /trips/:tripId/students/:studentId/drop (idempotent)
- POST /trips/:tripId/students/:studentId/absent
- POST /trips/:tripId/sos (SOS alert)
- POST /trips/:tripId/sos/resolve

**Parent:**
- GET /students/:studentId/van/live
- GET /students/:studentId/history?from=&to=
- GET /parents/me/students
- WebSocket: van:{vanId}:location subscription

### Security
- Input validation on every endpoint (class-validator/zod)
- Rate limiting: auth (5/min), GPS (20/min), general (100/min)
- Structured JSON logging with request IDs, no PII at info level
- Idempotency keys on pickup/drop to prevent duplicate attendance
- Database transactions for multi-write operations
- Least-privilege DB user recommended
- Health check endpoints (/health, /ready, /live)

### Scalability Design (500+ concurrent vans)

**GPS Write Path:**
1. Driver sends GPS ping every 5-10s via WebSocket
2. Server validates, updates Redis (O(1) write, overwrites latest)
3. Every 5 minutes, background job batches locations to PostgreSQL
4. This avoids 500-1000 writes/second to PostgreSQL

**GPS Read Path:**
1. Parents/admins request van location
2. Server reads from Redis (sub-millisecond)
3. If Redis miss, falls back to PostgreSQL van.currentLatitude

**WebSocket Scaling:**
- Stateless gateway design - any server can handle any connection
- Connection state stored in Redis for multi-server deployments
- Each van's location broadcast goes to all subscribers of that van

### Tech Stack
- Node.js + TypeScript (strict mode)
- NestJS framework
- PostgreSQL + Prisma ORM
- Redis (ioredis) for caching and rate limiting
- Socket.IO for WebSockets
- JWT (access + refresh tokens)
- Argon2id for password hashing
- Firebase Cloud Messaging (FCM) for push notifications (abstracted)
- class-validator for DTO validation
- Jest + Supertest for testing

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database, Redis, and JWT secrets

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
pnpm db:seed

# Start development server
pnpm start:dev
```

### Environment Variables

See `.env.example` for all required variables. Key variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/school_van_tracker"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (change these in production!)
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-chars
JWT_AUDIENCE=school-van-tracker
JWT_ISSUER=school-van-tracker-api

# FCM (optional, for push notifications)
FCM_SERVICE_ACCOUNT_FILE=/path/to/service-account.json
```

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests (requires test database)
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### API Documentation

Once the server is running, access Swagger docs at:
`http://localhost:3000/api/docs`

## Architecture

```
src/
├── app.module.ts          # Root module
├── main.ts                # Entry point
├── app.controller.ts      # Health endpoints
├── common/
│   ├── decorators/        # @Roles, @OwnsResource, @CurrentUser
│   ├── guards/            # RolesGuard, ResourceOwnershipGuard
│   ├── interceptors/      # LoggingInterceptor, TenantInterceptor
│   ├── middleware/        # TenantMiddleware (centralized scoping)
│   ├── filters/           # Global exception filter
│   ├── logging/           # Structured JSON logger
│   └── interfaces/        # Auth interfaces, DTOs
├── config/                # Environment config with validation
├── database/
│   ├── prisma/            # PrismaService, PrismaModule
│   └── redis/             # RedisService, RedisModule
├── auth/                  # JWT auth, guards, strategies
├── schools/               # School CRUD (admin only)
├── vans/                  # Van management, live location
├── drivers/               # Driver management
├── students/              # Student management
├── routes/                # Route and stop management
├── trips/                 # Trip CRUD, pickup/drop, SOS
├── alerts/                # Alert management
├── notifications/         # FCM push notifications
├── websocket/             # Socket.IO gateway
├── health/                # Health check endpoints
└── rate-limit/            # Rate limiting service
```

## Database Schema

See `prisma/schema.prisma` for the complete schema. Key tables:

- **schools**: Tenant metadata
- **users**: ALL users (admins, drivers, parents) with role field
- **vans**: Vehicles with driver assignment, current GPS from Redis
- **students**: Children with parent link and van assignment
- **routes**: Pickup/drop routes with ordered stops
- **trips**: Individual trip instances (PICKUP/DROP)
- **trip_locations**: GPS history (archived from Redis)
- **pickup_logs**: Attendance records (idempotency via unique key)
- **alerts**: Notifications (SOS, delays, custom)
- **messages**: Internal messaging
- **refresh_tokens**: JWT refresh token storage

## Security Considerations

### Tenant Isolation
The `TenantMiddleware` extracts `school_id` from validated JWT claims and attaches it to the request. ALL service methods MUST include `school_id` in their Prisma queries. The RBAC guards provide additional enforcement:
- `RolesGuard`: Checks `@Roles()` decorator
- `ResourceOwnershipGuard`: Checks `@OwnsResource()` for parent/child, driver/van relationships

### Why we don't use Prisma middleware for auto-filtering
Prisma doesn't have a built-in middleware system for auto-injecting WHERE clauses. Options considered:
1. **Prisma Client extensions** (experimental) - Not stable enough for production
2. **Database row-level security (RLS)** - Complex to set up, harder to debug
3. **Explicit school_id in every query** (chosen) - Clear, testable, no magic

We compensate with:
- Code review requirement: all queries must include school_id
- Unit tests for tenant service methods
- E2E test for cross-tenant denial
- RBAC guards as defense-in-depth

### Idempotency
Pickup/drop endpoints accept an optional `idempotencyKey` (UUID). The first request creates the log; subsequent requests with the same key return the existing log. This prevents duplicate attendance from retried requests.

### Rate Limiting
Redis-based sliding window rate limiting:
- Auth endpoints: 5 requests/minute per IP/user
- GPS endpoints: 20 requests/minute per driver
- General endpoints: 100 requests/minute per user

### Password Security
- Argon2id with configurable memory (64MB), iterations (3), parallelism (4)
- Passwords never logged or returned in responses
- Password change requires current password verification
- Changing password revokes all refresh tokens

## Production Deployment

### Database
- Create a dedicated PostgreSQL user with minimal permissions
- Enable SSL connections
- Set up automated backups
- Monitor connection pool usage

### Redis
- Enable authentication
- Use TLS in production
- Set maxmemory policy (allkeys-lru recommended)
- Monitor memory usage (GPS data is ephemeral, TTL'd)

### Application
- Set `NODE_ENV=production`
- Use strong, unique JWT secrets (generate with `openssl rand -base64 64`)
- Configure proper CORS origins
- Enable request ID propagation for distributed tracing
- Set up log aggregation (ELK, Datadog, etc.)

### Scaling
- Horizontal: Deploy multiple instances behind load balancer
- WebSocket connections are sticky or use Redis pub/sub for cross-instance broadcasts
- PostgreSQL read replicas for read-heavy workloads
- Redis cluster for high availability

## Development

### Adding a new endpoint
1. Create DTO in `src/<resource>/dto/`
2. Add service method in `src/<resource>/<resource>.service.ts`
3. Add controller endpoint in `src/<resource>/<resource>.controller.ts`
4. Apply `@Roles()` and `@OwnsResource()` decorators as needed
5. Ensure school_id is included in all Prisma queries
6. Write unit tests for service logic
7. Write e2e tests for endpoint behavior

### Database Changes
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Run `npx prisma generate` to update client
4. Update seed script if adding new required fields

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT
READMEEOF
_path = "/home/rushank/backend/README.md"
_widget_result = {}
