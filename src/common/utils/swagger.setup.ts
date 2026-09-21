// src/common/utils/swagger.setup.ts
import { SwaggerDocument } from '@nestjs/swagger';

/**
 * Swagger configuration helper
 * Ensures consistent API documentation across all endpoints
 */
export function setupSwagger(document: SwaggerDocument): void {
  // Additional Swagger customization can go here
  // e.g., adding tags, customizing UI, etc.
}

/**
 * Helper to add tenant context to Swagger parameters
 */
export function addTenantParam(schema: any): any {
  return {
    ...schema,
    requirements: {
      schoolId: {
        description: 'School ID - extracted from JWT claims, not from request',
        type: 'string',
        format: 'uuid',
      },
    },
  };
}

/**
 * Standard API response decorators for consistency
 */
export const StandardResponses = {
  notFound: {
    status: 404,
    description: 'Resource not found',
  },
  forbidden: {
    status: 403,
    description: 'Access denied - insufficient permissions or cross-tenant access',
  },
  unauthorized: {
    status: 401,
    description: 'Authentication required or token invalid',
  },
  rateLimited: {
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  },
  serverError: {
    status: 500,
    description: 'Internal server error',
  },
};
