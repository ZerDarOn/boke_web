-- The game catalogue originally reached some databases through `prisma db push`
-- without a matching migration. Keep this migration safe for both those databases
-- and clean installations that replay the migration history from zero.
DO $$
BEGIN
    CREATE TYPE "GamePlatform" AS ENUM (
        'STEAM',
        'EPIC',
        'GOG',
        'ITCH',
        'NINTENDO_SWITCH',
        'PLAYSTATION',
        'XBOX',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "GameStatus" AS ENUM (
        'WANT_TO_PLAY',
        'PLAYING',
        'COMPLETED',
        'DROPPED',
        'REPLAYING'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "bannerImage" TEXT,
    "screenshots" TEXT[],
    "platform" "GamePlatform" NOT NULL DEFAULT 'STEAM',
    "platformId" TEXT,
    "storeUrl" TEXT,
    "genres" TEXT[],
    "developer" TEXT,
    "publisher" TEXT,
    "releaseDate" TIMESTAMP(3),
    "description" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'WANT_TO_PLAY',
    "playtime" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" TEXT[],
    "achievementsTotal" INTEGER NOT NULL DEFAULT 0,
    "achievementsUnlocked" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,
    "hideReason" TEXT,
    "relatedPostIds" TEXT[],
    "relatedProjectIds" TEXT[],
    "relatedDiaryIds" TEXT[],
    "startDate" TIMESTAMP(3),
    "finishDate" TIMESTAMP(3),
    "lastPlayed" TIMESTAMP(3),
    "steamLastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "games_status_idx" ON "games"("status");
CREATE INDEX IF NOT EXISTS "games_favorite_idx" ON "games"("favorite");
CREATE INDEX IF NOT EXISTS "games_platform_idx" ON "games"("platform");
CREATE INDEX IF NOT EXISTS "games_isHidden_idx" ON "games"("isHidden");
