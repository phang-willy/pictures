-- Soft-delete marker (NULL = not deleted)
ALTER TABLE "Continent" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Country" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "City" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Place" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Photo" ADD COLUMN "deletedAt" TIMESTAMP(3);
