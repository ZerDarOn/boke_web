import { API_BASE_URL } from '../apiConfig';
import { apiRequest, getAuthHeaders, getAuthToken, type ApiResponse } from './request';

export interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  fileType?: string;
  size?: number;
  modifiedAt: string;
  protected?: boolean;
}

export interface FileContent {
  path: string;
  name: string;
  content: string;
  size: number;
  modifiedAt: string;
  extension: string;
}

export interface UploadedFile {
  fieldname: string;
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  path: string;
}

export const filesApi = {
  // GET /api/files - 获取文件列表
  getAll: async (path?: string) => {
    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);

    return apiRequest<FileItem[]>(`/api/files?${queryParams}`);
  },

  // GET /api/files/content - 获取文件内容
  getContent: async (path: string, password?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);
    if (password) queryParams.append('password', password);

    return apiRequest<FileContent>(`/api/files/content?${queryParams}`);
  },

  // GET /api/files/download - 下载文件
  download: async (path: string, password?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);
    if (password) queryParams.append('password', password);

    const url = `${API_BASE_URL}/api/files/download?${queryParams}`;
    const token = getAuthToken();

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      return { success: false, error: 'Download failed' };
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  },

  // POST /api/files - 创建文件/目录（需要认证）
  create: async (path: string, type: 'file' | 'directory' = 'file', content?: string, password?: string) => {
    return apiRequest<{ path: string; type: string; size?: number }>(`/api/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, type, content, password }),
    });
  },

  // PUT /api/files/content - 更新文件内容（需要认证）
  updateContent: async (path: string, content: string, password?: string) => {
    return apiRequest<{ path: string; size: number; modifiedAt: string }>(`/api/files/content`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content, password }),
    });
  },

  // POST /api/files/password - 设置文件密码（需要认证）
  setPassword: async (path: string, password: string) => {
    return apiRequest<void>(`/api/files/password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, password }),
    });
  },

  // DELETE /api/files/password - 移除文件密码保护（需要认证）
  removePassword: async (path: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);

    return apiRequest<void>(`/api/files/password?${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // DELETE /api/files - 删除文件/目录（需要认证）
  delete: async (path: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);

    return apiRequest<void>(`/api/files?${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // POST /api/files/upload - 上传文件（需要认证）
  upload: async (path: string, files: Array<{ name: string; content: string; type: string }>) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);

    const response = await fetch(`${API_BASE_URL}/api/files/upload?${queryParams}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ files }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return data as ApiResponse<any[]>;
  },

  // POST /api/files/export - 批量导出文件（需要认证）
  exportFiles: async (paths: string[]) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/files/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    // 下载ZIP文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },

  // POST /api/files/import - 批量导入文件（需要认证）
  importFiles: async (file: File, targetPath: string = '') => {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (targetPath) queryParams.append('targetPath', targetPath);

    const response = await fetch(`${API_BASE_URL}/api/files/import?${queryParams}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    return data as ApiResponse<{ fileCount: number; message: string }>;
  },
};
