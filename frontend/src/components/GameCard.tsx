import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Trophy } from 'lucide-react';
import type { Game } from '../lib/api/games';

interface GameCardProps {
  game: Game;
}

const getPlatformColor = (platform: string): string => {
  const map: Record<string, string> = {
    'PC': 'bg-blue-500',
    'Steam': 'bg-blue-600',
    'PlayStation': 'bg-blue-700',
    'PS5': 'bg-blue-700',
    'PS4': 'bg-blue-700',
    'Xbox': 'bg-green-600',
    'Switch': 'bg-red-500',
    'Nintendo Switch': 'bg-red-500',
    'Mobile': 'bg-purple-500',
    'iOS': 'bg-purple-500',
    'Android': 'bg-purple-500',
    'Web': 'bg-gray-500',
  };
  return map[platform] || 'bg-gray-500';
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'WANT_TO_PLAY': return '想玩';
    case 'PLAYING': return '进行中';
    case 'COMPLETED': return '已完成';
    case 'DROPPED': return '已放弃';
    case 'REPLAYING': return '重玩中';
    default: return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'WANT_TO_PLAY': return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'PLAYING': return 'bg-neon text-white';
    case 'COMPLETED': return 'bg-ink text-white dark:bg-white dark:text-ink';
    case 'DROPPED': return 'bg-gray-100 text-gray-400 line-through decoration-black dark:bg-gray-800 dark:text-gray-500';
    case 'REPLAYING': return 'bg-pink-500 text-white';
    default: return 'bg-gray-200 text-gray-600';
  }
};

const formatPlaytime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const achievementRate = game.achievementsTotal > 0
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;

  return (
    <Link
      to={`/games/${game.id}`}
      className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 hover:border-neon transition-all duration-300 block overflow-hidden"
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] w-full relative overflow-hidden bg-gray-100 dark:bg-[#050505]">
        <img
          src={game.cover}
          alt={game.title}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Platform Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider shadow-md text-white ${getPlatformColor(game.platform)}`}>
            {game.platform}
          </span>
        </div>

        {/* Score Badge */}
        {game.score !== undefined && game.score !== null && (
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/80 backdrop-blur-sm text-neon font-black font-sans flex items-center justify-center text-sm border border-white/20 shadow-lg">
            {game.score}
          </div>
        )}

        {/* Favorite Badge */}
        {game.favorite && (
          <div className="absolute bottom-2 right-2">
            <div className="w-8 h-8 bg-pink-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Heart size={14} className="text-white fill-white" />
            </div>
          </div>
        )}

        {/* Neon border glow on hover */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-neon/30 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-sans font-bold text-sm text-ink dark:text-white mb-3 line-clamp-1 group-hover:text-neon transition-colors">
          {game.title}
        </h3>

        {(game.notes || game.description) && (
          <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
            {game.notes || game.description}
          </p>
        )}

        {/* Status */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${getStatusColor(game.status)}`}>
            {getStatusLabel(game.status)}
          </span>
        </div>

        {/* Playtime & Achievements */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-neon" />
              PLAYTIME
            </span>
            <span>{formatPlaytime(game.playtime)}</span>
          </div>

          {game.achievementsTotal > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy size={12} className="text-neon" />
                  ACHIEVEMENTS
                </span>
                <span>{game.achievementsUnlocked} / {game.achievementsTotal}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-[#222] overflow-hidden">
                <div
                  className="h-full bg-neon transition-all duration-500"
                  style={{ width: `${achievementRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {game.genres.slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-mono rounded"
              >
                {genre}
              </span>
            ))}
            {game.genres.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-400 text-[10px] font-mono">
                +{game.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default GameCard;
