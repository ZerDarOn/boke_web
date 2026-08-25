import { apiRequest } from './request';

export interface MusicCatalogTrack { trackKey: string; sourceKey: string; sourceName: string; name: string; artist: string; album?: string; cover?: string; }
export interface MusicCatalog { updatedAt: string; tracks: MusicCatalogTrack[]; failures: Array<{ sourceId: string; reason: string }>; }

export const musicApi = {
  getCatalog: () => apiRequest<MusicCatalog | null>('/api/music/catalog'),
  syncCatalog: () => apiRequest<MusicCatalog>('/api/music/catalog/sync', { method: 'POST' }),
};
