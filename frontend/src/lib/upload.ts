import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders } from './api/request';

/**
 * 统一的图片上传服务
 * 支持多种类型的图片上传
 */

export type UploadImageType =
  | 'posts' | 'anime' | 'game' | 'gallery' | 'network' | 'skills' | 'avatars' | 'general';

/** 与后端 multer imageFileFilter 保持一致的白名单 */
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/** 与后端 multer 图片限制保持一致（提前在客户端拦截，避免上传后才报错） */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const uploadImage = async (
  file: File | Blob,
  type: UploadImageType,
  filename?: string
): Promise<string> => {
  // 验证文件类型
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('请选择有效的图片文件 (JPG/PNG/GIF/WebP/SVG)');
  }

  // 验证文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('图片大小不能超过 5MB');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeaders(),
  };

  // 创建 FormData（Blob 需要显式文件名）
  const formData = new FormData();
  formData.append('image', file, filename || (file instanceof File ? file.name : 'image.png'));

  try {
    // 上传到服务器
    const response = await fetch(`${API_BASE_URL}/api/upload/image/${type}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `上传失败: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }

    if (!result.data?.originalUrl) {
      throw new Error('上传响应格式错误');
    }

    return result.data.originalUrl;
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
};

/**
 * 上传多张图片
 */
export const uploadImages = async (
  files: File[],
  type: 'gallery' | 'general'
): Promise<string[]> => {
  // 验证文件数量
  if (files.length === 0) {
    throw new Error('请选择至少一张图片');
  }

  if (files.length > 20) {
    throw new Error('一次最多上传 20 张图片');
  }

  // 验证每个文件
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error(`文件 "${file.name}" 不是图片文件`);
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`文件 "${file.name}" 大小超过 10MB`);
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeaders(),
  };

  // 创建 FormData
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  try {
    // 上传到服务器
    const response = await fetch(`${API_BASE_URL}/api/upload/images/${type}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `上传失败: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }

    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new Error('上传响应格式错误');
    }

    return result.data.map((item: any) => item.originalUrl);
  } catch (error) {
    console.error('批量上传失败:', error);
    throw error;
  }
};

export const uploadCursor = async (file: File): Promise<string> => {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!['.cur', '.png'].includes(extension)) {
    throw new Error('请选择 .cur 或透明 .png 光标文件');
  }
  if (file.size > 1024 * 1024) {
    throw new Error('光标文件不能超过 1MB');
  }

  const formData = new FormData();
  formData.append('cursor', file);
  const response = await fetch(`${API_BASE_URL}/api/upload/cursor`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...getAuthHeaders() },
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.data?.originalUrl) {
    throw new Error(result.error || '光标上传失败');
  }
  return result.data.originalUrl;
};

export default uploadImage;
