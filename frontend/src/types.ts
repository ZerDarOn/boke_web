import type {
  ProjectStatus,
  AnimeStatus,
  AnimeType,
  DiaryMood,
  DiaryWeather,
  TimelineEventType,
  SkillNodeType,
  ImageAspect,
  AnnouncementType,
  FileType,
} from '@ink-spirit/shared';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
  readingTime: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  stamp: string;
}

export interface LongFormDiary {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  date: string;
  location: string;
  mood: DiaryMood;
  weather: DiaryWeather;
  coverImage: string;
  tags: string[];
  readingTime: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  tech: string[];
  status: ProjectStatus;
  description: string;
  featured?: boolean;
  link?: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
  readme?: string;
}

export interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  type: SkillNodeType;
}

export interface Activity {
  id: string;
  project: string;
  title: string;
  tags: string[];
  status: string;
  date: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  date: string;
  content?: string;
}

export interface RelationNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  avatar?: string;
  description: string;
  connections: string[];
  type: SkillNodeType;
}

export interface AnimeItem {
  id: string;
  title: string;
  cover: string;
  totalEps: number;
  currentEp: number;
  status: AnimeStatus;
  score?: number;
  favorite?: boolean;
  studio?: string;
}

export interface AnimeDetail {
  id: string;
  title: string;
  coverImage: string;
  bannerImage: string;
  type: AnimeType;
  episodes: number;
  status: AnimeStatus;
  score?: number;
  aired: string;
  studios: string[];
  genres: string[];
  synopsis: string;
  myEpisodes: number;
  myScore?: number;
  myStatus: AnimeStatus;
  startDate?: string;
  finishDate?: string;
  favorite: boolean;
  notes?: string;
  tags?: string[];
  bilibiliUrl?: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  title: string;
  date: string;
  location: string;
  aspect: ImageAspect;
  description?: string;
  camera?: string;
  settings?: string;
  tags?: string[];
  comments?: PhotoComment[];
}

export interface PhotoComment {
  id: string;
  author: string;
  content: string;
  email: string;
  date: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  cover: string;
  createdAt: string;
  lastUpdated: string;
  location: string;
  thoughts: string;
  photoCount: number;
  photos: GalleryItem[];
}

export interface TimelineEvent {
  id: string;
  year: string;
  date: string;
  title: string;
  description: string;
  type: TimelineEventType;
}

export interface SkillGroup {
  category: string;
  items: {
    name: string;
    level: number;
    projectCount: number;
    rank: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: AnnouncementType;
  attachments?: {
    name: string;
    size: string;
    url: string;
  }[];
}

// 重新导出共享类型，方便其他模块使用
export type {
  ProjectStatus,
  AnimeStatus,
  AnimeType,
  DiaryMood,
  DiaryWeather,
  TimelineEventType,
  SkillNodeType,
  ImageAspect,
  AnnouncementType,
  FileType,
} from '@ink-spirit/shared';
