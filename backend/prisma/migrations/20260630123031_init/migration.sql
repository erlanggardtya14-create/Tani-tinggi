-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FertilizerType" AS ENUM ('ORGANIC_COMPOST', 'ORGANIC_MANURE', 'ORGANIC_LIQUID', 'CHEMICAL_UREA', 'CHEMICAL_NPK', 'NONE');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'AI_VALIDATING', 'AI_REJECTED', 'CALCULATING', 'CERTIFYING', 'CERTIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'PICKUP_TRUCK', 'MEDIUM_TRUCK', 'HEAVY_TRUCK', 'ELECTRIC_VEHICLE');

-- CreateEnum
CREATE TYPE "EcoGrade" AS ENUM ('A', 'B', 'C', 'D', 'F');

-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('PENDING', 'MINTING', 'MINTED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FARMER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "farmName" TEXT NOT NULL,
    "farmLocation" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_records" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "vegetableType" TEXT NOT NULL,
    "vegetableWeight" DOUBLE PRECISION NOT NULL,
    "fertilizerType" "FertilizerType" NOT NULL,
    "fertilizerBrand" TEXT,
    "pesticidesUsed" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "imageHash" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_info" (
    "id" TEXT NOT NULL,
    "farmRecordId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleCapacity" DOUBLE PRECISION,
    "destinationCity" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),

    CONSTRAINT "delivery_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_validations" (
    "id" TEXT NOT NULL,
    "farmRecordId" TEXT NOT NULL,
    "isValidPlant" BOOLEAN NOT NULL,
    "detectedClass" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "processingMs" INTEGER NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawResponse" JSONB,

    CONSTRAINT "ai_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_scores" (
    "id" TEXT NOT NULL,
    "farmRecordId" TEXT NOT NULL,
    "deliveryInfoId" TEXT,
    "rawCarbonKg" DOUBLE PRECISION NOT NULL,
    "fertilizerPenalty" DOUBLE PRECISION NOT NULL,
    "totalCarbonKg" DOUBLE PRECISION NOT NULL,
    "ecoGrade" "EcoGrade" NOT NULL,
    "ecoScore" INTEGER NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "farmRecordId" TEXT NOT NULL,
    "tokenId" TEXT,
    "txHash" TEXT,
    "contractAddress" TEXT,
    "chainId" INTEGER NOT NULL DEFAULT 80002,
    "ipfsUri" TEXT,
    "qrCodeUrl" TEXT,
    "qrCodeData" TEXT,
    "issuedAt" TIMESTAMP(3),
    "status" "CertStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_batches" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "success" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_userId_key" ON "farmers"("userId");

-- CreateIndex
CREATE INDEX "farm_records_farmerId_status_idx" ON "farm_records"("farmerId", "status");

-- CreateIndex
CREATE INDEX "farm_records_status_idx" ON "farm_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "farm_records_farmerId_localId_key" ON "farm_records"("farmerId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_info_farmRecordId_key" ON "delivery_info"("farmRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_validations_farmRecordId_key" ON "ai_validations"("farmRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_scores_farmRecordId_key" ON "carbon_scores"("farmRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_scores_deliveryInfoId_key" ON "carbon_scores"("deliveryInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_farmRecordId_key" ON "certificates"("farmRecordId");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "certificates_txHash_idx" ON "certificates"("txHash");

-- CreateIndex
CREATE INDEX "sync_batches_farmerId_idx" ON "sync_batches"("farmerId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_records" ADD CONSTRAINT "farm_records_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_info" ADD CONSTRAINT "delivery_info_farmRecordId_fkey" FOREIGN KEY ("farmRecordId") REFERENCES "farm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_validations" ADD CONSTRAINT "ai_validations_farmRecordId_fkey" FOREIGN KEY ("farmRecordId") REFERENCES "farm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_scores" ADD CONSTRAINT "carbon_scores_farmRecordId_fkey" FOREIGN KEY ("farmRecordId") REFERENCES "farm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_scores" ADD CONSTRAINT "carbon_scores_deliveryInfoId_fkey" FOREIGN KEY ("deliveryInfoId") REFERENCES "delivery_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_farmRecordId_fkey" FOREIGN KEY ("farmRecordId") REFERENCES "farm_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
