import { z } from 'zod';

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
  website: z.string().url().optional(),
  github: z.string().max(100).optional(),
  avatar: z.string().url().optional(),
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
});

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000),
  type: z.string().min(1).max(50),
  tech: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DEPLOYED']).optional(),
  link: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  readme: z.string().optional(),
  featured: z.boolean().optional(),
});

export const animeSchema = z.object({
  title: z.string().min(1).max(200),
  cover: z.string().min(1),
  bannerImage: z.string().optional(),
  type: z.enum(['TV', 'OVA', 'Movie', 'Special', 'ONA']).optional(),
  episodes: z.number().int().min(1),
  aired: z.string().optional(),
  studios: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  synopsis: z.string().optional(),
  currentEp: z.number().int().min(0).optional(),
  status: z.enum(['WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']).optional(),
  score: z.number().min(0).max(10).optional(),
  favorite: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  finishDate: z.coerce.date().optional(),
  bilibiliUrl: z.string().url().optional(),
});

export const animeProgressSchema = z.object({
  episodes: z.number().int().min(0),
});

export const animeScoreSchema = z.object({
  score: z.number().min(0).max(10),
});

export const diarySchema = z.object({
  type: z.enum(['SHORT', 'LONG']).optional(),
  content: z.string().optional(),
  stamp: z.string().max(10).optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  longContent: z.string().optional(),
  location: z.string().max(100).optional(),
  mood: z.string().max(50).optional(),
  weather: z.string().max(50).optional(),
  coverImage: z.string().url().optional(),
  date: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
});

export const galleryImageSchema = z.object({
  title: z.string().min(1).max(200),
  src: z.string().url(),
  date: z.coerce.date().optional(),
  location: z.string().max(100).optional(),
  aspect: z.enum(['portrait', 'landscape', 'square']).optional(),
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
  rank: z.enum(['Master', 'Expert', 'Adept', 'Novice']),
  projectCount: z.number().int().min(0).optional(),
  nodeX: z.number().optional(),
  nodeY: z.number().optional(),
  nodeType: z.enum(['core', 'major', 'minor']).optional(),
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
  type: z.enum(['MILESTONE', 'JOB', 'LIFE']).optional(),
  projectId: z.string().optional(),
});

export const networkNodeSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(100).default('Collaborator'),
  description: z.string().max(500).default(''),
  avatar: z.string().url().optional().or(z.literal('')),
  x: z.number().default(0),
  y: z.number().default(0),
  type: z.enum(['core', 'major', 'minor']).optional(),
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
});

export const fileSchema = z.object({
  path: z.string().min(1),
  type: z.enum(['file', 'directory']).optional(),
  content: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'IMPORTANT']).optional(),
  date: z.coerce.date().optional(),
  attachments: z.any().optional(),
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
export type NetworkNodeInput = z.infer<typeof networkNodeSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PhotoCommentInput = z.infer<typeof photoCommentSchema>;
export type FileInput = z.infer<typeof fileSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
