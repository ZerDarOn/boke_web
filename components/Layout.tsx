import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Hero from './Hero';
import { TRANSLATIONS } from '../constants';

interface LayoutProps {
  children?: React.ReactNode;
}

// Hero 状态 Context，用于跨页面同步
export const HeroContext = React.createContext<{
  bgIndex: number;
  setBgIndex: (index: number) => void;
}>({
  bgIndex: 0,
  setBgIndex: () => {},
});

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'EN' | 'ZH'>('ZH');
  const [primaryHue, setPrimaryHue] = useState(150);
  const [secondaryHue, setSecondaryHue] = useState(260);
  
  // Hero 背景索引 - 全局状态，所有页面共享
  const [bgIndex, setBgIndex] = useState(0);

  const location = useLocation();

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

  // 主题切换
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
          primaryHue={primaryHue}
          setPrimaryHue={setPrimaryHue}
          secondaryHue={secondaryHue}
          setSecondaryHue={setSecondaryHue}
          resetColor={resetColor}
        />

        {/* Hero 区域 - 所有页面都有 */}
        <Hero scrollY={scrollY} lang={lang} />

        {/* 主内容区域 - 从 Hero 下方开始 */}
        <div className="relative z-10 mt-[100vh] bg-transparent min-h-screen">
          <div className="max-w-[1600px] mx-auto flex items-start pt-12 pb-24 px-4 md:px-6 gap-6 lg:gap-8 transition-all duration-300">
            <Sidebar />

            <main className={`flex-1 min-w-0 flex flex-col gap-6 transition-all duration-300 ${isRightSidebarOpen ? '' : 'lg:mr-0'}`}>
              <div className="bg-paper/80 dark:bg-[#0a0a0a]/90 backdrop-blur-md rounded-xl p-0 lg:p-6 border border-white/50 dark:border-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10 min-h-[600px]">
                {children || <Outlet />}
              </div>
            </main>

            {isRightSidebarOpen && <RightSidebar />}
          </div>

          <footer className="bg-ink text-white py-12 text-center relative overflow-hidden mt-12 dark:border-t dark:border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon to-transparent opacity-50"></div>
            <p className="font-mono text-xs text-gray-500 tracking-widest">
              INK.SPIRIT © 2024 // ALL RIGHTS RESERVED
            </p>
            <p className="mt-2 font-serif text-gray-700 italic">
              "The code flows like wind, invisible yet mighty."
            </p>
          </footer>
        </div>

        {/* 回到顶部按钮 */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 w-12 h-12 bg-white dark:bg-ink border-2 border-neon text-ink dark:text-paper flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-500 hover:bg-neon hover:text-white z-50 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          <span className="font-serif font-black text-xl">↑</span>
        </button>
      </div>
    </HeroContext.Provider>
  );
};

export default Layout;
