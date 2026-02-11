import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LONG_FORM_DIARIES } from '../constants';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Heart,
  CloudSun,
  Share2,
  Link2,
  Home
} from 'lucide-react';

const DiaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const diary = LONG_FORM_DIARIES.find(d => d.id === id);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: diary!.title,
      text: `心情: ${diary!.mood} | 天气: ${diary!.weather}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Share canceled');
      }
    }

    navigator.clipboard.writeText(window.location.href);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

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

  if (!diary) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
          <p className="font-mono text-gray-500 mb-6">日记不存在</p>
          <Link
            to="/diary"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            返回日记列表
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = LONG_FORM_DIARIES.findIndex(d => d.id === id);
  const prevDiary = currentIndex > 0 ? LONG_FORM_DIARIES[currentIndex - 1] : null;
  const nextDiary = currentIndex < LONG_FORM_DIARIES.length - 1 ? LONG_FORM_DIARIES[currentIndex + 1] : null;

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-neon shadow-[0_0_10px_rgba(244,114,182,0.5)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ink via-pink-400 to-ink dark:from-white dark:via-pink-400 dark:to-white opacity-50"></div>

      <div className="mb-6 relative z-10">
        <nav className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 inline-block backdrop-blur-sm">
          <Link to="/" className="hover:text-neon dark:hover:text-neon transition-colors flex items-center gap-1">
            <Home size={14} />
            首页
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link to="/diary" className="hover:text-neon dark:hover:text-neon transition-colors">
            日记
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-ink dark:text-gray-200 truncate max-w-xs">
            {diary.title}
          </span>
        </nav>
      </div>

      <div className="mb-8 relative">
        <div className="absolute -top-4 -left-4 w-32 h-32 opacity-10 dark:opacity-5 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-slow">
            <defs>
              <radialGradient id="diaryGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#diaryGradient)" className="text-ink dark:text-white"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-ink dark:text-white"/>
          </svg>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Link
            to="/diary"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="group-hover:underline decoration-neon/50">返回日记列表</span>
          </Link>
          <div className="font-mono text-xs text-pink-400 border border-pink-400 px-3 py-1.5 bg-pink-400/5 hover:bg-pink-400/10 transition-colors">
            📝 DIARY #{diary.id}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink dark:text-white leading-tight mb-2 relative group">
          {diary.title}
          <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-pink-400 to-transparent group-hover:w-full transition-all duration-500"></div>
        </h1>

        <p className="text-xs font-mono text-gray-400 mb-6">{diary.subtitle}</p>

        <div className="relative h-px mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-white/10 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400/20 via-neon/20 to-pink-400/20"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-pink-400 transition-colors">
              <span className="text-2xl">{diary.mood}</span>
              <span className="text-sm">心情</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors">
              <span className="text-2xl">{diary.weather}</span>
              <span className="text-sm">天气</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors">
              <MapPin size={16} className="text-neon" />
              <span className="text-sm">{diary.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors">
              <Heart size={16} className="text-pink-400" />
              <span className="text-sm">{diary.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group"
          >
            <Share2 size={16} className="group-hover:scale-110 transition-transform" />
            分享
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setShowCopyAlert(true);
              setTimeout(() => setShowCopyAlert(false), 2000);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group relative"
          >
            <Link2 size={16} className="group-hover:scale-110 transition-transform" />
            复制链接
            {showCopyAlert && (
              <div className="absolute top-full mt-2 left-0 bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 rounded text-xs font-mono shadow-lg animate-in fade-in slide-in-from-top-2 z-50 whitespace-nowrap">
                链接已复制到剪贴板
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="mb-8 relative overflow-hidden rounded-xl">
        <div className="w-full aspect-video bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
          <img
            src={diary.coverImage}
            alt="Diary Cover"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="absolute top-4 right-4">
          <div className="w-16 h-16 border-4 border-white/20 flex items-center justify-center rotate-12 hover:rotate-0 transition-all duration-500 backdrop-blur-sm rounded-lg bg-black/20">
            <span className="font-black text-white/50 text-xs tracking-widest">COVER</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-8 md:p-12 relative overflow-hidden" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0,0 L100,0 L100,100 L0,0 Z" fill="currentColor" className="text-ink dark:text-white"/>
              </svg>
            </div>

            <div className="relative z-10">
              <ReactMarkdown
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink dark:text-white mt-8 mb-4 pb-2 border-b-2 border-pink-400/30 scroll-mt-24">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-white/10 scroll-mt-24">
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-ink dark:text-white mt-5 mb-2 scroll-mt-24">
                      {children}
                    </h3>
                  ),
                  p: ({children}) => (
                    <p className="text-lg leading-relaxed text-ink dark:text-gray-200 mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({children}) => (
                    <ul className="space-y-2 mb-4 ml-6 list-disc marker:text-pink-400">
                      {children}
                    </ul>
                  ),
                  ol: ({children}) => (
                    <ol className="space-y-2 mb-4 ml-6 list-decimal marker:text-pink-400">
                      {children}
                    </ol>
                  ),
                  li: ({children}) => (
                    <li className="text-base leading-relaxed text-ink dark:text-gray-200 pl-2">
                      {children}
                    </li>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-pink-400 pl-4 py-2 my-4 bg-pink-50/50 dark:bg-white/5 italic text-gray-700 dark:text-gray-300">
                      {children}
                    </blockquote>
                  ),
                  strong: ({children}) => (
                    <strong className="font-bold text-ink dark:text-white">
                      {children}
                    </strong>
                  ),
                }}
              >
                {diary.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12 relative">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="w-6 h-6 bg-pink-400/10 rounded-full flex items-center justify-center text-pink-400">🏷️</span>
            标签
          </span>
          {diary.tags.map((tag, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full text-sm font-mono hover:border-pink-400 hover:text-pink-400 dark:hover:border-pink-400 dark:hover:text-pink-400 hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(244,114,182,0.2)] transition-all cursor-pointer group"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prevDiary && (
            <Link
              to={`/diary/${prevDiary.id}`}
              className="group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-pink-400 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-pink-400/10 transition-colors">
                  <ArrowLeft size={20} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-pink-400 transition-colors">上一篇</p>
                  <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:translate-x-1 transition-transform">{prevDiary.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{prevDiary.date}</p>
                </div>
              </div>
            </Link>
          )}

          {nextDiary && (
            <Link
              to={`/diary/${nextDiary.id}`}
              className={`group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-pink-400 hover:shadow-lg transition-all duration-300 overflow-hidden ${!prevDiary ? 'md:col-start-2' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-pink-400 transition-colors">下一篇</p>
                  <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:-translate-x-1 transition-transform">{nextDiary.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{nextDiary.date}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-pink-400/10 transition-colors">
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="text-center mb-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group px-8 py-3 bg-ink dark:bg-white text-white dark:text-ink font-mono text-sm rounded hover:bg-pink-400 dark:hover:bg-pink-400 dark:hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,114,182,0.3)] dark:hover:shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:-translate-y-1"
        >
          ↑ 返回顶部
        </button>
      </div>
    </div>
  );
};

export default DiaryDetail;
