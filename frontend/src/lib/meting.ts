/**
 * Meting API 封装：把一个歌单源转成 APlayer 可用的歌曲列表。
 */
import type { APlayerAudio } from 'aplayer';
import { METING_API_BASE, type MusicSource } from './musicConfig';

/** Meting API 返回的单曲结构 */
interface MetingTrack {
  name: string;
  artist: string;
  url: string;
  pic: string;
  lrc: string;
}

/**
 * 向 Meting API 请求一个资源（歌单/单曲/专辑/歌手）的歌曲列表。
 */
export async function fetchSourceTracks(
  source: Pick<MusicSource, 'server' | 'type' | 'sourceId'>,
  signal?: AbortSignal,
): Promise<APlayerAudio[]> {
  const params = new URLSearchParams({
    server: source.server,
    type: source.type,
    id: source.sourceId,
  });
  const res = await fetch(`${METING_API_BASE}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Meting 请求失败 (${res.status})`);
  }
  const data = (await res.json()) as MetingTrack[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('歌单为空或无法获取，请检查 ID 是否正确、是否公开');
  }
  return data
    .filter((t) => t && t.url)
    .map((t) => ({
      name: t.name || '未知曲目',
      artist: t.artist || '未知艺术家',
      url: t.url,
      cover: t.pic,
      lrc: t.lrc,
      type: 'auto',
    }));
}
