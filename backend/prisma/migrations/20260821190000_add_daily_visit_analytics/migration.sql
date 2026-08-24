CREATE TABLE "daily_visits" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_visits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_visits_date_visitorHash_key" ON "daily_visits"("date", "visitorHash");
CREATE INDEX "daily_visits_date_idx" ON "daily_visits"("date");
