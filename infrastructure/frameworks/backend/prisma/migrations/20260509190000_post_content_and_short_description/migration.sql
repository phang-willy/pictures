-- Ancienne colonne `description` (HTML éditeur) → `content` ; nouvelle `description` courte (méta / résumé).
ALTER TABLE "Post" RENAME COLUMN "description" TO "content";
ALTER TABLE "Post" ADD COLUMN "description" VARCHAR(500);
