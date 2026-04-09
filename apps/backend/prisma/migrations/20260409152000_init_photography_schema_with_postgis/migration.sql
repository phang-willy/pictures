CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isEmailValid" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserTwoFactorCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" CHAR(6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserTwoFactorCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Continent" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Continent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "continentId" TEXT NOT NULL,
    "codeIso2" CHAR(2) NOT NULL,
    "codeIso3" CHAR(3),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "title" VARCHAR(200),
    "description" TEXT,
    "takenAt" TIMESTAMP(3),
    "sourceFileName" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "fileSizeBytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "webpUrl" VARCHAR(2048) NOT NULL,
    "webpThumbnailUrl" VARCHAR(2048),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE INDEX "UserTwoFactorCode_userId_expiresAt_idx" ON "UserTwoFactorCode"("userId", "expiresAt");
CREATE INDEX "UserTwoFactorCode_userId_code_idx" ON "UserTwoFactorCode"("userId", "code");

CREATE UNIQUE INDEX "Continent_code_key" ON "Continent"("code");
CREATE UNIQUE INDEX "Continent_name_key" ON "Continent"("name");

CREATE UNIQUE INDEX "Country_codeIso2_key" ON "Country"("codeIso2");
CREATE UNIQUE INDEX "Country_codeIso3_key" ON "Country"("codeIso3");
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");
CREATE INDEX "Country_continentId_name_idx" ON "Country"("continentId", "name");

CREATE UNIQUE INDEX "City_countryId_slug_key" ON "City"("countryId", "slug");
CREATE INDEX "City_countryId_name_idx" ON "City"("countryId", "name");
CREATE INDEX "City_location_gist_idx" ON "City" USING GIST ("location");

CREATE UNIQUE INDEX "Place_cityId_slug_key" ON "Place"("cityId", "slug");
CREATE INDEX "Place_cityId_name_idx" ON "Place"("cityId", "name");
CREATE INDEX "Place_location_gist_idx" ON "Place" USING GIST ("location");

CREATE INDEX "Photo_placeId_createdAt_idx" ON "Photo"("placeId", "createdAt");
CREATE INDEX "Photo_uploadedByUserId_createdAt_idx" ON "Photo"("uploadedByUserId", "createdAt");

ALTER TABLE "UserTwoFactorCode"
    ADD CONSTRAINT "UserTwoFactorCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Country"
    ADD CONSTRAINT "Country_continentId_fkey"
    FOREIGN KEY ("continentId") REFERENCES "Continent"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "City"
    ADD CONSTRAINT "City_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Place"
    ADD CONSTRAINT "Place_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Photo"
    ADD CONSTRAINT "Photo_placeId_fkey"
    FOREIGN KEY ("placeId") REFERENCES "Place"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Photo"
    ADD CONSTRAINT "Photo_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "City"
    ADD CONSTRAINT "City_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
    ADD CONSTRAINT "City_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180);

ALTER TABLE "Place"
    ADD CONSTRAINT "Place_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
    ADD CONSTRAINT "Place_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180);

UPDATE "City"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
WHERE "location" IS NULL;

UPDATE "Place"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
WHERE "location" IS NULL;
