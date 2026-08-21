import { z } from 'zod';

// 从 shared 包导入共享类型（前后端单一数据源）
export type {
  ProjectStatus,
  AnimeStatus,
  AnimeType,
  DiaryType,
  TimelineEventType,
  SkillRank,
  SkillNodeType,
  ImageAspect,
  AnnouncementType,
  AccessLevel,
  HistoryIcon,
} from '@ink-spirit/shared';

/**
 * 可选 URL 字段：接受合法 URL 或空字符串（清空时）。
 * null 由 validateBody 的 stripNulls 处理，这里无需考虑。
 */
const optionalUrl = z.union([z.string().url(), z.literal('')]).optional();
const externalHttpUrl = z.string().url().refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  },
  '仅支持 http 或 https 链接',
);

export const mediaHighlightSchema = z.object({
  title: z.string().min(1).max(120),
  url: externalHttpUrl,
  thumbnail: optionalUrl,
  description: z.string().max(500).optional(),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: optionalUrl,
  github: z.string().max(100).optional(),
  avatar: optionalUrl,
});

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  accessLevel: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD']).optional(),
  password: z.string().max(100).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000),
  type: z.string().min(1).max(50),
  tech: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DEPLOYED'] as const).optional(),
  link: optionalUrl,
  imageUrl: optionalUrl,
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  readme: z.string().optional(),
  featured: z.boolean().optional(),
});

export const animeSchema = z.object({
  title: z.string().min(1).max(200),
  cover: z.string().min(1),
  bannerImage: z.string().nullish(),
  type: z.enum(['TV', 'OVA', 'Movie', 'Special', 'ONA'] as const).optional(),
  episodes: z.number().int().min(1),
  aired: z.string().nullish(),
  studios: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  synopsis: z.string().nullish(),
  currentEp: z.number().int().min(0).optional(),
  status: z.enum(['WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED'] as const).optional(),
  score: z.number().min(0).max(10).nullish(),
  favorite: z.boolean().optional(),
  notes: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  startDate: z.coerce.date().nullish(),
  finishDate: z.coerce.date().nullish(),
  bilibiliUrl: optionalUrl,
  highlights: z.array(mediaHighlightSchema).max(8).optional(),
});

export const animeProgressSchema = z.object({
  episodes: z.number().int().min(0),
});

export const animeScoreSchema = z.object({
  score: z.number().min(0).max(10),
});

export const diarySchema = z.object({
  type: z.enum(['SHORT', 'LONG'] as const).optional(),
  content: z.string().optional(),
  stamp: z.string().max(10).optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  longContent: z.string().optional(),
  location: z.string().max(100).optional(),
  mood: z.string().max(50).optional(),
  weather: z.string().max(50).optional(),
  coverImage: optionalUrl,
  date: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
});

export const galleryImageSchema = z.object({
  title: z.string().min(1).max(200),
  src: z.string().url(),
  date: z.coerce.date().optional(),
  location: z.string().max(100).optional(),
  aspect: z.enum(['portrait', 'landscape', 'square'] as const).optional(),
  camera: z.string().max(100).optional(),
  settings: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  albumId: z.string().optional(),
});

export const albumSchema = z.object({
  title: z.string().min(1).max(200),
  cover: z.string().min(1),
  location: z.string().max(100).optional(),
  thoughts: z.string().optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  level: z.number().int().min(0).max(100),
  rank: z.enum(['Master', 'Expert', 'Adept', 'Novice'] as const),
  projectCount: z.number().int().min(0).optional(),
  nodeX: z.number().optional(),
  nodeY: z.number().optional(),
  nodeType: z.enum(['core', 'major', 'minor'] as const).optional(),
  connections: z.array(z.string()).optional(),
  // 图片
  image: z.string().max(500).optional(),
  // 按钮配置
  buttonEnabled: z.boolean().optional(),
  buttonLabel: z.string().max(100).optional(),
  buttonLink: z.string().max(500).optional(),
});

export const timelineEventSchema = z.object({
  year: z.string().min(4).max(4),
  date: z.string().regex(/^\d{2}\.\d{2}$/),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  type: z.enum(['MILESTONE', 'JOB', 'LIFE'] as const).optional(),
  projectId: z.string().optional(),
});

export const currentStatusSchema = z.object({
  title: z.string().min(1).max(200),
  currentFocus: z.string().min(1).max(200),
  location: z.string().min(1).max(100),
  vibe: z.string().min(1).max(200),
  emoji: z.string().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export const historyItemSchema = z.object({
  date: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  duration: z.string().max(100).optional().default(''),
  location: z.string().max(100).optional().default(''),
  tags: z.array(z.string()).optional(),
  color: z.string().max(20).optional(),  // 放宽颜色验证，允许任意格式
  icon: z.enum(['FileText', 'Briefcase', 'Code', 'Star', 'Trophy', 'Globe', 'Zap', 'Heart'] as const).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const networkNodeSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(100).default('Collaborator'),
  description: z.string().max(500).default(''),
  avatar: optionalUrl.or(z.literal('')),
  x: z.number().default(0),
  y: z.number().default(0),
  type: z.enum(['core', 'major', 'minor'] as const).optional(),
  connections: z.array(z.string()).optional(),
  // 按钮配置
  buttonEnabled: z.boolean().optional(),
  buttonLabel: z.string().max(100).optional(),
  buttonLink: z.string().max(500).optional(),
});

export const commentSchema = z.object({
  author: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  email: z.string().email().optional(),
  parentId: z.string().optional(),
});

export const photoCommentSchema = z.object({
  author: z.string().min(1).max(100),
  content: z.string().min(1).max(500),
  email: z.string().email(),
});

export const fileSchema = z.object({
  path: z.string().min(1),
  type: z.enum(['file', 'directory']).optional(),
  content: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'IMPORTANT'] as const).optional(),
  date: z.coerce.date().optional(),
  attachments: z.any().optional(),
});

export const gameSchema = z.object({
  title: z.string().min(1).max(200),
  cover: z.string().min(1),
  bannerImage: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  platform: z.enum(['STEAM', 'EPIC', 'GOG', 'ITCH', 'NINTENDO_SWITCH', 'PLAYSTATION', 'XBOX', 'OTHER'] as const).optional(),
  platformId: z.string().optional(),
  storeUrl: optionalUrl,
  genres: z.array(z.string()).optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
  releaseDate: z.coerce.date().optional(),
  description: z.string().optional(),
  status: z.enum(['WANT_TO_PLAY', 'PLAYING', 'COMPLETED', 'DROPPED', 'REPLAYING'] as const).optional(),
  playtime: z.number().int().min(0).optional(),
  score: z.number().min(0).max(10).optional(),
  favorite: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  achievementsTotal: z.number().int().min(0).optional(),
  achievementsUnlocked: z.number().int().min(0).optional(),
  isHidden: z.boolean().optional(),
  hideReason: z.string().optional(),
  relatedPostIds: z.array(z.string()).optional(),
  relatedProjectIds: z.array(z.string()).optional(),
  relatedDiaryIds: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  finishDate: z.coerce.date().optional(),
  lastPlayed: z.coerce.date().optional(),
  highlights: z.array(mediaHighlightSchema).max(8).optional(),
});

export const gameScoreSchema = z.object({
  score: z.number().min(0).max(10),
});

export const gameProgressSchema = z.object({
  playtime: z.number().int().min(0),
});

export const gameAchievementsSchema = z.object({
  unlocked: z.number().int().min(0),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type AnimeInput = z.infer<typeof animeSchema>;
export type AnimeProgressInput = z.infer<typeof animeProgressSchema>;
export type AnimeScoreInput = z.infer<typeof animeScoreSchema>;
export type DiaryInput = z.infer<typeof diarySchema>;
export type GalleryImageInput = z.infer<typeof galleryImageSchema>;
export type AlbumInput = z.infer<typeof albumSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type TimelineEventInput = z.infer<typeof timelineEventSchema>;
export type CurrentStatusInput = z.infer<typeof currentStatusSchema>;
export type HistoryItemInput = z.infer<typeof historyItemSchema>;
export type NetworkNodeInput = z.infer<typeof networkNodeSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PhotoCommentInput = z.infer<typeof photoCommentSchema>;
export type FileInput = z.infer<typeof fileSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type GameInput = z.infer<typeof gameSchema>;
export type GameScoreInput = z.infer<typeof gameScoreSchema>;
export type GameProgressInput = z.infer<typeof gameProgressSchema>;
export type GameAchievementsInput = z.infer<typeof gameAchievementsSchema>;
