import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Pin, Save, Search } from 'lucide-react';
import { fetchSourceTracks } from '../lib/meting';
import { getMusicSourceKey, type CuratedAudio, type MusicTrackCuration } from '../lib/musicCuration';
import type { MusicSource } from '../lib/musicConfig';
import { useMusicTrackCurations, useSaveMusicTrackCurations } from '../hooks/queries/settings';
import { useToastActions } from '../contexts/ToastContext';

interface TrackCurationPanelProps {
  sources: MusicSource[];
}

const MAX_VISIBLE_TRACKS = 100;

const TrackCurationPanel: React.FC<TrackCurationPanelProps> = ({ sources }) => {
  const toast = useToastActions();
  const { data: curations = [] } = useMusicTrackCurations();
  const saveMutation = useSaveMusicTrackCurations();
  const [sourceId, setSourceId] = useState('');
  const [tracks, setTracks] = useState<CuratedAudio[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MusicTrackCuration>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source = sources.find((item) => item.id === sourceId) ?? sources[0];
  const sourceKey = source ? getMusicSourceKey(source) : '';

  useEffect(() => {
    if (sources.length > 0 && !sources.some((item) => item.id === sourceId)) {
      setSourceId(sources[0].id);
    }
  }, [sourceId, sources]);

  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchSourceTracks(source, controller.signal)
      .then(setTracks)
      .catch((fetchError: Error) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message || '歌曲读取失败');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [source?.server, source?.sourceId, source?.type]);

  useEffect(() => {
    if (!sourceKey) return;
    const nextDrafts = curations
      .filter((curation) => curation.sourceKey === sourceKey)
      .reduce<Record<string, MusicTrackCuration>>((result, curation) => {
        result[curation.trackKey] = curation;
        return result;
      }, {});
    setDrafts(nextDrafts);
  }, [curations, sourceKey]);

  const visibleTracks = useMemo(() => tracks
    .filter((track) => `${track.name} ${track.artist}`.toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase()))
    .slice(0, MAX_VISIBLE_TRACKS), [searchTerm, tracks]);

  const handleDraftChange = (track: CuratedAudio, changes: Partial<MusicTrackCuration>) => {
    setDrafts((current) => ({
      ...current,
      [track.trackKey]: {
        ...current[track.trackKey],
        ...changes,
        trackKey: track.trackKey,
        sourceKey,
      },
    }));
  };

  const handleSave = async () => {
    const currentSourceCurations = Object.values(drafts).filter((curation) => (
      curation.pinned || curation.category?.trim() || curation.note?.trim() || curation.order
    ));
    const next = [...curations.filter((curation) => curation.sourceKey !== sourceKey), ...currentSourceCurations];
    try {
      await saveMutation.mutateAsync(next);
      toast.success('歌曲策展已保存');
    } catch {
      toast.error('歌曲策展保存失败');
    }
  };

  if (sources.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">逐曲策展</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">选择一个已配置歌单，置顶、分组和备注会在前台播放器生效。</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saveMutation.isPending || loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm text-white disabled:opacity-50">
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          保存歌曲策展
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-gray-700 dark:text-gray-300">
          歌单
          <select value={source?.id || ''} onChange={(event) => setSourceId(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
            {sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="relative block text-sm text-gray-700 dark:text-gray-300">
          搜索歌曲
          <Search size={14} className="absolute bottom-3 left-3 text-gray-400" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900" placeholder="歌名或作者" />
        </label>
      </div>

      {loading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" />读取歌曲中…</div>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {!loading && !error && (
        <div className="space-y-2">
          {tracks.length > MAX_VISIBLE_TRACKS && <p className="text-xs text-gray-400">为保持后台流畅，当前最多显示前 {MAX_VISIBLE_TRACKS} 首匹配歌曲；请用搜索缩小范围。</p>}
          {visibleTracks.map((track) => {
            const draft = drafts[track.trackKey];
            return (
              <div key={track.trackKey} className="grid gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700 lg:grid-cols-[minmax(0,1fr)_7rem_7rem_2fr_auto] lg:items-center">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-gray-900 dark:text-white">{track.name}</p><p className="truncate text-xs text-gray-400">{track.artist}</p></div>
                <input value={draft?.category || ''} onChange={(event) => handleDraftChange(track, { category: event.target.value })} className="rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="分组" aria-label={`${track.name} 的分组`} />
                <input type="number" value={draft?.order ?? 0} onChange={(event) => handleDraftChange(track, { order: Number(event.target.value) || 0 })} className="rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="排序" aria-label={`${track.name} 的排序`} />
                <input value={draft?.note || ''} onChange={(event) => handleDraftChange(track, { note: event.target.value })} className="rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="推荐理由（仅后台保存）" aria-label={`${track.name} 的推荐理由`} />
                <button type="button" onClick={() => handleDraftChange(track, { pinned: !draft?.pinned })} className={`inline-flex items-center justify-center gap-1 rounded px-3 py-1.5 text-xs ${draft?.pinned ? 'bg-neon text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`} aria-pressed={Boolean(draft?.pinned)}>
                  <Pin size={13} />置顶
                </button>
              </div>
            );
          })}
          {visibleTracks.length === 0 && <p className="py-8 text-center text-sm text-gray-400">没有匹配的歌曲。</p>}
        </div>
      )}
    </section>
  );
};

export default TrackCurationPanel;
