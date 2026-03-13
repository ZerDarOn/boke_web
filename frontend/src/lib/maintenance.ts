/**
 * Maintenance API
 */

import { API_BASE_URL } from './apiConfig';

interface MaintenanceLoginRequest {
  password: string;
}

interface MaintenanceLoginResponse {
  token: string;
  expiry: number;
  maintenanceMode: boolean;
}

interface MaintenanceStatusResponse {
  enabled: boolean;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

export interface LogCategoriesResponse {
  categories: string[];
}

/**
 * Maintenance API client
 */
export const maintenanceApi = {
  /**
   * Check maintenance mode status
   */
  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/status`);
    const data = await response.json();
    return data as MaintenanceStatusResponse;
  },

  /**
   * Login to maintenance mode
   */
  login: async (password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data;
  },

  /**
   * Verify maintenance token
   */
  verifyToken: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/verify`, {
      headers: {
        'x-maintenance-token': token,
      },
    });

    const data = await response.json();
    return data;
  },

  /**
   * Get logs (protected)
   */
  getLogs: async (category: string, token: string, limit: number = 100) => {
    const response = await fetch(
      `${API_BASE_URL}/api/maintenance/logs/${category}?limit=${limit}`,
      {
        headers: {
          'x-maintenance-token': token,
        },
      }
    );

    const data = await response.json();
    return data as LogsResponse;
  },

  /**
   * Get all log categories (protected)
   */
  getCategories: async (token: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/maintenance/logs/categories`,
      {
        headers: {
          'x-maintenance-token': token,
        },
      }
    );

    const data = await response.json();
    return data as LogCategoriesResponse;
  },

  /**
   * Filter logs by level (protected)
   */
  filterLogs: async (category: string, level: string, token: string, limit: number = 100) => {
    const response = await fetch(
      `${API_BASE_URL}/api/maintenance/logs/filter?category=${category}&level=${level}&limit=${limit}`,
      {
        headers: {
          'x-maintenance-token': token,
        },
      }
    );

    const data = await response.json();
    return data as LogsResponse;
  },

  /**
   * Search logs (protected)
   */
  searchLogs: async (category: string, query: string, token: string, limit: number = 100) => {
    const response = await fetch(
      `${API_BASE_URL}/api/maintenance/logs/search?category=${category}&query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'x-maintenance-token': token,
        },
      }
    );

    const data = await response.json();
    return data as LogsResponse;
  },

  /**
   * Clear logs (protected)
   */
  clearLogs: async (category: string, token: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/maintenance/logs/clear?category=${category}`,
      {
        method: 'POST',
        headers: {
          'x-maintenance-token': token,
        },
      }
    );

    const data = await response.json();
    return data;
  },
};
