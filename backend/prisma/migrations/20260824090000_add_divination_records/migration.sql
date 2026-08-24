CREATE TYPE "DivinationType" AS ENUM ('TAROT', 'ICHING', 'ASTROLOGY');

CREATE TABLE "divination_records" (
    "id" TEXT NOT NULL,
    "type" "DivinationType" NOT NULL,
    "question" TEXT,
    "result" JSONB NOT NULL,
    "aiReading" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "divination_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "divination_records_userId_idx" ON "divination_records"("userId");
CREATE INDEX "divination_records_type_idx" ON "divination_records"("type");
CREATE INDEX "divination_records_createdAt_idx" ON "divination_records"("createdAt");

ALTER TABLE "divination_records" ADD CONSTRAINT "divination_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
