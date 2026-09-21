// src/common/interfaces/auth.interface.ts
/**
 * User with school context - returned by JWT strategy after validation.
 * Contains all info needed for tenant scoping and RBAC.
 */
export interface UserWithSchool {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'DRIVER' | 'PARENT';
  isActive: boolean;
  schoolId: string;
  lastLoginAt?: Date;
  
  // For ownership checks (populated by JWT strategy)
  ownedStudentIds: string[];  // For PARENT: IDs of their children
  assignedVanIds: string[];   // For DRIVER: IDs of vans they drive
  assignedTripIds: string[];  // For DRIVER: IDs of active trips
}

/**
 * JWT Access Token Payload
 */
export interface JwtPayload {
  sub: string;              // User ID
  schoolId: string;         // Tenant school ID
  role: 'ADMIN' | 'DRIVER' | 'PARENT';
  iat: number;              // Issued at
  exp: number;              // Expiration
  aud: string;              // Audience
  iss: string;              // Issuer
}

/**
 * JWT Refresh Token Payload
 */
export interface RefreshTokenPayload {
  sub: string;              // User ID
  schoolId: string;         // Tenant school ID
  role: 'ADMIN' | 'DRIVER' | 'PARENT';
  jti: string;              // Unique token ID for revocation
  iat: number;              // Issued at
  exp: number;              // Expiration
  aud: string;              // Audience
  iss: string;              // Issuer
}

/**
 * Request with authenticated user attached
 */
export interface AuthenticatedRequest {
  user: UserWithSchool;
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, any>;
}

/**
 * Tenant context - used by middleware to inject school_id
 */
export interface TenantContext {
  schoolId: string;
  userId: string;
  userRole: 'ADMIN' | 'DRIVER' | 'PARENT';
}
