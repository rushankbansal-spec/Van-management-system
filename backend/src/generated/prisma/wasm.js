
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SchoolScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  address: 'address',
  phone: 'phone',
  email: 'email',
  timezone: 'timezone',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  email: 'email',
  passwordHash: 'passwordHash',
  firstName: 'firstName',
  lastName: 'lastName',
  phone: 'phone',
  role: 'role',
  isActive: 'isActive',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.VanScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  name: 'name',
  plateNumber: 'plateNumber',
  capacity: 'capacity',
  make: 'make',
  model: 'model',
  year: 'year',
  color: 'color',
  isActive: 'isActive',
  currentLatitude: 'currentLatitude',
  currentLongitude: 'currentLongitude',
  currentSpeed: 'currentSpeed',
  currentHeading: 'currentHeading',
  lastGpsUpdate: 'lastGpsUpdate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  driverId: 'driverId'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  firstName: 'firstName',
  lastName: 'lastName',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  parentId: 'parentId',
  vanId: 'vanId',
  emergencyContactName: 'emergencyContactName',
  emergencyContactPhone: 'emergencyContactPhone',
  medicalInfo: 'medicalInfo',
  photoUrl: 'photoUrl',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.RouteScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.RouteStopScalarFieldEnum = {
  id: 'id',
  routeId: 'routeId',
  stopOrder: 'stopOrder',
  name: 'name',
  latitude: 'latitude',
  longitude: 'longitude',
  address: 'address',
  estimatedArrival: 'estimatedArrival',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.VanRouteScalarFieldEnum = {
  id: 'id',
  vanId: 'vanId',
  routeId: 'routeId',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TripScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  vanId: 'vanId',
  routeId: 'routeId',
  driverId: 'driverId',
  tripType: 'tripType',
  status: 'status',
  scheduledStart: 'scheduledStart',
  actualStart: 'actualStart',
  actualEnd: 'actualEnd',
  expectedDurationMinutes: 'expectedDurationMinutes',
  startLatitude: 'startLatitude',
  startLongitude: 'startLongitude',
  endLatitude: 'endLatitude',
  endLongitude: 'endLongitude',
  sosActivated: 'sosActivated',
  sosActivatedAt: 'sosActivatedAt',
  sosResolvedAt: 'sosResolvedAt',
  sosReason: 'sosReason',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.TripLocationScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  latitude: 'latitude',
  longitude: 'longitude',
  speed: 'speed',
  heading: 'heading',
  accuracy: 'accuracy',
  recordedAt: 'recordedAt'
};

exports.Prisma.PickupLogScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  tripId: 'tripId',
  studentId: 'studentId',
  action: 'action',
  idempotencyKey: 'idempotencyKey',
  actionTakenAt: 'actionTakenAt',
  latitude: 'latitude',
  longitude: 'longitude',
  verifiedBy: 'verifiedBy',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  type: 'type',
  severity: 'severity',
  vanId: 'vanId',
  tripId: 'tripId',
  studentId: 'studentId',
  driverId: 'driverId',
  userId: 'userId',
  title: 'title',
  message: 'message',
  data: 'data',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  senderId: 'senderId',
  receiverId: 'receiverId',
  messageType: 'messageType',
  content: 'content',
  isRead: 'isRead',
  readAt: 'readAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  schoolId: 'schoolId',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  revokedAt: 'revokedAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  PARENT: 'PARENT'
};

exports.TripStatus = exports.$Enums.TripStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  SOS_ACTIVE: 'SOS_ACTIVE'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PENDING: 'PENDING',
  PICKED_UP: 'PICKED_UP',
  DROPPED_OFF: 'DROPPED_OFF',
  ABSENT: 'ABSENT'
};

exports.Prisma.ModelName = {
  School: 'School',
  User: 'User',
  Van: 'Van',
  Student: 'Student',
  Route: 'Route',
  RouteStop: 'RouteStop',
  VanRoute: 'VanRoute',
  Trip: 'Trip',
  TripLocation: 'TripLocation',
  PickupLog: 'PickupLog',
  Alert: 'Alert',
  Message: 'Message',
  RefreshToken: 'RefreshToken'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
