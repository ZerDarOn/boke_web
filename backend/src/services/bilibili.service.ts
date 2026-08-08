/**
 * B站追番同步服务
 * ============================================================================
 * 抓取公开的 B站追番列表 + 逐部详情(含简介)，导入/补全到 anime 表。
 * 被 scripts/sync-bilibili-anime.ts(手动) 和 index.ts(定时任务) 复用。
 *
 * 封面统一转 https：B站 season 接口返回的 cover 是 http，会被站点 CSP / 浏览器混合内容拦截。
 *
 * 安全：按 bilibiliUrl(ss{season_id}) 去重；已存在的番只补空缺字段(synopsis/占位或http封面/
 * 空genres/空年份)，不覆盖用户改过的 title/score/favorite/notes/tags；不删除任何记录。
 * ============================================================================
 */
import prisma from '../lib/prisma';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Referer: 'https://www.bilibili.com/',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toHttps = (u?: string | null) => (u || '').replace(/^http:\/\//i, 'https://');

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface FollowItem {
  title: string;
  season_id: number;
  total_count: number;
  follow_status: number;
  cover?: string;
}

async function fetchFollowList(uid: string): Promise<FollowItem[]> {
  const all: FollowItem[] = [];
  // type=1 追番(番剧/国创)，type=2 追剧(影视/电影/纪录片)
  for (const type of [1, 2]) {
    for (let pn = 1; pn <= 30; pn++) {
      const url = `https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=${pn}&ps=30&vmid=${uid}`;
      const json = await fetchJson(url);
      if (json.code !== 0) {
        if (json.code === 53013) {
          throw new Error('追番列表获取失败 code=53013（需在 B站打开"公开我的追番/追剧记录"）');
        }
        break; // 其它错误：跳过该分类，继续下一类
      }
      const list: FollowItem[] = json.data?.list || [];
      all.push(...list);
      if (list.length < 30) break;
      await sleep(400);
    }
  }
  return all;
}

async function fetchSeason(seasonId: number | string): Promise<any | null> {
  try {
    const json = await fetchJson(
      `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`,
    );
    return json.code === 0 ? json.result : null;
  } catch {
    return null;
  }
}

const mapStatus = (fs: number): 'WATCHING' | 'COMPLETED' => (fs === 3 ? 'COMPLETED' : 'WATCHING');

function yearFrom(detail: any): string | null {
  const t = detail?.publish?.pub_time || detail?.publish?.release_date_show || '';
  const m = String(t).match(/(\d{4})/);
  return m ? m[1] : null;
}

function mapType(detail: any): 'TV' | 'Movie' {
  const total = detail?.total ?? detail?.episodes?.length ?? 0;
  if (detail?.season_type === 2 || total === 1) return 'Movie';
  return 'TV';
}

function mapGenres(detail: any): string[] {
  const styles = detail?.styles;
  if (!Array.isArray(styles)) return [];
  return styles
    .map((s: any) => (typeof s === 'string' ? s : s?.name))
    .filter((x: any): x is string => !!x);
}

export interface SyncOptions {
  dryRun?: boolean;
  log?: (msg: string) => void;
}
export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

export async function syncBilibiliAnime(uid: string, opts: SyncOptions = {}): Promise<SyncResult> {
  const { dryRun = false, log = () => {} } = opts;

  const follows = await fetchFollowList(uid);
  log(`📺 追番列表共 ${follows.length} 部`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const f of follows) {
    const biliUrl = `https://www.bilibili.com/bangumi/play/ss${f.season_id}`;
    const detail = await fetchSeason(f.season_id);
    await sleep(400);

    const synopsis = detail?.evaluate?.trim() || null;
    const cover = toHttps(detail?.cover || f.cover || '');
    const episodes = Math.max(
      1,
      Number(detail?.total) || Number(f.total_count) || detail?.episodes?.length || 1,
    );
    const genres = mapGenres(detail);
    const aired = yearFrom(detail);
    const type = mapType(detail);
    const status = mapStatus(f.follow_status);
    const title = (detail?.season_title || f.title || '').trim();

    const existing = await prisma.anime.findFirst({ where: { bilibiliUrl: biliUrl } });

    if (existing) {
      const data: Record<string, any> = {};
      if (!existing.synopsis && synopsis) data.synopsis = synopsis;
      // 占位封面、或旧的 http 封面，都用新的 https 封面替换
      if (
        (!existing.cover || existing.cover.includes('placehold') || existing.cover.startsWith('http://')) &&
        cover
      )
        data.cover = cover;
      if ((!existing.genres || existing.genres.length === 0) && genres.length) data.genres = genres;
      if (!existing.aired && aired) data.aired = aired;
      if (Object.keys(data).length === 0) {
        skipped++;
        continue;
      }
      log(`  ✏️  补全 [${title}] -> ${Object.keys(data).join(', ')}`);
      if (!dryRun) await prisma.anime.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      log(`  ➕ 新增 [${title}]`);
      if (!dryRun) {
        await prisma.anime.create({
          data: {
            title,
            cover: cover || 'https://placehold.co/300x420/0f0f0f/10b981/png?text=Anime',
            episodes,
            synopsis,
            genres,
            aired,
            type,
            status,
            currentEp: status === 'COMPLETED' ? episodes : 0,
            bilibiliUrl: biliUrl,
          },
        });
      }
      created++;
    }
  }

  // 补全库里其它「有 bilibiliUrl 但缺简介」的旧番
  const missing = await prisma.anime.findMany({
    where: { synopsis: null, bilibiliUrl: { not: null } },
  });
  for (const a of missing) {
    const m = a.bilibiliUrl?.match(/ss(\d+)/);
    if (!m) continue;
    const detail = await fetchSeason(m[1]);
    await sleep(400);
    const synopsis = detail?.evaluate?.trim();
    if (synopsis) {
      log(`  ✏️  补简介 [${a.title}]`);
      if (!dryRun) await prisma.anime.update({ where: { id: a.id }, data: { synopsis } });
      updated++;
    }
  }

  // 兜底：把库里所有残留的 http 封面改成 https（避免被 CSP / 混合内容拦）
  if (!dryRun) {
    await prisma.$executeRaw
      `UPDATE anime SET cover = replace(cover, 'http://', 'https://') WHERE cover LIKE 'http://%'`;
  }

  return { total: follows.length, created, updated, skipped };
}
