import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders } from './api/request';

/**
 * 统一的图片上传服务
 * 支持多种类型的图片上传
 */

export const uploadImage = async (
  file: File,
  type: 'posts' | 'anime' | 'gallery' | 'network' | 'skills' | 'avatars' | 'general'
): Promise<string> => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  // 验证文件大小（默认最大 10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('图片大小不能超过 10MB');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeaders(),
  };

  // 创建 FormData
  const formData = new FormData();
  formData.append('image', file);

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

export default uploadImage;
