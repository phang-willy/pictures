-- DropIndex
DROP INDEX "City_location_gist_idx";

-- DropIndex
DROP INDEX "Place_location_gist_idx";

-- CreateTable
CREATE TABLE "CountryGeometry" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "coordinate" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryGeometry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryGeometry_countryId_key" ON "CountryGeometry"("countryId");

-- CreateIndex
CREATE INDEX "CountryGeometry_countryId_idx" ON "CountryGeometry"("countryId");

-- AddForeignKey
ALTER TABLE "CountryGeometry" ADD CONSTRAINT "CountryGeometry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
