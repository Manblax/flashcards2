CREATE TABLE "TtsAudio" (
    "hash" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TtsAudio_pkey" PRIMARY KEY ("hash")
);
