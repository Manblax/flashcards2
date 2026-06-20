ALTER TABLE "Term"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH "rankedTerms" AS (
  SELECT
    "id",
    (ROW_NUMBER() OVER (
      PARTITION BY "moduleId"
      ORDER BY "createdAt", "id"
    ) - 1)::INTEGER AS "position"
  FROM "Term"
)
UPDATE "Term"
SET "position" = "rankedTerms"."position"
FROM "rankedTerms"
WHERE "Term"."id" = "rankedTerms"."id";

CREATE INDEX "Term_moduleId_position_idx"
ON "Term"("moduleId", "position");
