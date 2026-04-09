DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'passwordHash'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password";
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "token" TEXT;

ALTER TABLE "User"
DROP COLUMN IF EXISTS "isEmailValid";

ALTER TABLE "UserTwoFactorCode"
ALTER COLUMN "code" TYPE TEXT;
