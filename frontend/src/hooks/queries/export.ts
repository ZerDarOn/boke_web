import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/apiConfig';
import { getAuthToken } from '../../lib/api/request';

export interface ExportStats {
  posts: number;
  projects: number;
  anime: number;
  diaries: number;
  timeline: number;
  skills: number;
  gallery: number;
  announcements: number;
  total: number;
}

export function useExportStats() {
  return useQuery({
    queryKey: ['export', 'stats'],
    queryFn: async (): Promise<ExportStats> => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/export/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch export stats');
      }
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}
