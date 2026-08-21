import type { APlayerAudio } from 'aplayer';
import type { MusicSource } from './musicConfig';

export interface MusicTrackCuration {
  trackKey: string;
  sourceKey: string;
  pinned?: boolean;
  category?: string;
  note?: string;
  order?: number;
}

export interface CuratedAudio extends APlayerAudio {
  trackKey: string;
}

interface TrackIdentity {
  artist?: string;
  name?: string;
}

const normalizeKeyPart = (value: string | undefined) => value?.trim().toLocaleLowerCase() || '';

export const getMusicSourceKey = (source: Pick<MusicSource, 'server' | 'type' | 'sourceId'>) => (
  `${source.server}:${source.type}:${source.sourceId.trim()}`
);

export const getMusicTrackKey = (
  source: Pick<MusicSource, 'server' | 'type' | 'sourceId'>,
  track: TrackIdentity,
) => `${getMusicSourceKey(source)}:${normalizeKeyPart(track.name)}:${normalizeKeyPart(track.artist)}`;

export const applyTrackCurations = (
  tracks: CuratedAudio[],
  curations: MusicTrackCuration[],
  category?: string,
) => {
  const curationMap = new Map(curations.map((curation) => [curation.trackKey, curation]));
  return tracks
    .filter((track) => !category || curationMap.get(track.trackKey)?.category === category)
    .sort((left, right) => {
      const leftCuration = curationMap.get(left.trackKey);
      const rightCuration = curationMap.get(right.trackKey);
      return Number(Boolean(rightCuration?.pinned)) - Number(Boolean(leftCuration?.pinned))
        || (leftCuration?.order ?? 0) - (rightCuration?.order ?? 0)
        || (left.name || '').localeCompare(right.name || '', 'zh-CN');
    });
};
