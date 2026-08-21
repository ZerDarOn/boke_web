export interface MusicTrackCurationPayload {
  category?: string;
  note?: string;
  order?: number;
  pinned?: boolean;
  sourceKey: string;
  trackKey: string;
}

const isOptionalString = (value: unknown, maxLength: number) => value === undefined || (typeof value === 'string' && value.length <= maxLength);

export const isMusicTrackCurations = (value: unknown): value is MusicTrackCurationPayload[] => (
  Array.isArray(value)
  && value.length <= 1000
  && value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const curation = item as Record<string, unknown>;
    return typeof curation.trackKey === 'string'
      && curation.trackKey.length > 0
      && curation.trackKey.length <= 500
      && typeof curation.sourceKey === 'string'
      && curation.sourceKey.length > 0
      && curation.sourceKey.length <= 300
      && (curation.pinned === undefined || typeof curation.pinned === 'boolean')
      && isOptionalString(curation.category, 50)
      && isOptionalString(curation.note, 500)
      && (curation.order === undefined || (typeof curation.order === 'number' && Number.isFinite(curation.order)));
  })
);
