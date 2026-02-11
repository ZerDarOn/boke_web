import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ANIME_LIST } from '../constants';
import { PlayCircle, CheckCircle, PauseCircle, XCircle, Heart, HeartOff } from 'lucide-react';

const MineAnime: React.FC = () => {
  const [filter, setFilter] = useState<'FAVORITE' | 'ALL' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'>('ALL');

  const filteredList = filter === 'ALL'
    ? ANIME_LIST
    : filter === 'FAVORITE'
    ? ANIME_LIST.filter(item => item.favorite)
    : ANIME_LIST.filter(item => item.status === filter);

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

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map((item) => (
              <Link
                key={item.id}
                to={`/anime/${item.id}`}
                className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 hover:border-neon transition-colors duration-300 block"
              >

                   {/* Poster Image Placeholder */}
                   <div className="aspect-[2/3] w-full relative overflow-hidden bg-gray-100 dark:bg-[#050505]">
                       <div
                           className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                           style={{ backgroundColor: item.cover }}
                       ></div>

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
                               <span>{item.currentEp} / {item.totalEps}</span>
                           </div>
                           <div className="h-1.5 w-full bg-gray-100 dark:bg-[#222] overflow-hidden">
                               <div
                                 className="h-full bg-neon transition-all duration-500"
                                 style={{ width: `${(item.currentEp / item.totalEps) * 100}%` }}
                               ></div>
                           </div>
                       </div>
                   </div>

               </Link>
          ))}
      </div>
    </div>
  );
};

export default MineAnime;