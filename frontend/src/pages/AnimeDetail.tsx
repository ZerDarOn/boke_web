import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SimpleComments from '../components/GiscusComments';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';
import PrevNextNavigation from '../components/PrevNextNavigation';
import { useAnimeItem, useAnimeList } from '../hooks/queries/anime';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Calendar,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  XCircle,
  Heart,
  HeartOff,
  Home,
  Clock,
  Film,
  ExternalLink
} from 'lucide-react';

const AnimeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: anime, isLoading: loading, error: queryError } = useAnimeItem(id);
  const { data: allAnime = [] } = useAnimeList();
  const error = queryError?.message ?? null;
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon"></div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
          <p className="font-mono text-gray-500 mb-6">{error || '动漫不存在'}</p>
          <Link
            to="/anime"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            返回追番列表
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allAnime.findIndex(a => a.id === id);
  const prevAnime = currentIndex > 0 ? allAnime[currentIndex - 1] : null;
  const nextAnime = currentIndex < allAnime.length - 1 ? allAnime[currentIndex + 1] : null;

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

  const progress = (anime.currentEp / anime.episodes) * 100;
  
  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-neon to-neon-dark shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="mb-6 relative z-10">
        <BreadcrumbNav items={[
          { label: '追番', href: '/anime' },
          { label: anime.title }
        ]} />
      </div>

      <div className="mb-8">
        <Link
          to="/anime"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group mb-6"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="group-hover:underline decoration-neon/50">返回追番列表</span>
        </Link>
      </div>

       <div className="mb-8 relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
         <div
           className="w-full h-64 md:h-80 relative"
           style={{ backgroundColor: anime.bannerImage || anime.cover }}
         >
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-[#0a0a0a] dark:via-transparent dark:to-[#0a0a0a]"></div>

          <div className="absolute bottom-4 left-4 md:left-8 z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-mono text-xs bg-neon text-white px-2 py-1 rounded">
                {anime.type}
              </div>
              {anime.favorite && (
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <Heart size={12} className="text-white fill-white" />
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-ink dark:text-white leading-tight">
              {anime.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-1">
             <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6 sticky top-6">
               <div className="aspect-[2/3] w-full rounded-lg overflow-hidden mb-6 shadow-lg">
                 <div
                   className="w-full h-full"
                   style={{ backgroundColor: anime.cover }}
                 />
               </div>

              <div className="space-y-4">
                 <div>
                   <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                     <Clock size={14} className="text-neon" />
                     我的进度
                   </div>
                   <div className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
                     {anime.currentEp} / {anime.episodes} 集
                   </div>
                   <div className="mt-2 h-2 w-full bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                     <div
                       className="h-full bg-gradient-to-r from-neon to-neon-dark transition-all duration-500"
                       style={{ width: `${progress}%` }}
                     />
                   </div>
                 </div>

                 <div>
                   <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                     <Star size={14} className="text-neon" />
                     我的评分
                   </div>
                   <div className="flex items-center gap-2">
                     {anime.score ? (
                       <div className="text-2xl font-black text-neon">
                         {anime.score}
                       </div>
                     ) : (
                       <div className="text-sm text-gray-400 font-mono">未评分</div>
                     )}
                   </div>
                 </div>

                 <div>
                   <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                     <PlayCircle size={14} className="text-neon" />
                     状态
                   </div>
                   <div className="flex items-center gap-2">
                     {getStatusIcon(anime.status)}
                     <span className="text-sm font-bold text-ink dark:text-white">
                       {getStatusLabel(anime.status)}
                     </span>
                   </div>
                 </div>

                 {anime.startDate && (
                   <div>
                     <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                       <Calendar size={14} className="text-neon" />
                       开始日期
                     </div>
                     <div className="text-sm text-ink dark:text-white font-mono">
                       {formatDate(anime.startDate)}
                     </div>
                   </div>
                 )}

                 {anime.finishDate && (
                   <div>
                     <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                       <Calendar size={14} className="text-neon" />
                       完成日期
                     </div>
                     <div className="text-sm text-ink dark:text-white font-mono">
                       {formatDate(anime.finishDate)}
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                  <Film size={14} className="text-neon" />
                  制作
                </div>
                <div className="flex flex-wrap gap-2">
                  {anime.studios.map((studio, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded text-xs font-mono"
                    >
                      {studio}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                  <Star size={14} className="text-neon" />
                  类型
                </div>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-neon/10 text-neon border border-neon/20 rounded text-xs font-mono hover:bg-neon/20 transition-colors cursor-pointer"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-neon"></div>
                  <h3 className="text-lg font-bold text-ink dark:text-white">剧情简介</h3>
                </div>
                <p className="text-base leading-relaxed text-ink dark:text-gray-200 font-serif">
                  {anime.synopsis}
                </p>
              </div>

              {anime.tags && anime.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-pink-500"></div>
                    <h3 className="text-lg font-bold text-ink dark:text-white">我的标签</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {anime.tags.map((tag, idx) => (
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

              {anime.bilibiliUrl && (
                <a
                  href={anime.bilibiliUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 group flex items-center gap-2 px-4 py-2 bg-[#00A1D6] hover:bg-[#00A1D6]/90 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#00A1D6]/30 hover:-translate-y-0.5"
                >
                  <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-mono text-sm font-bold">在 bilibili 观看</span>
                </a>
              )}
            </div>

            {anime.notes && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-neon"></div>
                  <h3 className="text-lg font-bold text-ink dark:text-white">个人备注</h3>
                </div>
                <p className="text-base leading-relaxed text-ink dark:text-gray-200 font-serif italic">
                  {anime.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white">
          评论
        </h3>
        <SimpleComments theme={theme} />
      </div>

       <div className="mb-12">
         <PrevNextNavigation
           prev={prevAnime ? { id: prevAnime.id, title: prevAnime.title, href: `/anime/${prevAnime.id}`, subtitle: prevAnime.status } : null}
           next={nextAnime ? { id: nextAnime.id, title: nextAnime.title, href: `/anime/${nextAnime.id}`, subtitle: nextAnime.status } : null}
         />
       </div>

      <div className="text-center mb-8">
        <BackToTop color="neon" />
      </div>
    </div>
  );
};

export default AnimeDetail;
