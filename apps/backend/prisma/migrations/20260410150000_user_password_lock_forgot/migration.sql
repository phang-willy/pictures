-- Table des mots de passe (historique) + transfert depuis "User"."password"
CREATE TABLE "Password" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Password_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Password_userId_createdAt_idx" ON "Password"("userId", "createdAt");

ALTER TABLE "Password" ADD CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Password" ("id", "userId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "password", "createdAt", "updatedAt" FROM "User";

ALTER TABLE "User" ADD COLUMN "loginAttempt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockUntil" TIMESTAMP(3);

ALTER TABLE "User" DROP COLUMN "password";

CREATE TABLE "ForgotPassword" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ForgotPassword_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForgotPassword_email_createdAt_idx" ON "ForgotPassword"("email", "createdAt");
