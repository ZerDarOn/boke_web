import axios from 'axios';
import { SettingsService } from './settings.service';
import { apiLog } from '../lib/logger';

const METING_API_BASE = 'https://api.qijieya.cn/meting/';
const MAX_TRACKS_PER_SOURCE = 500;
const ALLOWED_SERVERS = new Set(['netease', 'tencent', 'kugou', 'xiami', 'baidu']);
const ALLOWED_TYPES = new Set(['playlist', 'song', 'album', 'artist']);
const DEFAULT_MUSIC_SOURCES: MusicSourceInput[] = [{
  id: 'default', name: '默认歌单', server: 'netease', type: 'playlist', sourceId: '2619366284', enabled: true,
}];

interface MusicSourceInput { id: string; name: string; server: string; type: string; sourceId: string; enabled: boolean; }
interface MetingTrack { name?: string; artist?: string; pic?: string; album?: string; url?: string; }
export interface MusicCatalogTrack { trackKey: string; sourceKey: string; sourceName: string; name: string; artist: string; album?: string; cover?: string; }
interface MusicCatalog { updatedAt: string; tracks: MusicCatalogTrack[]; failures: Array<{ sourceId: string; reason: string }>; }

const sourceKey = (source: Pick<MusicSourceInput, 'server' | 'type' | 'sourceId'>) => `${source.server}:${source.type}:${source.sourceId.trim()}`;
const trackKey = (source: MusicSourceInput, track: MetingTrack) => `${sourceKey(source)}:${(track.name || '').trim().toLocaleLowerCase()}:${(track.artist || '').trim().toLocaleLowerCase()}`;

export class MusicCatalogService {
  static async getCatalog(): Promise<MusicCatalog | null> {
    return SettingsService.getByKey('music_catalog') as Promise<MusicCatalog | null>;
  }

  static async syncCatalog(): Promise<MusicCatalog> {
    const previousCatalog = await this.getCatalog();
    const configured = await SettingsService.getByKey('music_sources');
    const sources = Array.isArray(configured) && configured.length ? configured as MusicSourceInput[] : DEFAULT_MUSIC_SOURCES;
    const enabledSources = sources.filter((source) => source?.enabled && ALLOWED_SERVERS.has(source.server) && ALLOWED_TYPES.has(source.type) && source.sourceId);
    const tracks: MusicCatalogTrack[] = [];
    const failures: MusicCatalog['failures'] = [];

    for (const source of enabledSources) {
      try {
        const response = await axios.get<MetingTrack[]>(METING_API_BASE, {
          params: { server: source.server, type: source.type, id: source.sourceId },
          timeout: 12_000,
          headers: { Accept: 'application/json' },
        });
        if (!Array.isArray(response.data)) throw new Error('invalid_response');
        tracks.push(...response.data.slice(0, MAX_TRACKS_PER_SOURCE)
          .filter((track) => track?.name && track?.artist)
          .map((track) => ({
            trackKey: trackKey(source, track), sourceKey: sourceKey(source), sourceName: source.name,
            name: track.name!.trim(), artist: track.artist!.trim(), album: track.album?.trim(), cover: track.pic,
          })));
      } catch (error) {
        const reason = error instanceof Error ? error.name : 'UnknownError';
        failures.push({ sourceId: source.id, reason });
        apiLog.warn('Music catalog source sync failed', { sourceId: source.id, reason });
      }
    }

    for (const failure of failures) {
      const failedSource = enabledSources.find((source) => source.id === failure.sourceId);
      if (!failedSource || !previousCatalog) continue;
      tracks.push(...previousCatalog.tracks.filter((track) => track.sourceKey === sourceKey(failedSource)));
    }

    const catalog: MusicCatalog = { updatedAt: new Date().toISOString(), tracks, failures };
    await SettingsService.set('music_catalog', catalog);
    apiLog.info('Music catalog sync completed', { sourceCount: enabledSources.length, trackCount: tracks.length, failureCount: failures.length });
    return catalog;
  }
}
