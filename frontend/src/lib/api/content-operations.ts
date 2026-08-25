import { apiRequest } from './request';

export type ContentOperationType = 'post' | 'game' | 'anime' | 'gallery';
export type ContentOperationPriority = 'high' | 'medium' | 'low';

export interface ContentOperationItem {
  id: string;
  type: ContentOperationType;
  title: string;
  path: string;
  priority: ContentOperationPriority;
  issues: string[];
}

export interface ContentOperationsOverview {
  total: number;
  visibleCount: number;
  maxItems: number;
  byType: Array<{ type: ContentOperationType; count: number }>;
  items: ContentOperationItem[];
}

export const contentOperationsApi = {
  getOverview: () => apiRequest<ContentOperationsOverview>('/api/dashboard/content-operations'),
};
