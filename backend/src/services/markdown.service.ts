import matter from 'gray-matter';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';

/**
 * 解析后的内容结构
 */
export interface ParsedContent {
  // 基础字段（所有类型必须）
  id: string;
  title: string;
  slug: string;
  date: string;
  lastUpdated: string;
  published: boolean;
  accessLevel: 'PUBLIC' | 'PASSWORD' | 'PRIVATE';

  // 内容类型和原始数据
  type: string;
  metadata: any;
  content: string;
  html: string;

  // 图片
  images: string[];
}

const CONTENT_TYPES = new Set([
  'post',
  'project',
  'anime',
  'diary',
  'timeline',
  'skill',
  'gallery',
  'announcement',
]);

const ANIME_TYPES = new Set(['TV', 'OVA', 'Movie', 'Special', 'ONA']);
const ANIME_STATUSES = new Set(['WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']);
const ACCESS_LEVELS = new Set(['PUBLIC', 'PASSWORD', 'PRIVATE']);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveContentType(metadata: Record<string, unknown>): string {
  const explicitType = asOptionalString(metadata.contentType) || asOptionalString(metadata.kind);
  if (explicitType && CONTENT_TYPES.has(explicitType.toLowerCase())) {
    return explicitType.toLowerCase();
  }

  const legacyType = asOptionalString(metadata.type);
  if (legacyType && CONTENT_TYPES.has(legacyType.toLowerCase())) {
    return legacyType.toLowerCase();
  }

  if (metadata.episodes !== undefined || metadata.studios !== undefined || metadata.bilibiliUrl !== undefined) return 'anime';
  if (metadata.diaryType !== undefined || metadata.mood !== undefined || metadata.weather !== undefined) return 'diary';
  if (metadata.src !== undefined || metadata.album !== undefined) return 'gallery';
  if (metadata.priority !== undefined || metadata.endDate !== undefined) return 'announcement';
  if (metadata.tech !== undefined || metadata.repository !== undefined || metadata.demoUrl !== undefined) return 'project';
  if (metadata.connections !== undefined || metadata.rank !== undefined || metadata.projectCount !== undefined) return 'skill';
  if (metadata.year !== undefined || metadata.eventType !== undefined) return 'timeline';

  return 'post';
}

/**
 * 解析 Markdown 文件内容
 */
export async function parseMarkdown(content: string): Promise<ParsedContent> {
  try {
    // 1. 解析 Front Matter
    const { data: frontMatter, content: markdown } = matter(content);

    // 2. 验证必填字段。id 和日期可由导入器补全，标题必须由作者提供。
    if (!frontMatter.title || typeof frontMatter.title !== 'string') {
      throw new Error('缺少必填字段：title');
    }

    const type = resolveContentType(frontMatter);

    // 3. 转换 Markdown 为 HTML
    const html = await marked(markdown);

    // 4. 提取图片
    const images = extractImages(markdown);

    // 5. 构建解析结果
    const parsed: ParsedContent = {
      id: frontMatter.id || generateId(type),
      title: frontMatter.title,
      slug: frontMatter.slug || generateSlug(frontMatter.title),
      date: normalizeDate(frontMatter.date),
      lastUpdated: normalizeDate(frontMatter.lastUpdated || frontMatter.date),
      published: frontMatter.published !== false,
      accessLevel: ACCESS_LEVELS.has(frontMatter.accessLevel) ? frontMatter.accessLevel : 'PUBLIC',
      type,
      metadata: frontMatter,
      content: markdown,
      html,
      images
    };

    return parsed;
  } catch (error: any) {
    console.error('Markdown 解析失败:', error);
    throw new Error(`Markdown 解析失败: ${error.message}`);
  }
}

/**
 * 标准化日期格式
 */
function normalizeDate(date: any): string {
  if (!date) {
    return new Date().toISOString();
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error(`无效的日期格式: ${date}`);
  }

  return d.toISOString();
}

/**
 * 提取 Markdown 中的图片
 */
function extractImages(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url && !url.startsWith('http')) {
      images.push(url);
    }
  }

  return images;
}

/**
 * 根据 Front Matter 字段构建 Prisma 模型数据
 */
export function buildPrismaData(parsed: ParsedContent): any {
  const { type, metadata, content } = parsed;
  const createdAt = new Date(parsed.date);
  const tags = asStringArray(metadata.tags);

  switch (type) {
    case 'post':
      return {
        id: parsed.id,
        title: parsed.title,
        slug: parsed.slug,
        content,
        date: createdAt,
        category: metadata.category || 'UNCATEGORIZED',
        tags,
        excerpt: metadata.excerpt || content.substring(0, 200),
        readingTime: metadata.readingTime || '5 min',
        isPublished: parsed.published,
        accessLevel: parsed.accessLevel,
        coverImage: asOptionalString(metadata.coverImage) || asOptionalString(metadata.cover),
        password: asOptionalString(metadata.password),
      };

    case 'project':
      return {
        id: parsed.id,
        name: parsed.title,
        slug: parsed.slug,
        status: normalizeProjectStatus(metadata.status),
        tech: asStringArray(metadata.tech),
        type: asOptionalString(metadata.projectType) || 'PROJECT',
        description: metadata.description || content.substring(0, 500),
        readme: content,
        link: asOptionalString(metadata.link),
        imageUrl: asOptionalString(metadata.imageUrl) || asOptionalString(metadata.cover),
        githubUrl: asOptionalString(metadata.githubUrl) || asOptionalString(metadata.repository),
        demoUrl: asOptionalString(metadata.demoUrl),
        featured: metadata.featured === true,
        startDate: parseOptionalDate(metadata.startDate),
        endDate: parseOptionalDate(metadata.endDate),
      };

    case 'anime':
      return {
        id: parsed.id,
        title: parsed.title,
        cover: requireString(metadata.cover, 'anime.cover'),
        bannerImage: asOptionalString(metadata.bannerImage),
        type: ANIME_TYPES.has(String(metadata.animeType || metadata.type))
          ? (metadata.animeType || metadata.type)
          : 'TV',
        episodes: Number.isInteger(metadata.episodes) ? metadata.episodes : 1,
        aired: asOptionalString(metadata.aired),
        currentEp: Number.isInteger(metadata.currentEp) ? metadata.currentEp : 0,
        status: ANIME_STATUSES.has(String(metadata.status)) ? metadata.status : 'WATCHING',
        score: metadata.score,
        favorite: metadata.favorite || false,
        studios: asStringArray(metadata.studios),
        genres: asStringArray(metadata.genres),
        synopsis: asOptionalString(metadata.synopsis) || content,
        notes: asOptionalString(metadata.notes),
        tags,
        startDate: parseOptionalDate(metadata.startDate),
        finishDate: parseOptionalDate(metadata.finishDate),
        bilibiliUrl: asOptionalString(metadata.bilibiliUrl),
      };

    case 'diary':
      const diaryType = String(metadata.diaryType || metadata.entryType || 'SHORT').toUpperCase() === 'LONG'
        ? 'LONG'
        : 'SHORT';
      return {
        id: parsed.id,
        type: diaryType,
        title: diaryType === 'LONG' ? parsed.title : undefined,
        content: diaryType === 'SHORT' ? content : undefined,
        longContent: diaryType === 'LONG' ? content : undefined,
        stamp: asOptionalString(metadata.stamp),
        subtitle: asOptionalString(metadata.subtitle),
        location: asOptionalString(metadata.location),
        mood: asOptionalString(metadata.mood),
        weather: asOptionalString(metadata.weather),
        coverImage: asOptionalString(metadata.coverImage) || asOptionalString(metadata.cover),
        date: createdAt,
        tags,
        readingTime: asOptionalString(metadata.readingTime),
      };

    case 'timeline':
      return {
        id: parsed.id,
        year: asOptionalString(metadata.year) || String(createdAt.getFullYear()),
        date: asOptionalString(metadata.timelineDate) || createdAt.toISOString().slice(5, 10).replace('-', '.'),
        title: parsed.title,
        description: asOptionalString(metadata.description) || content.substring(0, 500),
        type: normalizeTimelineType(metadata.eventType || metadata.category),
        projectId: asOptionalString(metadata.projectId),
      };

    case 'skill':
      return {
        id: parsed.id,
        name: parsed.title,
        category: asOptionalString(metadata.category) || 'GENERAL',
        level: normalizeSkillLevel(metadata.level),
        rank: normalizeSkillRank(metadata.rank || metadata.level),
        projectCount: Number.isInteger(metadata.projectCount) ? metadata.projectCount : 0,
        connections: asStringArray(metadata.connections),
        image: asOptionalString(metadata.image) || asOptionalString(metadata.icon),
      };

    case 'gallery':
      return {
        id: parsed.id,
        title: parsed.title,
        src: requireString(metadata.src, 'gallery.src'),
        date: createdAt,
        albumId: metadata.album,
        aspect: metadata.aspect || 'landscape',
        location: metadata.location,
        camera: metadata.camera,
        settings: metadata.settings,
        description: asOptionalString(metadata.description) || content,
        tags,
      };

    case 'announcement':
      return {
        id: parsed.id,
        title: parsed.title,
        content,
        date: createdAt,
        type: normalizeAnnouncementType(metadata.announcementType || metadata.type),
      };

    default:
      throw new Error(`不支持的内容类型: ${type}`);
  }
}

function requireString(value: unknown, field: string): string {
  const result = asOptionalString(value);
  if (!result) throw new Error(`缺少必填字段：${field}`);
  return result;
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return new Date(normalizeDate(value));
}

function normalizeProjectStatus(value: unknown): 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED' {
  if (value === 'ARCHIVED' || value === 'DEPLOYED') return value;
  if (value === 'COMPLETED') return 'DEPLOYED';
  return 'ACTIVE';
}

function normalizeTimelineType(value: unknown): 'MILESTONE' | 'JOB' | 'LIFE' {
  if (value === 'JOB' || value === 'LIFE') return value;
  return 'MILESTONE';
}

function normalizeSkillLevel(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(100, Math.round(value)));
  const levels: Record<string, number> = { MASTER: 100, EXPERT: 80, ADEPT: 60, NOVICE: 30 };
  return levels[String(value).toUpperCase()] || 0;
}

function normalizeSkillRank(value: unknown): 'Master' | 'Expert' | 'Adept' | 'Novice' {
  const ranks: Record<string, 'Master' | 'Expert' | 'Adept' | 'Novice'> = {
    MASTER: 'Master', EXPERT: 'Expert', ADEPT: 'Adept', NOVICE: 'Novice',
  };
  return ranks[String(value).toUpperCase()] || 'Novice';
}

function normalizeAnnouncementType(value: unknown): 'INFO' | 'WARNING' | 'SUCCESS' | 'IMPORTANT' {
  if (value === 'WARNING' || value === 'SUCCESS' || value === 'IMPORTANT') return value;
  return 'INFO';
}

/**
 * 生成默认 ID
 */
export function generateId(type: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

/**
 * 生成默认 Slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}
