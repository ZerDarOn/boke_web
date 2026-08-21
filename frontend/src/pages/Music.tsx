import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music4, Disc3, Headphones, Loader2, ListMusic, Pin, Search } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import MusicPlayer from '../components/MusicPlayer';
import { useMusicSources } from '../hooks/queries/settings';
import { useMusicTrackCurations } from '../hooks/queries/settings';
import { getMusicSourceKey } from '../lib/musicCuration';

const Music: React.FC = () => {
  const { lang } = useLang();
  const { data: sources = [], isLoading } = useMusicSources();
  const { data: trackCurations = [] } = useMusicTrackCurations();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('全部');
  const categories = useMemo(() => ['全部', ...Array.from(new Set(sources.map((source) => source.category).filter(Boolean) as string[]))], [sources]);
  const enabledSources = useMemo(() => sources
    .filter((source) => source.enabled)
    .filter((source) => category === '全部' || source.category === category)
    .filter((source) => `${source.name} ${source.category ?? ''} ${source.description ?? ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name, 'zh-CN')),
  [category, searchTerm, sources]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackCategory, setTrackCategory] = useState('全部');
  const selected = enabledSources.find((s) => s.id === selectedId) ?? enabledSources[0];
  const trackCategories = useMemo(() => selected
    ? Array.from(new Set(trackCurations.filter((curation) => curation.sourceKey === getMusicSourceKey(selected)).map((curation) => curation.category?.trim()).filter(Boolean) as string[]))
    : [], [selected, trackCurations]);

  useEffect(() => setTrackCategory('全部'), [selected?.id]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* 标题区 */}
      <div className="mb-8 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon/20 to-secondary/10 flex items-center justify-center">
            <Disc3 size={20} className="text-neon animate-[spin_6s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink dark:text-white tracking-tight flex items-center gap-2">
              {lang === 'EN' ? 'MUSIC HALL' : '音乐馆'}
              <span className="text-neon font-mono text-xs animate-pulse">♪</span>
            </h1>
            <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">
              ONLINE.PLAYLIST // STREAM
            </p>
          </div>
        </div>
        <div className="h-[2px] w-full bg-gradient-to-r from-neon/50 via-secondary/30 to-transparent"></div>
      </div>

      {/* 简介 */}
      <p className="font-serif text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex items-start gap-2">
        <Headphones size={16} className="text-neon mt-0.5 flex-shrink-0" />
        {lang === 'EN'
          ? 'A curated stream from my playlists. Press play and let the ink flow.'
          : '这里流淌着我收藏的歌单。点击播放，让墨色随音律晕开。'}
      </p>

      {sources.length > 1 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1 text-xs ${category === item ? 'border-neon bg-neon text-white' : 'border-gray-200 bg-white/60 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'}`}>
                {item}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索歌单" className="w-full rounded-full border border-gray-200 bg-white/60 py-1.5 pl-8 pr-3 text-xs dark:border-white/10 dark:bg-white/5" />
          </label>
        </div>
      )}

      {/* 歌单切换标签 */}
      {enabledSources.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {enabledSources.map((s) => {
            const active = selected?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 flex items-center gap-1.5 border ${
                  active
                    ? 'bg-neon text-white border-neon shadow-md shadow-neon/30'
                    : 'bg-white/60 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-neon/40 hover:text-neon'
                }`}
              >
                <ListMusic size={12} />
                {s.name}
                {s.pinned && <Pin size={11} aria-label="已置顶" />}
              </button>
            );
          })}
        </div>
      )}

      {trackCategories.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">歌曲分组</span>
          {['全部', ...trackCategories].map((item) => <button key={item} onClick={() => setTrackCategory(item)} className={`rounded-full border px-3 py-1 text-xs ${trackCategory === item ? 'border-secondary bg-secondary text-white' : 'border-gray-200 bg-white/60 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'}`}>{item}</button>)}
        </div>
      )}

      {/* 主播放器（展开歌单） */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon via-secondary to-transparent"></div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <Loader2 size={16} className="animate-spin text-neon" />
            <span className="text-xs font-mono tracking-wider">LOADING.PLAYLISTS...</span>
          </div>
        ) : selected ? (
          <MusicPlayer source={selected} trackCategory={trackCategory === '全部' ? undefined : trackCategory} key={`${selected.id}-${trackCategory}`} />
        ) : (
          <div className="text-center py-10 space-y-3">
            <Music4 size={28} className="text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lang === 'EN' ? 'No playlist yet.' : '还没有歌单'}
            </p>
            <Link
              to="/admin/music"
              className="inline-block text-xs text-neon hover:underline font-mono"
            >
              {lang === 'EN' ? 'Add one in admin →' : '去后台「音乐管理」添加 →'}
            </Link>
          </div>
        )}
      </div>

      {/* 提示 */}
      <p className="mt-6 text-[11px] text-gray-400 dark:text-gray-600 font-mono flex items-center gap-2">
        <Music4 size={12} className="text-secondary" />
        {lang === 'EN'
          ? 'Some copyrighted tracks may be unavailable due to streaming restrictions.'
          : '受版权限制，部分歌曲可能无法播放，可在右侧栏继续随处收听。'}
      </p>
    </div>
  );
};

export default Music;
