-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_token_key" ON "User"("token");