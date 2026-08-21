import React, { useState, useMemo } from 'react';
import { Loader2, Gamepad2 } from 'lucide-react';
import { useGameList } from '../hooks/queries/games';
import GameCard from '../components/GameCard';
import GameFilter, { type GameStatusFilter } from '../components/GameFilter';

const Games: React.FC = () => {
  const [filter, setFilter] = useState<GameStatusFilter>('ALL');
  const [platform, setPlatform] = useState<string | null>(null);

  const apiParams = useMemo(() => {
    const params: { status?: string; platform?: string; favorite?: boolean; limit?: number } = { limit: 500 };
    if (filter !== 'ALL' && filter !== 'FAVORITE') {
      params.status = filter;
    }
    if (filter === 'FAVORITE') {
      params.favorite = true;
    }
    if (platform) {
      params.platform = platform;
    }
    return params;
  }, [filter, platform]);

  const { data: gameList = [], isLoading: loading, error: queryError } = useGameList(apiParams);
  const error = queryError?.message ?? null;

  const platforms = useMemo(() => {
    const set = new Set<string>();
    gameList.forEach((g) => {
      if (g.platform) set.add(g.platform);
    });
    return Array.from(set).sort();
  }, [gameList]);

  const filteredList = useMemo(() => {
    let list = gameList;
    if (filter === 'FAVORITE') {
      list = list.filter((g) => g.favorite);
    } else if (filter !== 'ALL') {
      list = list.filter((g) => g.status === filter);
    }
    if (platform) {
      list = list.filter((g) => g.platform === platform);
    }
    return list;
  }, [gameList, filter, platform]);

  return (
    <div className="animate-in fade-in duration-500">
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
                <div className="flex items-center gap-3 mb-2">
                  <Gamepad2 size={28} className="text-neon" />
                  <h2 className="text-3xl font-black font-sans text-ink dark:text-white">
                    GAME.LIBRARY
                  </h2>
                </div>
                <div className="h-1 w-24 bg-neon"></div>
              </div>

              <GameFilter
                activeFilter={filter}
                onFilterChange={(f) => {
                  setFilter(f);
                  if (f === 'FAVORITE') setPlatform(null);
                }}
                activePlatform={platform}
                onPlatformChange={setPlatform}
                platforms={platforms}
              />
            </div>

            {/* Grid */}
            {filteredList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredList.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Gamepad2 size={48} className="mb-4 opacity-30" />
                <p className="font-mono text-sm">暂无游戏记录</p>
                <p className="text-xs text-gray-500 mt-1">尝试调整筛选条件</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Games;
