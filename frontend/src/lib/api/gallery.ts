import { apiRequest } from './request';
import type { PhotoComment } from '../../types';

export interface GalleryImage {
  id: string;
  title: string;
  src: string;
  date: string;
  location?: string;
  aspect: 'portrait' | 'landscape' | 'square';
  description?: string;
  camera?: string;
  settings?: string;
  tags: string[];
  albumId?: string;
  album?: {
    id: string;
    title: string;
    cover: string;
    createdAt: string;
    lastUpdated: string;
    location?: string;
    thoughts?: string;
    photoCount: number;
  };
  comments?: PhotoComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  title: string;
  cover: string;
  createdAt: string;
  lastUpdated: string;
  location?: string;
  thoughts?: string;
  photoCount: number;
  photos?: GalleryImage[];
}

export interface CreatePhotoCommentInput {
  author: string;
  content: string;
  email: string;
}

export const galleryApi = {
  // GET /api/gallery - 获取照片列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    albumId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.albumId) queryParams.append('albumId', params.albumId);

    return apiRequest<GalleryImage[]>(`/api/gallery?${queryParams}`);
  },

  // GET /api/gallery/:id - 获取图片详情
  getById: async (id: string) => {
    return apiRequest<GalleryImage>(`/api/gallery/${id}`);
  },

  // GET /api/gallery/albums - 获取相册列表
  getAlbums: async () => {
    return apiRequest<Album[]>('/api/gallery/albums');
  },

  // GET /api/gallery/albums/:id - 获取相册及其全部照片
  getAlbumById: async (id: string) => {
    return apiRequest<Album>(`/api/gallery/albums/${id}`);
  },

  createAlbum: async (data: Partial<Album>) => {
    return apiRequest<Album>('/api/gallery/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAlbum: async (id: string, data: Partial<Album>) => {
    return apiRequest<Album>(`/api/gallery/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAlbum: async (id: string) => {
    return apiRequest<void>(`/api/gallery/albums/${id}`, { method: 'DELETE' });
  },

  // POST /api/gallery/:id/comments - 添加照片评论
  addComment: async (id: string, data: CreatePhotoCommentInput) => {
    return apiRequest<PhotoComment>(`/api/gallery/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // POST /api/gallery - 创建图片
  create: async (data: Partial<GalleryImage>) => {
    return apiRequest<GalleryImage>(`/api/gallery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/gallery/:id - 更新图片
  update: async (id: string, data: Partial<GalleryImage>) => {
    return apiRequest<GalleryImage>(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/gallery/:id - 删除图片
  delete: async (id: string) => {
    return apiRequest<void>(`/api/gallery/${id}`, {
      method: 'DELETE',
    });
  },
};
