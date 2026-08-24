CREATE TABLE "visitor_events" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorHash" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "targetPath" TEXT,
    CONSTRAINT "visitor_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitor_events_date_idx" ON "visitor_events"("date");
CREATE INDEX "visitor_events_eventType_date_idx" ON "visitor_events"("eventType", "date");
CREATE INDEX "visitor_events_path_date_idx" ON "visitor_events"("path", "date");
