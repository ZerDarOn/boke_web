/**
 * ============================================================================
 * 主布局组件 (Main Layout Component)
 * ============================================================================
 * 
 * 【移动端兼容性说明】
 * 本文件实现了响应式布局，针对桌面端和移动端采用不同的布局策略：
 * 
 * 桌面端（>=1024px）：
 * - 左侧边栏（Sidebar）+ 主内容区 + 右侧边栏（RightSidebar）
 * - 三列并排布局
 * 
 * 移动端（<1024px）：
 * - 仅显示主内容区（单列布局）
 * - 左右边栏隐藏（hidden lg:block）
 * - MobileBottomBar 组件在主内容底部显示，提供折叠式边栏内容访问
 * 
 * 【相关文件】
 * - MobileBottomBar.tsx: 移动端底部边栏组件
 * - index.css: 移动端触摸优化样式
 * - Navigation.tsx: 移动端汉堡菜单
 * 
 * @created 移动端兼容性优化
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Hero from './Hero';
import MobileBottomBar from './MobileBottomBar';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { useLayoutSearch } from '../hooks/queries/search';

interface LayoutProps {
  children?: React.ReactNode;
}

// Hero 状态 Context，用于跨页面同步
export const HeroContext = React.createContext<{
  bgIndex: number;
  setBgIndex: React.Dispatch<React.SetStateAction<number>>;
}>({
  bgIndex: 0,
  setBgIndex: () => {},
});

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { lang, setLang, t } = useLang();
  const [scrollY, setScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryHue, setPrimaryHue] = useState(150);
  const [secondaryHue, setSecondaryHue] = useState(260);
  const config = useSiteConfig();
  
  // Hero 背景索引 - 全局状态，所有页面共享
  const [bgIndex, setBgIndex] = useState(0);
  
  const location = useLocation();

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const {
    data: searchResults = {
      posts: [],
      projects: [],
      diaries: [],
      announcements: [],
      anime: [],
      gallery: [],
    },
    isFetching: isSearching,
    error: searchQueryError,
    isFetched: hasSearched,
    refetch: refetchSearch,
  } = useLayoutSearch(debouncedSearchQuery);
  const searchError = searchQueryError?.message ?? null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      setShowScrollTop(currentScroll > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC 键监听 - 关闭搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // 主题切换
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 动态主题色
  useEffect(() => {
    const primaryVal = `hsl(${primaryHue}, 100%, 40%)`;
    const secondaryVal = `hsl(${secondaryHue}, 90%, 65%)`;
    document.documentElement.style.setProperty('--color-neon', primaryVal);
    document.documentElement.style.setProperty('--color-secondary', secondaryVal);
  }, [primaryHue, secondaryHue]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'ZH' ? 'EN' : 'ZH');
  const resetColor = () => {
    setPrimaryHue(150);
    setSecondaryHue(260);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSearch = () => setIsSearchOpen(true);

  return (
    <HeroContext.Provider value={{ bgIndex, setBgIndex }}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#050505] text-ink dark:text-paper font-sans selection:bg-neon selection:text-white transition-colors duration-300">
        <Navigation 
          isRightSidebarOpen={isRightSidebarOpen}
          toggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          theme={theme}
          toggleTheme={toggleTheme}
          lang={lang}
          toggleLang={toggleLang}
          openSearch={openSearch}
          primaryHue={primaryHue}
          setPrimaryHue={setPrimaryHue}
          secondaryHue={secondaryHue}
          setSecondaryHue={setSecondaryHue}
          resetColor={resetColor}
          blogName={config.blogName}
        />

        {/* 搜索弹窗 */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex justify-center items-start pt-32 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 dark:border-neon/30 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
              {/* 头部输入区域 */}
              <div className="flex items-center px-4 py-4 border-b border-white/10 relative">
                <Search size={20} className="text-neon mr-3 animate-pulse" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.SEARCH_PLACEHOLDER}
                  className="bg-transparent text-lg text-white outline-none flex-1 placeholder-gray-600 font-sans tracking-wide"
                />
                <button
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent opacity-50"></div>
              </div>

               {/* 搜索结果 */}
               <div className="min-h-[200px] max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                 {searchError ? (
                   <div className="h-40 flex flex-col items-center justify-center text-red-400 space-y-3">
                     <AlertCircle size={32} />
                     <p className="font-mono text-sm tracking-widest">SEARCH.ERROR</p>
                     <p className="text-xs">{searchError}</p>
                     <button
                       onClick={() => refetchSearch()}
                       className="text-xs text-neon hover:text-neon/80 underline"
                     >
                       重试
                     </button>
                   </div>
                 ) : !searchQuery ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-600 space-y-2">
                    <p className="font-mono text-sm tracking-widest text-neon/50">SYSTEM.READY</p>
                    <p className="text-xs">Type to query neural network...</p>
                  </div>
                ) : isSearching ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-600 space-y-3">
                    <Loader2 size={24} className="text-neon animate-spin" />
                    <p className="font-mono text-xs tracking-widest">SEARCHING...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {searchResults.posts.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-neon uppercase tracking-widest mb-2 px-2 border-l-2 border-neon/50">ARCHIVES ({searchResults.posts.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.posts.map((post: any) => (
                            <Link key={post.id} to={`/posts/${post.slug || post.id}`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans">{post.title}</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{post.category}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 px-2 border-l-2 border-secondary/50">PROJECTS ({searchResults.projects.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.projects.map((proj: any) => (
                            <Link key={proj.id} to={`/projects/${proj.slug || proj.id}`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans">{proj.name || proj.title}</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{proj.status}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.announcements.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 px-2 border-l-2 border-purple-400/50">ANNOUNCEMENTS ({searchResults.announcements.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.announcements.map((ann: any) => (
                            <Link key={ann.id} to={`/announcement/${ann.id}`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans">{ann.title}</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{new Date(ann.date).toLocaleDateString()}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.diaries.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 px-2 border-l-2 border-blue-400/50">DIARY ({searchResults.diaries.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.diaries.map((diary: any) => (
                            <Link key={diary.id} to={`/diary/${diary.id}`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans truncate">{diary.title || diary.content?.substring(0, 50)}...</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{new Date(diary.date).toLocaleDateString()}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.anime.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2 px-2 border-l-2 border-pink-400/50">ANIME ({searchResults.anime.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.anime.map((anime: any) => (
                            <Link key={anime.id} to={`/anime/${anime.id}`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans">{anime.title}</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{anime.status}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.gallery.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 px-2 border-l-2 border-orange-400/50">GALLERY ({searchResults.gallery.length})</h3>
                        <div className="grid gap-2">
                          {searchResults.gallery.map((img: any) => (
                            <Link key={img.id} to={img.album?.id ? `/gallery/${img.album.id}` : '/gallery'} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                              <span className="text-gray-300 group-hover:text-white font-sans">{img.title}</span>
                              <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{img.tags?.[0] || 'PHOTO'}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasSearched && !isSearching && 
                     searchResults.posts.length === 0 && 
                      searchResults.projects.length === 0 &&
                      searchResults.announcements.length === 0 &&
                      searchResults.diaries.length === 0 &&
                      searchResults.anime.length === 0 &&
                      searchResults.gallery.length === 0 && (
                       <div className="text-center text-gray-500 py-8 font-mono text-xs space-y-2">
                         <p className="text-neon">NO.RESULTS.FOUND</p>
                         <p className="text-gray-600">Try different keywords</p>
                       </div>
                     )}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="px-4 py-2 bg-black/40 border-t border-white/5 text-[10px] text-gray-600 flex justify-between items-center font-mono">
                <span>VER 2.5.0-RC</span>
                <div className="flex gap-4">
                  <span>[ESC] CLOSE</span>
                  <span>[ENTER] SELECT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero 区域 - 所有页面都有 */}
        <Hero scrollY={scrollY} lang={lang} />

        {/* 主内容区域 - 从 Hero 下方开始 */}
        <div className="relative z-10 mt-[100vh] bg-transparent min-h-screen">
          <div className="max-w-[1600px] mx-auto flex items-start pt-6 md:pt-12 pb-16 md:pb-24 px-3 md:px-6 gap-4 md:gap-6 lg:gap-8 transition-all duration-300">
            {/* 左侧边栏 - 仅桌面端显示 */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            <main className={`flex-1 min-w-0 flex flex-col gap-4 md:gap-6 transition-all duration-300`}>
              <div className="bg-paper/80 dark:bg-[#0a0a0a]/90 backdrop-blur-md rounded-xl p-3 md:p-4 lg:p-6 border border-white/50 dark:border-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10 min-h-[600px]">
                {children || <Outlet />}
              </div>
              
              <MobileBottomBar />
            </main>

            <div className={`hidden xl:block ${isRightSidebarOpen ? '' : 'hidden'}`}>
              <RightSidebar />
            </div>
          </div>

          <footer className="bg-ink text-white py-12 text-center relative overflow-hidden mt-12 dark:border-t dark:border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon to-transparent opacity-50"></div>
            <p className="font-mono text-xs text-gray-500 tracking-widest">
              {config.blogName} © 2024 // ALL RIGHTS RESERVED
            </p>
            <p className="mt-2 font-serif text-gray-700 italic">
              "{config.pageCopy.footerQuote}"
            </p>
          </footer>
        </div>

        {/* 回到顶部按钮 */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-4 md:bottom-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-ink border-2 border-neon text-ink dark:text-paper flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-500 hover:bg-neon hover:text-white z-50 rounded-full ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          <span className="font-serif font-black text-lg md:text-xl">↑</span>
        </button>
      </div>
    </HeroContext.Provider>
  );
};

export default Layout;
