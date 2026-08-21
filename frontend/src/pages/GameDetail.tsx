import React from 'react';
import { useParams, Link } from 'react-router-dom';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';
import PrevNextNavigation from '../components/PrevNextNavigation';
import { useGameItem, useGameList } from '../hooks/queries/games';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useThemeClass } from '../hooks/useThemeClass';
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Trophy,
  Heart,
  Gamepad2,
  ExternalLink,
  Building2,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: game, isLoading: loading, error: queryError } = useGameItem(id);
  const { data: allGames = [] } = useGameList({ limit: 500 });
  const error = queryError?.message ?? null;
  const scrollProgress = useScrollProgress();
  const theme = useThemeClass();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon"></div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
          <p className="font-mono text-gray-500 mb-6">{error || '游戏不存在'}</p>
          <Link
            to="/games"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            返回游戏库
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allGames.findIndex((g) => g.id === id);
  const prevGame = currentIndex > 0 ? allGames[currentIndex - 1] : null;
  const nextGame = currentIndex < allGames.length - 1 ? allGames[currentIndex + 1] : null;

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
      case 'DROPPED': return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
      case 'REPLAYING': return 'bg-pink-500 text-white';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const formatPlaytime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} 小时`;
    return `${hours} 小时 ${mins} 分钟`;
  };

  const formatDate = (date?: string): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const achievementRate = game.achievementsTotal > 0
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;

  const releaseYear = game.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  return (
    <div className="animate-in fade-in duration-500 relative">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-neon to-neon-dark shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Breadcrumb */}
      <div className="mb-6 relative z-10">
        <BreadcrumbNav items={[
          { label: '游戏库', href: '/games' },
          { label: game.title }
        ]} />
      </div>

      {/* Back Button */}
      <div className="mb-8">
        <Link
          to="/games"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group mb-6"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="group-hover:underline decoration-neon/50">返回游戏库</span>
        </Link>
      </div>

      {/* Banner */}
      <div className="mb-8 relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
        <div
          className="w-full h-64 md:h-80 relative bg-cover bg-center"
          style={{ backgroundImage: `url("${game.bannerImage || game.cover}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-[#0a0a0a] dark:via-transparent dark:to-[#0a0a0a]"></div>

          <div className="absolute bottom-4 left-4 md:left-8 z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-xs px-2 py-1 rounded ${getStatusColor(game.status)}`}>
                {getStatusLabel(game.status)}
              </span>
              {game.favorite && (
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <Heart size={12} className="text-white fill-white" />
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-ink dark:text-white leading-tight">
              {game.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6 sticky top-6">
              {/* Cover Image */}
              <div className="aspect-[3/4] w-full rounded-lg overflow-hidden mb-6 shadow-lg">
                <img
                  src={game.cover}
                  alt={game.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                {/* Playtime */}
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-neon" />
                    游戏时长
                  </div>
                  <div className="text-sm font-bold text-ink dark:text-white">
                    {formatPlaytime(game.playtime)}
                  </div>
                </div>

                {/* Score */}
                {game.score !== undefined && game.score !== null && (
                  <div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Star size={14} className="text-neon" />
                      我的评分
                    </div>
                    <div className="text-2xl font-black text-neon">
                      {game.score}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {game.achievementsTotal > 0 && (
                  <div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Trophy size={14} className="text-neon" />
                      成就进度
                    </div>
                    <div className="text-sm font-bold text-ink dark:text-white">
                      {game.achievementsUnlocked} / {game.achievementsTotal}
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon to-neon-dark transition-all duration-500"
                        style={{ width: `${achievementRate}%` }}
                      />
                    </div>
                    <div className="text-xs font-mono text-gray-400 mt-1">{achievementRate}%</div>
                  </div>
                )}

                {/* Start Date */}
                {game.startDate && (
                  <div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-neon" />
                      开始日期
                    </div>
                    <div className="text-sm text-ink dark:text-white font-mono">
                      {formatDate(game.startDate)}
                    </div>
                  </div>
                )}

                {/* Finish Date */}
                {game.finishDate && (
                  <div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-neon" />
                      完成日期
                    </div>
                    <div className="text-sm text-ink dark:text-white font-mono">
                      {formatDate(game.finishDate)}
                    </div>
                  </div>
                )}

                {/* Last Played */}
                {game.lastPlayed && (
                  <div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Gamepad2 size={14} className="text-neon" />
                      最后游玩
                    </div>
                    <div className="text-sm text-ink dark:text-white font-mono">
                      {formatDate(game.lastPlayed)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Info Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              {/* Developer & Publisher */}
              {(game.developer || game.publisher) && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                    <Building2 size={14} className="text-neon" />
                    开发 / 发行
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.developer && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                        {game.developer}
                      </span>
                    )}
                    {game.publisher && game.publisher !== game.developer && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                        {game.publisher}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Release Year */}
              {releaseYear && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                    <Calendar size={14} className="text-neon" />
                    发行年份
                  </div>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                    {releaseYear}
                  </span>
                </div>
              )}

              {/* Platform */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                  <Gamepad2 size={14} className="text-neon" />
                  平台
                </div>
                <span className="px-3 py-1 bg-neon/10 text-neon border border-neon/20 rounded text-xs font-mono">
                  {game.platform}
                </span>
                {game.platformId && (
                  <span className="text-xs font-mono text-gray-400">
                    ID: {game.platformId}
                  </span>
                )}
              </div>

              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                    <Tag size={14} className="text-neon" />
                    类型
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-neon/10 text-neon border border-neon/20 rounded text-xs font-mono hover:bg-neon/20 transition-colors cursor-pointer"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {game.description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-neon"></div>
                    <h3 className="text-lg font-bold text-ink dark:text-white">游戏简介</h3>
                  </div>
                  <p className="text-base leading-relaxed text-ink dark:text-gray-200 font-serif">
                    {game.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-pink-500"></div>
                    <h3 className="text-lg font-bold text-ink dark:text-white">我的标签</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-400/20 rounded-full text-xs font-mono hover:bg-pink-500/20 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Store Link */}
              {game.storeUrl && (
                <a
                  href={game.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 group inline-flex items-center gap-2 px-4 py-2 bg-neon hover:bg-neon/90 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-neon/30 hover:-translate-y-0.5"
                >
                  <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-mono text-sm font-bold">前往商店页面</span>
                </a>
              )}
            </div>

            {/* Notes */}
            {game.notes && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-neon"></div>
                  <h3 className="text-lg font-bold text-ink dark:text-white">个人备注</h3>
                </div>
                <p className="text-base leading-relaxed text-ink dark:text-gray-200 font-serif italic">
                  {game.notes}
                </p>
              </div>
            )}

            {/* Screenshots */}
            {game.screenshots && game.screenshots.length > 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={16} className="text-neon" />
                  <h3 className="text-lg font-bold text-ink dark:text-white">截图</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {game.screenshots.map((shot, idx) => (
                    <a
                      key={idx}
                      href={shot}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-[#050505] border border-gray-200 dark:border-white/10"
                      aria-label={`查看 ${game.title} 的第 ${idx + 1} 张截图`}
                    >
                      <img
                        src={shot}
                        alt={`${game.title} 截图 ${idx + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next Navigation */}
      <div className="mb-12">
        <PrevNextNavigation
          prev={prevGame ? { id: prevGame.id, title: prevGame.title, href: `/games/${prevGame.id}`, subtitle: getStatusLabel(prevGame.status) } : null}
          next={nextGame ? { id: nextGame.id, title: nextGame.title, href: `/games/${nextGame.id}`, subtitle: getStatusLabel(nextGame.status) } : null}
        />
      </div>

      {/* Back to Top */}
      <div className="text-center mb-8">
        <BackToTop color="neon" />
      </div>
    </div>
  );
};

export default GameDetail;
