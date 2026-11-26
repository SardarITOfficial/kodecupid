-- CreateTable
CREATE TABLE "role_permission_sets" (
    "role" "AdminRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permission_sets_pkey" PRIMARY KEY ("role")
);