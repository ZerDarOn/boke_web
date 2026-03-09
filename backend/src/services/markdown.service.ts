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

/**
 * 解析 Markdown 文件内容
 */
export function parseMarkdown(content: string): ParsedContent {
  try {
    // 1. 解析 Front Matter
    const { data: frontMatter, content: markdown } = matter(content);

    // 2. 验证必填字段
    if (!frontMatter.id || !frontMatter.title) {
      throw new Error('缺少必填字段：id 或 title');
    }

    if (!frontMatter.date) {
      throw new Error('缺少必填字段：date');
    }

    // 3. 转换 Markdown 为 HTML
    const html = marked(markdown);

    // 4. 提取图片
    const images = extractImages(markdown);

    // 5. 构建解析结果
    const parsed: ParsedContent = {
      id: frontMatter.id,
      title: frontMatter.title,
      slug: frontMatter.slug || frontMatter.id,
      date: normalizeDate(frontMatter.date),
      lastUpdated: normalizeDate(frontMatter.lastUpdated || frontMatter.date),
      published: frontMatter.published !== false,
      accessLevel: frontMatter.accessLevel || 'PUBLIC',
      type: frontMatter.type || 'post',
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
  const { type, metadata, content, html, ...base } = parsed;

  switch (type) {
    case 'post':
      return {
        ...base,
        category: metadata.category || 'UNCATEGORIZED',
        tags: metadata.tags || [],
        excerpt: metadata.excerpt || content.substring(0, 200),
        readTime: metadata.readingTime || '5 min'
      };

    case 'project':
      return {
        ...base,
        name: base.title,
        status: metadata.status || 'PLANNED',
        tech: metadata.tech || [],
        description: metadata.description || content.substring(0, 500),
        repository: metadata.repository,
        demoUrl: metadata.demoUrl
      };

    case 'anime':
      return {
        ...base,
        type: metadata.type || 'TV',
        episodes: metadata.episodes || 12,
        currentEp: metadata.currentEp || 0,
        status: metadata.status || 'WATCHING',
        score: metadata.score,
        favorite: metadata.favorite || false,
        studios: metadata.studios || [],
        genres: metadata.genres || [],
        cover: metadata.cover
      };

    case 'diary':
      return {
        ...base,
        mood: metadata.mood || '😊',
        weather: metadata.weather || '☀️',
        type: metadata.type || 'SHORT',
        location: metadata.location
      };

    case 'timeline':
      return {
        ...base,
        category: metadata.category || 'OTHER'
      };

    case 'skill':
      return {
        ...base,
        name: base.title,
        level: metadata.level || 'BEGINNER',
        category: metadata.category || 'FRONTEND',
        icon: metadata.icon,
        description: metadata.description || content.substring(0, 300)
      };

    case 'gallery':
      return {
        ...base,
        title: base.title,
        albumId: metadata.album,
        aspect: metadata.aspect || 'landscape',
        location: metadata.location,
        camera: metadata.camera,
        settings: metadata.settings,
        src: metadata.src,
        tags: metadata.tags || []
      };

    case 'announcement':
      return {
        ...base,
        type: metadata.type || 'INFO',
        priority: metadata.priority || 'MEDIUM',
        endDate: metadata.endDate ? normalizeDate(metadata.endDate) : null
      };

    default:
      throw new Error(`不支持的内容类型: ${type}`);
  }
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
