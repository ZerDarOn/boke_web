-- Restore media-highlight values saved by the compatibility migration that
-- runs immediately before the unchanged historical ADD COLUMN migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'anime'
          AND column_name = '__legacy_db_push_highlights'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'anime'
              AND column_name = 'highlights'
        ) THEN
            UPDATE "anime"
            SET "highlights" = COALESCE("highlights", "__legacy_db_push_highlights");

            ALTER TABLE "anime"
            DROP COLUMN "__legacy_db_push_highlights";
        ELSE
            ALTER TABLE "anime"
            RENAME COLUMN "__legacy_db_push_highlights" TO "highlights";
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'games'
          AND column_name = '__legacy_db_push_highlights'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'games'
              AND column_name = 'highlights'
        ) THEN
            UPDATE "games"
            SET "highlights" = COALESCE("highlights", "__legacy_db_push_highlights");

            ALTER TABLE "games"
            DROP COLUMN "__legacy_db_push_highlights";
        ELSE
            ALTER TABLE "games"
            RENAME COLUMN "__legacy_db_push_highlights" TO "highlights";
        END IF;
    END IF;
END $$;
