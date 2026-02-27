import { Request } from 'express';

// API 通用响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// 排序参数
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 过滤参数
export interface FilterParams {
  [key: string]: string | string[] | undefined;
}

// 认证相关
export interface AuthPayload {
  userId: string;
  role: 'USER' | 'ADMIN' | 'EDITOR';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// 请求扩展
export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

// 文件上传
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  thumbnail?: string;
}

// 统计
export interface DashboardStats {
  uptime: string;
  totalRequests: number;
  uniqueVisitors: number;
  contentStats: {
    totalContent: number;
    totalLikes: number;
    totalFavorites: number;
    totalComments: number;
    articles: number;
    photos: number;
    diaries: number;
  };
  commentDistribution: { label: string; count: number; color: string }[];
}

// 搜索结果
export interface SearchResults {
  posts: any[];
  projects: any[];
  announcements: any[];
  diaries: any[];
  anime: any[];
  gallery: any[];
}

// 评论相关
export interface Comment {
  id: string;
  author: string;
  content: string;
  email?: string;
  createdAt: Date;
  parentId?: string;
}

// 热门内容
export interface PopularContent {
  posts: any[];
  anime: any[];
  gallery: any[];
}
