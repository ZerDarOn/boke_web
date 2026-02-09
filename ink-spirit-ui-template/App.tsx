import React, { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Archives from './components/Archives';
import ShadowFragments from './components/ShadowFragments';
import Arsenal from './components/Arsenal';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import AboutFileExplorer from './components/AboutFileExplorer';
import RelationshipNetwork from './components/RelationshipNetwork';
import TimelineArchives from './components/TimelineArchives';
import SystemDashboard from './components/SystemDashboard';
import MineAnime from './components/MineAnime';
import MineDiary from './components/MineDiary';
import MineGallery from './components/MineGallery';
import PageProjects from './components/PageProjects';
import PageTimeline from './components/PageTimeline';
import PageSkills from './components/PageSkills';
import { Search, X } from 'lucide-react';
import { BLOG_POSTS, PROJECTS, TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('home'); 
  
  // Global States
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'EN' | 'ZH'>('ZH');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Color State (Hue value 0-360)
  // Default Emerald Green (150)
  const [primaryHue, setPrimaryHue] = useState(150);
  // Default Violet (260) - "The other color"
  const [secondaryHue, setSecondaryHue] = useState(260); 

  // Translations
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      setShowScrollTop(currentScroll > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  // Color Change Effect
  useEffect(() => {
      const primaryVal = `hsl(${primaryHue}, 100%, 40%)`; 
      const secondaryVal = `hsl(${secondaryHue}, 90%, 65%)`;
      
      document.documentElement.style.setProperty('--color-neon', primaryVal);
      document.documentElement.style.setProperty('--color-secondary', secondaryVal);
  }, [primaryHue, secondaryHue]);

  // Auto-scroll effect for non-home views
  useEffect(() => {
    if (currentView !== 'home') {
        const targetScroll = window.innerHeight - 100;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'ZH' ? 'EN' : 'ZH');
  const resetColor = () => {
      setPrimaryHue(150);
      setSecondaryHue(260);
  };

  // Search Logic (Simple Filter)
  const filteredPosts = BLOG_POSTS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = PROJECTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render content based on current view
  const renderMainContent = () => {
      switch (currentView) {
          case 'archives': return <div className="animate-in fade-in duration-500"><TimelineArchives /></div>;
          case 'dashboard': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ {t.DASHBOARD}<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><SystemDashboard /></div>;
          case 'about': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ {t.ABOUT}.SYSTEM<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><AboutFileExplorer /></div>;
          case 'relationships': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ SOCIAL.NETWORK_MAP<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><RelationshipNetwork /></div>;
          case 'anime': return <div className="animate-in fade-in duration-500"><MineAnime /></div>;
          case 'diary': return <div className="animate-in fade-in duration-500"><MineDiary /></div>;
          case 'gallery': return <div className="animate-in fade-in duration-500"><MineGallery /></div>;
          case 'projects': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ {t.PROJECT_ARSENAL}<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><PageProjects /></div>;
          case 'timeline': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ CHRONO.LOG<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><PageTimeline /></div>;
          case 'skills': return <div className="flex flex-col gap-6 animate-in fade-in duration-500"><h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">/ {t.SKILL_MATRIX}<div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div></h2><PageSkills /></div>;
          case 'home':
          default:
              return (
                  <>
                    <Archives />
                    <ShadowFragments />
                    <Arsenal />
                    <Profile />
                  </>
              );
      }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#050505] text-ink dark:text-paper font-sans selection:bg-neon selection:text-white transition-colors duration-300">
      <Navigation 
        isRightSidebarOpen={isRightSidebarOpen} 
        toggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
        onNavigate={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        toggleLang={toggleLang}
        openSearch={() => setIsSearchOpen(true)}
        primaryHue={primaryHue}
        setPrimaryHue={setPrimaryHue}
        secondaryHue={secondaryHue}
        setSecondaryHue={setSecondaryHue}
        resetColor={resetColor}
      />
      
      {/* Revised Search Modal (Cyber-Ink Style) */}
      {isSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex justify-center items-start pt-32 animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 dark:border-neon/30 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
                  
                  {/* Header Input Area */}
                  <div className="flex items-center px-4 py-4 border-b border-white/10 relative">
                      {/* Search Icon */}
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

                      {/* Scanning Line Effect */}
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent opacity-50"></div>
                  </div>

                  {/* Body Content */}
                  <div className="min-h-[200px] max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                      {!searchQuery ? (
                          <div className="h-40 flex flex-col items-center justify-center text-gray-600 space-y-2">
                              <p className="font-mono text-sm tracking-widest text-neon/50">SYSTEM.READY</p>
                              <p className="text-xs">Type to query the neural network...</p>
                          </div>
                      ) : (
                          <div className="space-y-6">
                             {/* Results List */}
                             {filteredPosts.length > 0 && (
                                 <div>
                                     <h3 className="text-[10px] font-bold text-neon uppercase tracking-widest mb-2 px-2 border-l-2 border-neon/50">ARCHIVES ({filteredPosts.length})</h3>
                                     <div className="grid gap-2">
                                        {filteredPosts.map(post => (
                                            <div key={post.id} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                                                <span className="text-gray-300 group-hover:text-white font-sans">{post.title}</span>
                                                <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{post.category}</span>
                                            </div>
                                        ))}
                                     </div>
                                 </div>
                             )}
                             {filteredProjects.length > 0 && (
                                 <div>
                                     <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 px-2 border-l-2 border-secondary/50">PROJECTS ({filteredProjects.length})</h3>
                                     <div className="grid gap-2">
                                        {filteredProjects.map(proj => (
                                            <div key={proj.id} className="p-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                                                <span className="text-gray-300 group-hover:text-white font-sans">{proj.name}</span>
                                                <span className="text-[10px] text-gray-600 font-mono border border-gray-800 px-1 rounded">{proj.status}</span>
                                            </div>
                                        ))}
                                     </div>
                                 </div>
                             )}
                             {filteredPosts.length === 0 && filteredProjects.length === 0 && (
                                 <div className="text-center text-gray-500 py-8 font-mono text-xs">
                                     // ERROR: NO_MATCH_FOUND
                                 </div>
                             )}
                          </div>
                      )}
                  </div>
                  
                  {/* Footer Tip */}
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
      
      {/* 1. Fixed Hero Background (z-0) */}
      <Hero scrollY={scrollY} lang={lang} />

      {/* 2. Main Content Wrapper (z-10) */}
      <div className="relative z-10 mt-[100vh] bg-transparent min-h-screen">
        
        {/* Container for Layout */}
        <div className="max-w-[1600px] mx-auto flex items-start pt-12 pb-24 px-4 md:px-6 gap-6 lg:gap-8 transition-all duration-300">
          
          {/* Left Column: Fixed Width Sidebar */}
          <Sidebar />

          {/* Center Column: Main Feed */}
          <main className={`flex-1 min-w-0 flex flex-col gap-6 transition-all duration-300 ${isRightSidebarOpen ? '' : 'lg:mr-0'}`}>
             <div className="bg-paper/80 dark:bg-[#0a0a0a]/90 backdrop-blur-md rounded-xl p-0 lg:p-6 border border-white/50 dark:border-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10 min-h-[600px]">
                {renderMainContent()}
             </div>
          </main>

          {/* Right Column: Collapsible Sidebar */}
          {isRightSidebarOpen && <RightSidebar />}

        </div>

        {/* Footer */}
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

      {/* Floating Action Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-white dark:bg-ink border-2 border-neon text-ink dark:text-paper flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-500 hover:bg-neon hover:text-white z-50 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <span className="font-serif font-black text-xl">↑</span>
      </button>
    </div>
  );
};

export default App;