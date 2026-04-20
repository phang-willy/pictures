-- Ensure PostGIS exists for geography columns in shadow/dev databases
CREATE EXTENSION IF NOT EXISTS postgis;

-- Rename Place -> Post and align relation key names
ALTER TABLE "Place" RENAME TO "Post";
ALTER TABLE "Photo" RENAME COLUMN "placeId" TO "postId";

-- Keep Prisma conventional index and constraint names
ALTER INDEX "Place_cityId_name_idx" RENAME TO "Post_cityId_name_idx";
ALTER INDEX "Place_cityId_slug_key" RENAME TO "Post_cityId_slug_key";
ALTER INDEX "Photo_placeId_createdAt_idx" RENAME TO "Photo_postId_createdAt_idx";

ALTER TABLE "Post" RENAME CONSTRAINT "Place_pkey" TO "Post_pkey";
ALTER TABLE "Post" RENAME CONSTRAINT "Place_cityId_fkey" TO "Post_cityId_fkey";
ALTER TABLE "Photo" RENAME CONSTRAINT "Photo_placeId_fkey" TO "Photo_postId_fkey";
