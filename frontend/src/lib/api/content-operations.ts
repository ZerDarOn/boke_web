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

export interface ContentSuggestionProposal {
  field: 'excerpt' | 'tags';
  value: string | string[];
  label: string;
}

export interface ContentSuggestionResult {
  suggestions: ContentSuggestionProposal[];
  notice?: string;
}

export const contentOperationsApi = {
  getOverview: () => apiRequest<ContentOperationsOverview>('/api/dashboard/content-operations'),
  getSuggestions: (type: ContentOperationType, id: string) =>
    apiRequest<ContentSuggestionResult>(`/api/dashboard/content-operations/${type}/${id}/suggestions`, { method: 'POST' }),
  applySuggestions: (type: ContentOperationType, id: string, suggestions: { excerpt?: string; tags?: string[] }) =>
    apiRequest<{ applied: string[]; indexRebuildRequired: boolean }>(`/api/dashboard/content-operations/${type}/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(suggestions),
    }),
};
