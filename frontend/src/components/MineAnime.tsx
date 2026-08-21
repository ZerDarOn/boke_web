import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, CheckCircle, PauseCircle, XCircle, Heart, HeartOff, Loader2 } from 'lucide-react';
import { useAnimeList } from '../hooks/queries/anime';

const MineAnime: React.FC = () => {
  const [filter, setFilter] = useState<'FAVORITE' | 'ALL' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: animeList = [], isLoading: loading, error: queryError } = useAnimeList({ limit: 500 });
  const error = queryError?.message ?? null;

  // 类型中文名 + 数据中实际存在的类型（动态生成按钮，避免出现没有内容的空类型）
  const TYPE_LABELS: Record<string, string> = {
    TV: '番剧', Movie: '剧场版', OVA: 'OVA', Special: '特别篇', ONA: '网络动画',
  };
  const availableTypes = Array.from(new Set(animeList.map((a) => a.type).filter(Boolean)));

  const filteredList = useMemo(() => animeList.filter((item) => {
    const statusOk =
      filter === 'ALL' ? true : filter === 'FAVORITE' ? item.favorite : item.status === filter;
    const typeOk = typeFilter === 'ALL' ? true : item.type === typeFilter;
    const query = searchTerm.trim().toLocaleLowerCase();
    const searchableText = [item.title, item.synopsis, item.notes, ...item.genres, ...item.tags]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    return statusOk && typeOk && (!query || searchableText.includes(query));
  }), [animeList, filter, searchTerm, typeFilter]);

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'WATCHING': return <PlayCircle size={14} />;
          case 'COMPLETED': return <CheckCircle size={14} />;
          case 'ON_HOLD': return <PauseCircle size={14} />;
          case 'DROPPED': return <XCircle size={14} />;
          default: return null;
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'WATCHING': return '正在追看';
          case 'COMPLETED': return '已完结';
          case 'ON_HOLD': return '暂时搁置';
          case 'DROPPED': return '已弃';
          default: return status;
      }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] p-6 md:p-8 rounded-lg min-h-[600px] transition-colors">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-300 font-mono text-sm">
            ERROR: {error}
          </p>
        </div>
      )}
      
      {!loading && !error && (
        <>
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-black font-sans text-ink dark:text-white mb-2">ANIME.LOG</h2>
            <div className="h-1 w-24 bg-neon"></div>
          </div>

          <div className="flex flex-wrap gap-2">
              {[
                  { key: 'FAVORITE', label: '❤️ 收藏' },
                  { key: 'ALL', label: '全部' },
                  { key: 'WATCHING', label: '正在追看' },
                  { key: 'COMPLETED', label: '已完结' },
                  { key: 'ON_HOLD', label: '暂时搁置' },
                  { key: 'DROPPED', label: '已弃' },
              ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFilter(opt.key as any)}
                    className={`
                        px-4 py-1.5 text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-2
                        ${filter === opt.key
                            ? 'bg-pink-500 text-white shadow-[4px_4px_0px_#ec4899] translate-y-[-2px]' 
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'}
                    `}
                  >
                      {opt.label}
                  </button>
              ))}
          </div>
      </div>

      <label className="mb-8 block max-w-md">
        <span className="sr-only">搜索追番</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索标题、标签、点评…"
          className="w-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-400 focus:border-neon dark:border-white/10 dark:bg-[#111] dark:text-white"
        />
      </label>

      {/* Type Filter（类型筛选：番剧 / 剧场版 / OVA…，仅当存在多种类型时显示） */}
      {availableTypes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-10 -mt-6">
          <span className="text-[10px] font-mono text-gray-400 uppercase mr-1 tracking-widest">类型</span>
          {[{ key: 'ALL', label: '全部' }, ...availableTypes.map((t) => ({ key: t, label: TYPE_LABELS[t] || t }))].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTypeFilter(opt.key)}
              className={`px-3 py-1 text-xs font-bold font-mono transition-all duration-300 ${
                typeFilter === opt.key
                  ? 'bg-neon text-white shadow-lg shadow-neon/30 -translate-y-0.5'
                  : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map((item) => (
              <Link
                key={item.id}
                to={`/anime/${item.id}`}
                className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 hover:border-neon transition-colors duration-300 block"
              >

                   {/* Poster Image */}
                   <div className="aspect-[2/3] w-full relative overflow-hidden bg-gray-100 dark:bg-[#050505]">
                       <img
                           src={item.cover}
                           alt={item.title}
                           loading="lazy"
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                       />

                       {/* Overlay Status Tag */}
                       <div className="absolute top-2 left-2">
                            <span className={`
                                 flex items-center gap-1 px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider shadow-md
                                 ${item.status === 'WATCHING' ? 'bg-neon text-white' : ''}
                                 ${item.status === 'COMPLETED' ? 'bg-ink text-white' : ''}
                                 ${item.status === 'ON_HOLD' ? 'bg-gray-200 text-gray-600' : ''}
                                 ${item.status === 'DROPPED' ? 'bg-gray-100 text-gray-400 line-through decoration-black' : ''}
                            `}>
                               {getStatusIcon(item.status)}
                               {getStatusLabel(item.status)}
                            </span>
                       </div>

                       {/* Score Badge */}
                       {item.score && (
                           <div className="absolute top-2 right-2 w-8 h-8 bg-black/80 backdrop-blur-sm text-neon font-black font-sans flex items-center justify-center text-sm border border-white/20">
                               {item.score}
                           </div>
                       )}

                       {/* Favorite Badge */}
                       {item.favorite && (
                           <div className="absolute bottom-2 right-2">
                               <div className="w-8 h-8 bg-pink-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                   <Heart size={14} className="text-white fill-white" />
                               </div>
                           </div>
                       )}
                   </div>

                   {/* Info */}
                   <div className="p-4">
                       <h3 className="font-sans font-bold text-sm text-ink dark:text-white mb-3 line-clamp-1 group-hover:text-neon transition-colors">
                           {item.title}
                       </h3>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-gray-500 dark:text-gray-400">
                                <span>EPISODE</span>
                                <span>{item.currentEp} / {item.episodes}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-[#222] overflow-hidden">
                                <div
                                  className="h-full bg-neon transition-all duration-500"
                                  style={{ width: `${item.episodes > 0 ? Math.min((item.currentEp / item.episodes) * 100, 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {(item.notes || item.synopsis) && (
                          <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                            {item.notes || item.synopsis}
                          </p>
                        )}
                   </div>

                </Link>
           ))}
       </div>
       {filteredList.length === 0 && (
         <div className="py-16 text-center text-sm text-gray-400">没有符合当前条件的追番记录。</div>
       )}
        </>
      )}
     </div>
   );
};

export default MineAnime;
