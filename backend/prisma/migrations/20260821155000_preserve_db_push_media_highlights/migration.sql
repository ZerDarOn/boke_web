-- Some installations received these columns through `prisma db push` before
-- the media-highlights migration was recorded. Temporarily move those values
-- aside so the unchanged historical migration can run without losing data.
DO $$
DECLARE
    media_highlights_migration_applied BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE "migration_name" = '20260821160000_add_media_highlights'
          AND "finished_at" IS NOT NULL
          AND "rolled_back_at" IS NULL
    ) INTO media_highlights_migration_applied;

    IF NOT media_highlights_migration_applied THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'anime'
              AND column_name = '__legacy_db_push_highlights'
        ) THEN
            RAISE EXCEPTION 'Cannot preserve anime.highlights: temporary legacy column already exists';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'anime'
              AND column_name = 'highlights'
        ) THEN
            ALTER TABLE "anime"
            RENAME COLUMN "highlights" TO "__legacy_db_push_highlights";
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'games'
              AND column_name = '__legacy_db_push_highlights'
        ) THEN
            RAISE EXCEPTION 'Cannot preserve games.highlights: temporary legacy column already exists';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'games'
              AND column_name = 'highlights'
        ) THEN
            ALTER TABLE "games"
            RENAME COLUMN "highlights" TO "__legacy_db_push_highlights";
        END IF;
    END IF;
END $$;
