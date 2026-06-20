DROP INDEX "DictionaryEntry_normalizedWord_key";

ALTER TABLE "DictionaryEntry"
ADD COLUMN "dictionarySource" TEXT NOT NULL DEFAULT 'cambridge';

CREATE UNIQUE INDEX "DictionaryEntry_normalizedWord_dictionarySource_key"
ON "DictionaryEntry"("normalizedWord", "dictionarySource");
