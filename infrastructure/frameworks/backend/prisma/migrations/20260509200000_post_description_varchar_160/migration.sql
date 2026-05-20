-- Description courte : max 160 caractères (réserve SEO). Tronquer les anciennes valeurs trop longues si besoin.
UPDATE "Post"
SET "description" = LEFT(BTRIM("description"), 160)
WHERE "description" IS NOT NULL AND LENGTH(BTRIM("description")) > 160;

ALTER TABLE "Post" ALTER COLUMN "description" TYPE VARCHAR(160);
