-- CreateTable
CREATE TABLE "DictionaryEntry" (
    "id" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceMap" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictionaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictionaryAudio" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictionaryAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryEntry_normalizedWord_key" ON "DictionaryEntry"("normalizedWord");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryAudio_sourceUrl_key" ON "DictionaryAudio"("sourceUrl");
