-- Existing password accounts predate email verification; mark them verified
-- so they are not locked out after deploy.
UPDATE "User"
SET "emailVerified" = CURRENT_TIMESTAMP
WHERE "password" IS NOT NULL
  AND "emailVerified" IS NULL;
