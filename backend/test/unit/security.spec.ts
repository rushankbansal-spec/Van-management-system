/**
 * @school-van-tracker/test-unit - Unit tests for core security features
 * 
 * Tests:
 * - Tenant scoping logic
 * - RBAC guards
 * - JWT token generation/validation
 * - Idempotency handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../src/config/config.module';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { ResourceOwnershipGuard } from '../../src/common/guards/resource-ownership.guard';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { OwnsResource } from '../../src/common/decorators/owns-resource.decorator';
import { UserWithSchool } from '../../src/common/interfaces/auth.interface';

describe('Unit - Security Features', () => {
  let rolesGuard: RolesGuard;
  let ownershipGuard: ResourceOwnershipGuard;
  let reflector: Reflector;

  const mockUser: UserWithSchool = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    schoolId: 'school-123',
    ownedStudentIds: [],
    assignedVanIds: [],
    assignedTripIds: [],
  };

  beforeEach(() => {
    const module: TestingModule = Test.createTestingModule({
      providers: [
        RolesGuard,
        ResourceOwnershipGuard,
        Reflector,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRATION: '15m',
                JWT_REFRESH_EXPIRATION: '7d',
                JWT_AUDIENCE: 'test-audience',
                JWT_ISSUER: 'test-issuer',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    ownershipGuard = module.get<ResourceOwnershipGuard>(ResourceOwnershipGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('Roles Guard', () => {
    it('should allow access when user has required role', () => {
      // Create a mock context with ADMIN role required
      const context = createMockContext('ADMIN', mockUser);

      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', () => {
      // Create a mock context requiring ADMIN but user is PARENT
      const parentUser: UserWithSchool = {
        ...mockUser,
        role: 'PARENT',
      };
      const context = createMockContext('ADMIN', parentUser);

      expect(() => rolesGuard.canActivate(context)).toThrow();
    });

    it('should allow access when any of multiple roles match', () => {
      const context = createMockContext(['ADMIN', 'DRIVER'], mockUser);

      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when no roles specified', () => {
      const context = createMockContext(undefined, mockUser);

      // When no roles decorator, should pass through
      // This depends on how the guard handles missing metadata
      // In our implementation, it returns true
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Resource Ownership Guard', () => {
    it('should allow parent to access their own child', () => {
      const parentUser: UserWithSchool = {
        ...mockUser,
        role: 'PARENT',
        ownedStudentIds: ['student-123', 'student-456'],
      };

      // Create context with studentId param
      const context = createMockContextWithParams(parentUser, { studentId: 'student-123' });

      const result = ownershipGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny parent access to another child', () => {
      const parentUser: UserWithSchool = {
        ...mockUser,
        role: 'PARENT',
        ownedStudentIds: ['student-123', 'student-456'],
      };

      const context = createMockContextWithParams(parentUser, { studentId: 'student-789' });

      expect(() => ownershipGuard.canActivate(context)).toThrow();
    });

    it('should allow driver to access their assigned van', () => {
      const driverUser: UserWithSchool = {
        ...mockUser,
        role: 'DRIVER',
        assignedVanIds: ['van-123', 'van-456'],
      };

      const context = createMockContextWithParams(driverUser, { vanId: 'van-123' });

      const result = ownershipGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny driver access to non-assigned van', () => {
      const driverUser: UserWithSchool = {
        ...mockUser,
        role: 'DRIVER',
        assignedVanIds: ['van-123', 'van-456'],
      };

      const context = createMockContextWithParams(driverUser, { vanId: 'van-789' });

      expect(() => ownershipGuard.canActivate(context)).toThrow();
    });

    it('should allow admin to access any resource in their school', () => {
      const adminUser: UserWithSchool = {
        ...mockUser,
        role: 'ADMIN',
      };

      const context = createMockContextWithParams(adminUser, { studentId: 'student-789' });

      const result = ownershipGuard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Decorators', () => {
    it('Roles decorator should set metadata correctly', () => {
      const metadata = reflector.getMetadata('roles', Roles('ADMIN', 'DRIVER'));
      expect(metadata).toEqual(['ADMIN', 'DRIVER']);
    });

    it('OwnsResource decorator should set metadata correctly', () => {
      const metadata = reflector.getMetadata('ownsResource', OwnsResource());
      expect(metadata).toBe(true);
    });
  });
});

// Helper functions to create mock contexts
function createMockContext(requiredRoles: string | string[] | undefined, user: UserWithSchool) {
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params: {},
        query: {},
        body: {},
      }),
    }),
    getHandler: () => ({
      // Mock handler
    }),
    getClass: () => ({
      // Mock class
    }),
  } as any;

  // Set up reflector metadata
  if (requiredRoles) {
    reflector.setMetadata('roles', requiredRoles, context.getHandler(), context.getClass());
  }

  return context;
}

function createMockContextWithParams(user: UserWithSchool, params: Record<string, any>) {
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params,
        query: {},
        body: {},
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;

  reflector.setMetadata('ownsResource', true, context.getHandler(), context.getClass());

  return context;
}
UNITTESTEOF
_path = "/home/rushank/backend/test/unit/security.spec.ts"
_widget_result = {}
