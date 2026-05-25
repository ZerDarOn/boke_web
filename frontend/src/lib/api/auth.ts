import { apiRequest, getAuthHeaders, getAuthToken } from './request';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    });
  },

  me: async () => {
    if (!getAuthToken()) {
      return { success: false, error: 'No token found' };
    }
    return apiRequest<User>('/api/auth/me');
  },

  logout: async () => {
    return apiRequest<void>('/api/auth/logout', { method: 'POST' });
  },
};
