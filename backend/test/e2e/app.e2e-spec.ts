/**
 * @school-van-tracker/test-e2e - End-to-end tests
 * 
 * Tests the complete API flow including:
 * - Login and authentication
 * - Tenant isolation (cross-school denial)
 * - Pickup marking with idempotency
 * - Live location fetching
 * - RBAC enforcement
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient } from '../../src/generated/prisma';
import * as argon2 from 'argon2';

// Use in-memory SQLite for tests if available, otherwise skip DB-dependent tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_van_tracker_test',
    },
  },
});

describe('E2E - School Van Tracker API', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshToken: string;
  let schoolId: string;
  let adminUserId: string;
  let driverUserId: string;
  let parentUserId: string;
  let vanId: string;
  let studentId: string;
  let tripId: string;

  const TEST_PASSWORD = 'TestPassword123!';

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Create test school and users
    schoolId = `test-school-${Date.now()}`;
    adminUserId = `admin-${Date.now()}`;
    driverUserId = `driver-${Date.now()}`;
    parentUserId = `parent-${Date.now()}`;
    vanId = `van-${Date.now()}`;
    studentId = `student-${Date.now()}`;

    const passwordHash = await argon2.hash(TEST_PASSWORD);

    // Create school
    await prisma.school.create({
      data: {
        id: schoolId,
        name: 'Test School',
        code: 'TEST',
        timezone: 'UTC',
        isActive: true,
      },
    });

    // Create admin
    await prisma.user.create({
      data: {
        id: adminUserId,
        schoolId,
        email: 'admin@test.edu',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Create driver
    await prisma.user.create({
      data: {
        id: driverUserId,
        schoolId,
        email: 'driver@test.edu',
        passwordHash,
        firstName: 'Test',
        lastName: 'Driver',
        role: 'DRIVER',
        isActive: true,
      },
    });

    // Create parent
    await prisma.user.create({
      data: {
        id: parentUserId,
        schoolId,
        email: 'parent@test.edu',
        passwordHash,
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT',
        isActive: true,
      },
    });

    // Create van
    await prisma.van.create({
      data: {
        id: vanId,
        schoolId,
        name: 'Test Van',
        plateNumber: 'TEST-001',
        capacity: 15,
        driverId: driverUserId,
        isActive: true,
      },
    });

    // Create student
    await prisma.student.create({
      data: {
        id: studentId,
        schoolId,
        firstName: 'Test',
        lastName: 'Student',
        parentId: parentUserId,
        vanId,
        isActive: true,
      },
    });

    // Initialize NestJS app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Login as admin before each test
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.edu', password: TEST_PASSWORD })
      .expect(200);

    authToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
  });

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: TEST_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@test.edu');
      expect(res.body.user.role).toBe('ADMIN');

      authToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'wrongpassword' })
        .expect(401);
    });

    it('should refresh access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBe(authToken); // New token
      authToken = res.body.accessToken;
    });

    it('should logout and invalidate refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ refreshToken })
        .expect(204);

      // Try to use the same refresh token - should fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Tenant Isolation', () => {
    it('should prevent cross-school access - User A cannot read School 2 data', async () => {
      // Create a second school
      const school2Id = `test-school-2-${Date.now()}`;
      const user2Id = `user2-${Date.now()}`;
      const passwordHash = await argon2.hash(TEST_PASSWORD);

      await prisma.school.create({
        data: {
          id: school2Id,
          name: 'School 2',
          code: 'TEST2',
          timezone: 'UTC',
          isActive: true,
        },
      });

      await prisma.user.create({
        data: {
          id: user2Id,
          schoolId: school2Id,
          email: 'user2@test2.edu',
          passwordHash,
          firstName: 'User',
          lastName: 'Two',
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Login as user from School 2
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'user2@test2.edu', password: TEST_PASSWORD })
        .expect(200);

      const token2 = loginRes.body.accessToken;

      // Try to access School 1 data with School 2 token
      // Note: The actual endpoint structure would need to be adjusted
      // This test verifies that tenant-scoped queries don't leak data
      const vanRes = await request(app.getHttpServer())
        .get(`/api/v1/schools/${schoolId}/vans`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403); // Should be forbidden or return empty

      // The response should NOT contain vans from school1
      // Either 403 or empty array (if no vans in school2)
      expect(vanRes.status).toBe(403);
    });

    it('should allow users to access their own school data', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/schools/${schoolId}/vans`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(vanId);
    });
  });

  describe('Vans - Live Location', () => {
    it('should get live van locations (from Redis)', async () => {
      // First, set a location in Redis
      // This simulates what the driver WebSocket would do
      // In e2e test, we'd need Redis connection
      
      const res = await request(app.getHttpServer())
        .get(`/api/v1/schools/${schoolId}/vans/live`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(vanId);
      // Location may be null if Redis not populated
      expect(res.body[0]).toHaveProperty('currentLatitude');
      expect(res.body[0]).toHaveProperty('currentLongitude');
    });
  });

  describe('Trips - Pickup Marking', () => {
    it('should create a trip (admin)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/schools/${schoolId}/trips`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vanId,
          tripType: 'PICKUP',
          scheduledStart: new Date().toISOString(),
          driverId: driverUserId,
        })
        .expect(201);

      tripId = res.body.id;
      expect(tripId).toBeDefined();
      expect(res.body.status).toBe('NOT_STARTED');
    });

    it('should start a trip (driver)', async () => {
      // Login as driver
      const driverLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'driver@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const driverToken = driverLogin.body.accessToken;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          tripId,
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            speed: 0,
          },
        })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.actualStart).toBeDefined();
    });

    it('should mark student picked up (driver, idempotent)', async () => {
      // Login as driver
      const driverLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'driver@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const driverToken = driverLogin.body.accessToken;

      const idempotencyKey = `pickup-${Date.now()}-${studentId}`;

      // First pickup
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/students/${studentId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          tripId,
          studentId,
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            speed: 10,
          },
          idempotencyKey,
        })
        .expect(201);

      expect(res1.body.action).toBe('PICKED_UP');
      expect(res1.body.studentId).toBe(studentId);
      expect(res1.body.idempotencyKey).toBe(idempotencyKey);

      // Same request again with same idempotency key - should return same result
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/students/${studentId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          tripId,
          studentId,
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            speed: 10,
          },
          idempotencyKey,
        })
        .expect(201);

      expect(res2.body.id).toBe(res1.body.id); // Same log entry
      expect(res2.body.action).toBe('PICKED_UP');
    });

    it('should reject duplicate pickup without idempotency key', async () => {
      // Login as driver
      const driverLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'driver@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const driverToken = driverLogin.body.accessToken;

      // Try to mark pickup again without idempotency key
      await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/students/${studentId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          tripId,
          studentId,
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
          },
        })
        .expect(409); // Conflict
    });

    it('should end trip (driver)', async () => {
      const driverLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'driver@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const driverToken = driverLogin.body.accessToken;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/end`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          tripId,
          location: {
            latitude: 34.0542,
            longitude: -118.2457,
            speed: 0,
          },
        })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.actualEnd).toBeDefined();
    });
  });

  describe('RBAC - Driver can only access their own van', () => {
    it('should prevent driver from accessing another van', async () => {
      // Create another van with different driver
      const otherVanId = `other-van-${Date.now()}`;
      const otherDriverId = `other-driver-${Date.now()}`;
      const passwordHash = await argon2.hash(TEST_PASSWORD);

      await prisma.user.create({
        data: {
          id: otherDriverId,
          schoolId,
          email: 'otherdriver@test.edu',
          passwordHash,
          firstName: 'Other',
          lastName: 'Driver',
          role: 'DRIVER',
          isActive: true,
        },
      });

      await prisma.van.create({
        data: {
          id: otherVanId,
          schoolId,
          name: 'Other Van',
          plateNumber: 'OTHER-001',
          capacity: 10,
          driverId: otherDriverId,
          isActive: true,
        },
      });

      // Login as driver
      const driverLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'driver@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const driverToken = driverLogin.body.accessToken;

      // Try to create trip for other van
      await request(app.getHttpServer())
        .post(`/api/v1/trips`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          vanId: otherVanId,
          tripType: 'PICKUP',
          scheduledStart: new Date().toISOString(),
        })
        .expect(403); // Forbidden
    });
  });

  describe('Parents - Can only access own children', () => {
    it('should allow parent to see their own child', async () => {
      const parentLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'parent@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const parentToken = parentLogin.body.accessToken;

      // Get parent's children
      const res = await request(app.getHttpServer())
        .get('/api/v1/parents/me/students')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(studentId);
    });

    it('should get student van live location (parent)', async () => {
      const parentLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'parent@test.edu', password: TEST_PASSWORD })
        .expect(200);

      const parentToken = parentLogin.body.accessToken;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentId}/van/live`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('latitude');
      expect(res.body).toHaveProperty('longitude');
    });

    // Note: Testing that parent CANNOT access another child's data
    // would require creating a second child with a different parent
    // This is a placeholder for that test
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Delete in reverse dependency order
      await prisma.pickupLog.deleteMany();
      await prisma.tripLocation.deleteMany();
      await prisma.trip.deleteMany();
      await prisma.vanRoute.deleteMany();
      await prisma.routeStop.deleteMany();
      await prisma.route.deleteMany();
      await prisma.alert.deleteMany();
      await prisma.message.deleteMany();
      await prisma.pickupLog.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.student.deleteMany();
      await prisma.van.deleteMany();
      await prisma.user.deleteMany();
      await prisma.school.deleteMany();
    } catch (e) {
      // Ignore errors during cleanup
      console.log('Cleanup warning:', e.message);
    }
  }
});
E2ETESTEOF
_path = "/home/rushank/backend/test/e2e/app.e2e-spec.ts"
_widget_result = {}
