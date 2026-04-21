/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Continent` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "City" DROP COLUMN "deletedAt",
ADD COLUMN     "desactivatedAt" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Continent" DROP COLUMN "deletedAt",
ADD COLUMN     "desactivatedAt" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Country" DROP COLUMN "deletedAt",
ADD COLUMN     "desactivatedAt" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "CountryGeometry" ALTER COLUMN "type" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "deletedAt",
ADD COLUMN     "desactivatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "deletedAt",
ADD COLUMN     "desactivatedAt" TIMESTAMP(3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(255);
