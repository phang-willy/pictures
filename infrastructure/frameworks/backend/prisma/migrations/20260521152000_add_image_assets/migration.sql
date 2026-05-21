CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "sourceMimeType" VARCHAR(100) NOT NULL,
    "sourceSizeBytes" BIGINT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "webpFileName" VARCHAR(255) NOT NULL,
    "webpPath" VARCHAR(2048) NOT NULL,
    "webpUrl" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageAsset_webpFileName_key" ON "ImageAsset"("webpFileName");
CREATE INDEX "ImageAsset_createdAt_idx" ON "ImageAsset"("createdAt");
