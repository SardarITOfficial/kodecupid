-- Milestone 1 completion:
--   * profession categories (healthcare, education, EMS, law enforcement,
--     firefighters, military/veterans, engineers, technicians, other)
--   * workplace privacy flags prepared for geofencing
--   * Safety Tips as a third mandatory legal document
--   * metro regions with launch status and the 200-paid-subscriber threshold

-- CreateEnum
CREATE TYPE "ProfessionCategory" AS ENUM ('HEALTHCARE', 'EDUCATION', 'EMS', 'LAW_ENFORCEMENT', 'FIREFIGHTER', 'MILITARY_VETERAN', 'ENGINEER', 'TECHNICIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "RegionLaunchStatus" AS ENUM ('PLANNED', 'PRE_LAUNCH', 'LAUNCHED', 'PAUSED');

-- AlterEnum. Safe inside Prisma's migration transaction on PostgreSQL 12+
-- because the new value is not referenced later in this transaction.
ALTER TYPE "DocumentType" ADD VALUE 'SAFETY_TIPS';

-- Rename rather than drop/recreate so any existing radius value survives.
ALTER TABLE "profiles" RENAME COLUMN "workplaceRadiusM" TO "workplaceHideRadiusMeters";

ALTER TABLE "profiles"
  ADD COLUMN "professionCategory" "ProfessionCategory",
  ADD COLUMN "workplacePrivacyEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "launchStatus" "RegionLaunchStatus" NOT NULL DEFAULT 'PLANNED',
    "paidSubscriberThreshold" INTEGER NOT NULL DEFAULT 200,
    "paidSubscriberCount" INTEGER NOT NULL DEFAULT 0,
    "launchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- Derived geography point, kept in sync with latitude/longitude by PostgreSQL.
ALTER TABLE "regions"
  ADD COLUMN "locationPoint" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED;

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE INDEX "regions_launchStatus_idx" ON "regions"("launchStatus");

-- GiST index for future proximity / launch-radius queries.
CREATE INDEX "regions_locationPoint_gist" ON "regions" USING GIST ("locationPoint");
