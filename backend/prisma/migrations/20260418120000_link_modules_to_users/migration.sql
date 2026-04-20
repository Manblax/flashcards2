ALTER TABLE "Module" ADD COLUMN "userId" TEXT;

UPDATE "Module" AS m
SET "userId" = u."id"
FROM "User" AS u
WHERE m."author" = u."username";

WITH "singleUser" AS (
    SELECT "id", "username"
    FROM "User"
    ORDER BY "createdAt" ASC
    LIMIT 1
),
"userCount" AS (
    SELECT COUNT(*)::INT AS "count"
    FROM "User"
)
UPDATE "Module" AS m
SET
    "userId" = su."id",
    "author" = CASE
        WHEN m."author" = 'Anonymous' THEN su."username"
        ELSE m."author"
    END
FROM "singleUser" AS su, "userCount" AS uc
WHERE m."userId" IS NULL
  AND uc."count" = 1;

CREATE INDEX "Module_userId_idx" ON "Module"("userId");

ALTER TABLE "Module"
ADD CONSTRAINT "Module_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
