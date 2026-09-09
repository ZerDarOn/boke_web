import React, { useEffect, useMemo, useRef, useState } from 'react';
import APlayer, { type APlayerAudio } from 'aplayer';
import 'aplayer/dist/APlayer.min.css';
import './MusicPlayer.css';
import { Loader2, AlertCircle, Music2 } from 'lucide-react';
import { fetchSourceTracks } from '../lib/meting';
import { applyTrackCurations } from '../lib/musicCuration';
import { MUSIC_CACHE_VERSION, DEFAULT_MUSIC_SOURCES, type MusicSource } from '../lib/musicConfig';
import { useMusicSources } from '../hooks/queries/settings';
import { useMusicTrackCurations } from '../hooks/queries/settings';

interface MusicPlayerProps {
  /** 紧凑模式：折叠歌单、降低列表高度，适合右侧栏小窗口 */
  compact?: boolean;
  /** 指定要播放的歌单源；不传则用后台第一个启用的歌单 */
  source?: MusicSource;
  className?: string;
  trackCategory?: string;
}

const COMPACT_PLAYLIST_LIMIT = 12;

// 检查并清除旧版本的 APlayer 进度缓存
const checkAndClearCache = () => {
  const cacheKey = 'ink_aplayer_cache_version';
  const savedVersion = localStorage.getItem(cacheKey);
  if (savedVersion !== MUSIC_CACHE_VERSION) {
    localStorage.removeItem('ink-aplayer');
    localStorage.setItem(cacheKey, MUSIC_CACHE_VERSION);
  }
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ compact = false, source, className, trackCategory }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<APlayer | null>(null);
  const [audios, setAudios] = useState<APlayerAudio[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 没有显式传入 source 时（如右侧栏迷你播放器），回退到后台第一个启用的歌单
  const sourcesQuery = useMusicSources();
  const { data: trackCurations = [] } = useMusicTrackCurations();
  const effectiveSource = useMemo<MusicSource | undefined>(() => {
    if (source) return source;
    if (sourcesQuery.data) {
      return sourcesQuery.data.find((s) => s.enabled) ?? DEFAULT_MUSIC_SOURCES[0];
    }
    return undefined; // 歌单清单仍在加载
  }, [source, sourcesQuery.data]);
  const playerAudios = useMemo(
    () => (compact ? audios?.slice(0, COMPACT_PLAYLIST_LIMIT) : audios),
    [audios, compact],
  );

  // 组件挂载时检查缓存版本
  useEffect(() => {
    checkAndClearCache();
  }, []);

  // 拉取歌单
  useEffect(() => {
    if (!effectiveSource) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setAudios(null);
    fetchSourceTracks(effectiveSource, controller.signal)
      .then((list) => setAudios(applyTrackCurations(list, trackCurations, trackCategory)))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message || '音乐加载失败');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSource?.server, effectiveSource?.type, effectiveSource?.sourceId, trackCategory, trackCurations]);

  // 实例化 APlayer（歌单就绪后）
  useEffect(() => {
    if (!playerAudios || playerAudios.length === 0 || !containerRef.current) return;
    const theme =
      getComputedStyle(document.documentElement).getPropertyValue('--color-neon').trim() ||
      '#10b981';
    const ap = new APlayer({
      container: containerRef.current,
      audio: playerAudios,
      theme,
      mutex: true,
      preload: 'none',
      volume: 0.7,
      lrcType: 3,
      listFolded: compact,
      listMaxHeight: compact ? '160px' : '420px',
      storageName: 'ink-aplayer',
    });
    instanceRef.current = ap;
    return () => {
      ap.destroy();
      instanceRef.current = null;
    };
  }, [playerAudios, compact]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-400" role="status">
        <Loader2 size={16} className="animate-spin text-neon motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-xs font-mono tracking-wider">LOADING.MUSIC...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 px-3 text-center" role="alert">
        <AlertCircle size={20} className="text-orange-400" aria-hidden="true" />
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{error}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono flex items-center gap-1">
          <Music2 size={10} /> 可在后台「音乐管理」检查歌单 ID
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className={`ink-aplayer ${className || ''}`} />;
};

export default MusicPlayer;
