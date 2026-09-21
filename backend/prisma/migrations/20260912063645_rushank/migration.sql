-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DRIVER', 'PARENT');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SOS_ACTIVE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PICKED_UP', 'DROPPED_OFF', 'ABSENT');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vans" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "plateNumber" VARCHAR(20) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 15,
    "make" VARCHAR(50),
    "model" VARCHAR(50),
    "year" INTEGER,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentLatitude" REAL,
    "currentLongitude" REAL,
    "currentSpeed" INTEGER,
    "currentHeading" INTEGER,
    "lastGpsUpdate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "driverId" UUID,

    CONSTRAINT "vans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE,
    "gender" VARCHAR(20),
    "parentId" UUID NOT NULL,
    "vanId" UUID,
    "emergencyContactName" VARCHAR(200),
    "emergencyContactPhone" VARCHAR(20),
    "medicalInfo" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "address" TEXT,
    "estimatedArrival" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "van_routes" (
    "id" UUID NOT NULL,
    "vanId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "van_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "vanId" UUID NOT NULL,
    "routeId" UUID,
    "driverId" UUID NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT 'PICKUP',
    "status" "TripStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "scheduledStart" TIMESTAMPTZ NOT NULL,
    "actualStart" TIMESTAMPTZ,
    "actualEnd" TIMESTAMPTZ,
    "expectedDurationMinutes" INTEGER,
    "startLatitude" REAL,
    "startLongitude" REAL,
    "endLatitude" REAL,
    "endLongitude" REAL,
    "sosActivated" BOOLEAN NOT NULL DEFAULT false,
    "sosActivatedAt" TIMESTAMPTZ,
    "sosResolvedAt" TIMESTAMPTZ,
    "sosReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_locations" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "speed" INTEGER,
    "heading" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_logs" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "action" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" VARCHAR(100),
    "actionTakenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL,
    "longitude" REAL,
    "verifiedBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "pickup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "vanId" UUID,
    "tripId" UUID,
    "studentId" UUID,
    "driverId" UUID,
    "userId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "revokedAt" TIMESTAMPTZ,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "schools_code_idx" ON "schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolId_email_idx" ON "User"("schoolId", "email");

-- CreateIndex
CREATE INDEX "User_schoolId_role_idx" ON "User"("schoolId", "role");

-- CreateIndex
CREATE INDEX "User_schoolId_isActive_idx" ON "User"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vans_plateNumber_key" ON "vans"("plateNumber");

-- CreateIndex
CREATE INDEX "vans_schoolId_id_idx" ON "vans"("schoolId", "id");

-- CreateIndex
CREATE INDEX "vans_schoolId_isActive_idx" ON "vans"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "vans_schoolId_driverId_idx" ON "vans"("schoolId", "driverId");

-- CreateIndex
CREATE INDEX "vans_schoolId_currentLatitude_currentLongitude_idx" ON "vans"("schoolId", "currentLatitude", "currentLongitude");

-- CreateIndex
CREATE UNIQUE INDEX "vans_schoolId_plateNumber_key" ON "vans"("schoolId", "plateNumber");

-- CreateIndex
CREATE INDEX "students_schoolId_id_idx" ON "students"("schoolId", "id");

-- CreateIndex
CREATE INDEX "students_schoolId_vanId_idx" ON "students"("schoolId", "vanId");

-- CreateIndex
CREATE INDEX "students_schoolId_parentId_idx" ON "students"("schoolId", "parentId");

-- CreateIndex
CREATE INDEX "students_schoolId_isActive_idx" ON "students"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "routes_schoolId_id_idx" ON "routes"("schoolId", "id");

-- CreateIndex
CREATE INDEX "routes_schoolId_isActive_idx" ON "routes"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "route_stops_routeId_stopOrder_idx" ON "route_stops"("routeId", "stopOrder");

-- CreateIndex
CREATE UNIQUE INDEX "van_routes_vanId_routeId_key" ON "van_routes"("vanId", "routeId");

-- CreateIndex
CREATE INDEX "trips_schoolId_id_idx" ON "trips"("schoolId", "id");

-- CreateIndex
CREATE INDEX "trips_schoolId_vanId_idx" ON "trips"("schoolId", "vanId");

-- CreateIndex
CREATE INDEX "trips_schoolId_driverId_idx" ON "trips"("schoolId", "driverId");

-- CreateIndex
CREATE INDEX "trips_schoolId_status_idx" ON "trips"("schoolId", "status");

-- CreateIndex
CREATE INDEX "trips_schoolId_scheduledStart_idx" ON "trips"("schoolId", "scheduledStart");

-- CreateIndex
CREATE INDEX "trips_schoolId_actualStart_idx" ON "trips"("schoolId", "actualStart");

-- CreateIndex
CREATE INDEX "trips_vanId_scheduledStart_idx" ON "trips"("vanId", "scheduledStart");

-- CreateIndex
CREATE INDEX "trip_locations_tripId_recordedAt_idx" ON "trip_locations"("tripId", "recordedAt");

-- CreateIndex
CREATE INDEX "trip_locations_tripId_idx" ON "trip_locations"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_logs_idempotencyKey_key" ON "pickup_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "pickup_logs_schoolId_id_idx" ON "pickup_logs"("schoolId", "id");

-- CreateIndex
CREATE INDEX "pickup_logs_schoolId_tripId_idx" ON "pickup_logs"("schoolId", "tripId");

-- CreateIndex
CREATE INDEX "pickup_logs_schoolId_studentId_idx" ON "pickup_logs"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "pickup_logs_idempotencyKey_idx" ON "pickup_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "pickup_logs_schoolId_tripId_action_idx" ON "pickup_logs"("schoolId", "tripId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_logs_schoolId_tripId_studentId_actionTakenAt_key" ON "pickup_logs"("schoolId", "tripId", "studentId", "actionTakenAt");

-- CreateIndex
CREATE INDEX "alerts_schoolId_id_idx" ON "alerts"("schoolId", "id");

-- CreateIndex
CREATE INDEX "alerts_schoolId_type_idx" ON "alerts"("schoolId", "type");

-- CreateIndex
CREATE INDEX "alerts_schoolId_severity_idx" ON "alerts"("schoolId", "severity");

-- CreateIndex
CREATE INDEX "alerts_schoolId_isRead_idx" ON "alerts"("schoolId", "isRead");

-- CreateIndex
CREATE INDEX "alerts_schoolId_createdAt_idx" ON "alerts"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_schoolId_vanId_idx" ON "alerts"("schoolId", "vanId");

-- CreateIndex
CREATE INDEX "alerts_schoolId_tripId_idx" ON "alerts"("schoolId", "tripId");

-- CreateIndex
CREATE INDEX "messages_schoolId_id_idx" ON "messages"("schoolId", "id");

-- CreateIndex
CREATE INDEX "messages_schoolId_senderId_idx" ON "messages"("schoolId", "senderId");

-- CreateIndex
CREATE INDEX "messages_schoolId_receiverId_idx" ON "messages"("schoolId", "receiverId");

-- CreateIndex
CREATE INDEX "messages_schoolId_isRead_idx" ON "messages"("schoolId", "isRead");

-- CreateIndex
CREATE INDEX "messages_schoolId_createdAt_idx" ON "messages"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_schoolId_idx" ON "refresh_tokens"("userId", "schoolId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_expiresAt_idx" ON "refresh_tokens"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vans" ADD CONSTRAINT "vans_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vans" ADD CONSTRAINT "vans_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_routes" ADD CONSTRAINT "van_routes_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_routes" ADD CONSTRAINT "van_routes_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_logs" ADD CONSTRAINT "pickup_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_logs" ADD CONSTRAINT "pickup_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_logs" ADD CONSTRAINT "pickup_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "vans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
