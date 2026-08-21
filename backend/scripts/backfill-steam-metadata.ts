import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY_CHANGES = process.argv.includes('--apply');
const MAX_SCREENSHOTS = 6;
const REQUEST_CONCURRENCY = 3;

interface SteamStoreDetails {
  developers?: string[];
  genres?: Array<{ description?: string }>;
  publishers?: string[];
  release_date?: { date?: string };
  screenshots?: Array<{ path_full?: string }>;
  short_description?: string;
}

interface SteamStoreResponse {
  success: boolean;
  data?: SteamStoreDetails;
}

const toPlainText = (value: string) => value
  .replace(/<[^>]*>/g, '')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .trim();

const parseSteamDate = (value: string | undefined) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const fetchStoreDetails = async (appId: string): Promise<SteamStoreDetails | null> => {
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&l=schinese`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json() as Record<string, SteamStoreResponse>;
  const result = payload[appId];
  return result?.success && result.data ? result.data : null;
};

const runWithConcurrency = async <T>(items: T[], task: (item: T) => Promise<void>) => {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(REQUEST_CONCURRENCY, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await task(item);
    }
  });
  await Promise.all(workers);
};

async function main() {
  const games = await prisma.game.findMany({
    where: {
      platform: 'STEAM',
      platformId: { not: null },
      OR: [
        { description: null },
        { screenshots: { isEmpty: true } },
        { developer: null },
        { publisher: null },
        { genres: { isEmpty: true } },
      ],
    },
    select: {
      id: true,
      title: true,
      platformId: true,
      description: true,
      screenshots: true,
      developer: true,
      publisher: true,
      genres: true,
      releaseDate: true,
      storeUrl: true,
    },
  });

  let fetched = 0;
  let changed = 0;
  let unavailable = 0;
  let failed = 0;

  console.log(`[SteamBackfill] ${APPLY_CHANGES ? 'Applying' : 'Dry run'} for ${games.length} game(s)`);

  await runWithConcurrency(games, async (game) => {
    try {
      const details = await fetchStoreDetails(game.platformId!);
      if (!details) {
        unavailable++;
        return;
      }
      fetched++;

      const screenshots = details.screenshots
        ?.map((screenshot) => screenshot.path_full)
        .filter((url): url is string => Boolean(url))
        .slice(0, MAX_SCREENSHOTS);
      const genres = details.genres
        ?.map((genre) => genre.description?.trim())
        .filter((genre): genre is string => Boolean(genre));
      const description = details.short_description ? toPlainText(details.short_description) : undefined;
      const update = {
        ...(game.description || !description ? {} : { description }),
        ...(game.screenshots.length > 0 || !screenshots?.length ? {} : { screenshots }),
        ...(game.developer || !details.developers?.length ? {} : { developer: details.developers.join(', ') }),
        ...(game.publisher || !details.publishers?.length ? {} : { publisher: details.publishers.join(', ') }),
        ...(game.genres.length > 0 || !genres?.length ? {} : { genres }),
        ...(game.releaseDate || !parseSteamDate(details.release_date?.date) ? {} : { releaseDate: parseSteamDate(details.release_date?.date) }),
        ...(game.storeUrl ? {} : { storeUrl: `https://store.steampowered.com/app/${game.platformId}` }),
      };

      if (Object.keys(update).length === 0) return;
      changed++;
      if (APPLY_CHANGES) await prisma.game.update({ where: { id: game.id }, data: update });
    } catch {
      failed++;
    }
  });

  console.log(`[SteamBackfill] fetched=${fetched} changed=${changed} unavailable=${unavailable} failed=${failed}`);
}

main()
  .catch((error) => {
    console.error('[SteamBackfill] Fatal error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
