import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, Palette, SidebarClose, SidebarOpen, Globe, Settings, ChevronDown, 
  Github, Video, Book, Camera, Heart, Network, Code, Clock, UserCheck, RotateCcw, Moon, Sun, BookOpen, Gamepad2,
  Menu, X, Check, Music2
} from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { THEME_PRESETS, presetPrimaryColor, presetSecondaryColor } from '../lib/themePresets';

interface NavigationProps {
  toggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: 'EN' | 'ZH';
  toggleLang: () => void;
  openSearch: () => void;
  primaryHue: number;
  setPrimaryHue: (hue: number) => void;
  secondaryHue: number;
  setSecondaryHue: (hue: number) => void;
  resetColor: () => void;
  blogName?: string;
}

// 菜单项到路由路径的映射
const viewToPath: Record<string, string> = {
  'home': '/',
  'archives': '/archives',
  'dashboard': '/dashboard',
  'about': '/about',
  'relationships': '/network',
  'anime': '/anime',
  'diary': '/diary',
  'gallery': '/gallery',
  'projects': '/projects',
  'timeline': '/timeline',
  'skills': '/skills',
};

const Navigation: React.FC<NavigationProps> = ({ 
    toggleRightSidebar, isRightSidebarOpen,
    blogName = 'INK.SPIRIT',
    theme, toggleTheme, lang, toggleLang, openSearch,
    primaryHue, setPrimaryHue, secondaryHue, setSecondaryHue, resetColor
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const t = TRANSLATIONS[lang];

  // Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'b', 'a'];
    let currentIndex = 0;
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的键盘事件
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const now = Date.now();
      // 超过 2 秒重置序列
      if (now - lastKeyTime > 2000) {
        currentIndex = 0;
      }
      lastKeyTime = now;
      
      const key = e.key.toLowerCase();
      const expected = konamiCode[currentIndex].toLowerCase();

      if (key === expected) {
        currentIndex++;
        if (currentIndex === konamiCode.length) {
          setShowSettings(prev => !prev);
          currentIndex = 0;
        }
      } else if (e.key === 'ArrowUp' && currentIndex === 0) {
        // 第一个键正确，开始计数
        currentIndex = 1;
      } else {
        currentIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 根据当前路径获取激活的菜单项
  const getActiveItem = () => {
    const path = location.pathname;
    if (path === '/') return t.HOME;
    if (path === '/archives') return t.ARCHIVES;
    if (path === '/dashboard') return t.DASHBOARD;
    if (path === '/about' || path === '/network') return t.ABOUT;
    if (path === '/posts' || path === '/anime' || path === '/games' || path === '/diary' || path === '/gallery' || path === '/music') return t.MINE;
    if (path === '/projects' || path === '/timeline' || path === '/skills') return t.OTHERS;
    return t.HOME;
  };

  const activeItem = getActiveItem();

  const uiText = {
      themeColor: lang === 'EN' ? 'Theme Colors' : '主题色调',
      primary: lang === 'EN' ? 'Primary (Neon)' : '主色 (霓虹)',
      secondary: lang === 'EN' ? 'Secondary (Aux)' : '辅色 (点缀)',
      appearance: lang === 'EN' ? 'Appearance' : '外观模式',
      reset: lang === 'EN' ? 'Reset' : '重置'
  };

  const menuItems = [
    { label: t.HOME, id: 'home', path: '/' },
    { label: t.ARCHIVES, id: 'archives', path: '/archives' }, 
    { 
        label: t.LINKS, 
        id: 'links', 
        hasDropdown: true,
        dropdownItems: [
            { label: 'GitHub', icon: Github, link: 'https://github.com' },
            { label: 'Bilibili', icon: Video, link: 'https://bilibili.com' }
        ]
    },
    { 
        label: t.MINE, 
        id: 'mine', 
        hasDropdown: true,
        dropdownItems: [
            { label: t.POSTS, icon: BookOpen, path: '/posts' },
            { label: lang === 'EN' ? 'Anime' : '追番', icon: Heart, path: '/anime' },
            { label: lang === 'EN' ? 'Games' : '游戏', icon: Gamepad2, path: '/games' },
            { label: lang === 'EN' ? 'Diary' : '日记', icon: Book, path: '/diary' },
            { label: lang === 'EN' ? 'Gallery' : '相册', icon: Camera, path: '/gallery' },
            { label: lang === 'EN' ? 'Music' : '音乐馆', icon: Music2, path: '/music' }
        ]
    },
    { 
        label: t.ABOUT, 
        id: 'about', 
        hasDropdown: true,
        dropdownItems: [
            { label: lang === 'EN' ? 'System' : '系统', icon: UserCheck, path: '/about' },
            { label: lang === 'EN' ? 'Network' : '关系', icon: Network, path: '/network' }
        ]
    },
    { label: t.DASHBOARD, id: 'dashboard', path: '/dashboard' },
    { 
        label: t.OTHERS, 
        id: 'other', 
        hasDropdown: true,
        dropdownItems: [
            { label: lang === 'EN' ? 'Skills' : '技能', icon: Code, path: '/skills' },
            { label: lang === 'EN' ? 'Projects' : '项目', icon: Code, path: '/projects' },
            { label: lang === 'EN' ? 'Timeline' : '时间', icon: Clock, path: '/timeline' }
        ]
    },
  ];

  // Logic to move the "Energy Bar"
  useEffect(() => {
    const targetLabel = hoveredItem || activeItem;
    const targetId = menuItems.find(item => item.label === targetLabel || item.id === targetLabel)?.id;
    
    if (navRef.current && targetId) {
        const element = navRef.current.querySelector(`[data-id="${targetId}"]`) as HTMLElement;
        if (element) {
            setIndicatorStyle({
                left: element.offsetLeft,
                width: element.offsetWidth,
                opacity: 1
            });
        }
    }
  }, [hoveredItem, activeItem, lang]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#1a1b26]/80 backdrop-blur-md text-gray-300 h-16 shadow-lg transition-all duration-300 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 h-full flex justify-between items-center">
        
        {/* Left: Branding */}
        <Link 
            to="/"
            className="flex-shrink-0 flex items-center font-bold text-white tracking-widest text-lg md:text-xl md:mr-12 cursor-pointer group"
        >
          {blogName.includes('.') ? (
            <>
              <span className="text-neon transition-colors duration-300">{blogName.split('.')[0]}</span>
              .{blogName.split('.').slice(1).join('.')}
            </>
          ) : (
            <span className="text-neon transition-colors duration-300">{blogName}</span>
          )}
        </Link>

        {/* Center: Main Navigation */}
        <div className="hidden lg:flex items-center h-full relative" ref={navRef}>
            {/* The Floating Energy Bar */}
            <div 
                className="absolute bottom-0 h-[2px] bg-neon transition-all duration-300 ease-out z-10"
                style={{ 
                    left: `${indicatorStyle.left}px`, 
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.opacity
                }}
            >
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-8 h-[1px] bg-neon rotate-12 opacity-50"></div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-8 h-[1px] bg-neon -rotate-12 opacity-50"></div>
            </div>

            <div className="flex items-stretch h-full">
                {menuItems.map((item) => (
                    <div 
                        key={item.id}
                        data-id={item.id}
                        className="relative h-full flex items-center"
                        onMouseEnter={() => setHoveredItem(item.label)} 
                        onMouseLeave={() => setHoveredItem(null)} 
                    >
                        {item.path ? (
                            <Link 
                                to={item.path}
                                className={`relative px-5 h-full flex items-center justify-center text-sm font-sans tracking-wide transition-colors duration-300 group hover:text-white ${activeItem === item.label ? 'text-white' : ''}`}
                            >
                                <span className="relative z-10 flex items-center gap-1">
                                    {item.label}
                                </span>
                            </Link>
                        ) : (
                            <a 
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className={`relative px-5 h-full flex items-center justify-center text-sm font-sans tracking-wide transition-colors duration-300 group hover:text-white ${activeItem === item.label ? 'text-white' : ''}`}
                            >
                                <span className="relative z-10 flex items-center gap-1">
                                    {item.label}
                                    {item.hasDropdown && <ChevronDown size={10} className="opacity-60" />}
                                </span>
                            </a>
                        )}

                        {/* Dropdown Menu */}
                        {item.hasDropdown && hoveredItem === item.label && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-48 bg-[#1a1b26]/90 backdrop-blur-md border border-white/10 shadow-xl rounded-b-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                                {item.dropdownItems?.map((subItem, idx) => (
                                    ('link' in subItem && subItem.link) ? (
                                        <a
                                            key={idx}
                                            href={subItem.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-neon"
                                        >
                                            {subItem.icon && <subItem.icon size={12} />}
                                            {subItem.label}
                                        </a>
                                    ) : (
                                        <Link
                                            key={idx}
                                            to={'path' in subItem ? subItem.path || '/' : '/'}
                                            className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-neon"
                                            onClick={() => setHoveredItem(null)}
                                        >
                                            {subItem.icon && <subItem.icon size={12} />}
                                            {subItem.label}
                                        </Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Right: Utility Icons */}
        <div className="flex items-center gap-1 md:gap-2 pl-4 relative">
            <button
                onClick={openSearch}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title="Search"
            >
                <Search size={18} />
            </button>
            
            <button onClick={toggleLang} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-1 font-mono text-[10px]" title="Language">
                <Globe size={18} /> {lang}
            </button>
            
            {/* Color Palette Popover */}
            <div className="relative">
                <button 
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} 
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" 
                    title="Theme"
                >
                    <Palette size={18} className={isColorPickerOpen ? 'text-neon' : ''} />
                </button>
                
                {isColorPickerOpen && (
                    <div className="absolute top-full right-0 mt-4 w-72 bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 border-l-2 border-neon pl-2">
                                <h4 className="text-white font-bold text-sm">{uiText.themeColor}</h4>
                            </div>
                            <button 
                                onClick={resetColor}
                                className="bg-white/5 hover:bg-white/10 p-1.5 rounded transition-colors text-neon" 
                                title={uiText.reset}
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>

                        {/* 预设主题 */}
                        <div className="mb-5">
                            <label className="text-[10px] font-mono text-gray-400 mb-2 block">{lang === 'EN' ? 'PRESETS' : '预设风格'}</label>
                            <div className="grid grid-cols-6 gap-2">
                                {THEME_PRESETS.map((p) => {
                                    const active = primaryHue === p.primaryHue && secondaryHue === p.secondaryHue;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => { setPrimaryHue(p.primaryHue); setSecondaryHue(p.secondaryHue); }}
                                            title={p.name}
                                            className={`relative h-8 rounded-md overflow-hidden border transition-all ${active ? 'border-white scale-110' : 'border-white/10 hover:border-white/40'}`}
                                            style={{ background: `linear-gradient(135deg, ${presetPrimaryColor(p)}, ${presetSecondaryColor(p)})` }}
                                        >
                                            {active && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <Check size={12} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Primary Hue Slider（微调） */}
                        <div className="mb-6">
                            <label className="text-[10px] font-mono text-gray-400 mb-2 block">{uiText.primary}</label>
                            <div className="w-full h-2 rounded-full mb-3 bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] relative"></div>
                            <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={primaryHue} 
                                onChange={(e) => setPrimaryHue(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                style={{ accentColor: 'var(--color-neon)' }}
                            />
                        </div>

                        {/* Secondary Hue Slider */}
                        <div className="mb-6">
                            <label className="text-[10px] font-mono text-gray-400 mb-2 block">{uiText.secondary}</label>
                            <div className="w-full h-2 rounded-full mb-3 bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] relative"></div>
                            <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={secondaryHue} 
                                onChange={(e) => setSecondaryHue(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                style={{ accentColor: 'var(--color-secondary)' }}
                            />
                        </div>

                        {/* Theme Toggle */}
                        <div className="pt-4 border-t border-white/10">
                            <button 
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded transition-colors"
                            >
                                <span className="text-xs text-gray-300">{uiText.appearance}</span>
                                {theme === 'light' ? (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <Sun size={14} /> <span className="text-[10px]">LIGHT</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Moon size={14} /> <span className="text-[10px]">DARK</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {showSettings && (
              <button 
                onClick={() => window.location.href = '/admin/settings'}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors animate-in fade-in zoom-in duration-200"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            )}

            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

            <button 
                onClick={toggleRightSidebar}
                className={`p-2 hover:bg-white/10 rounded-md transition-all duration-300 group ${!isRightSidebarOpen ? 'text-neon' : 'text-gray-400'}`}
            >
                {isRightSidebarOpen ? <SidebarClose size={18} className="group-hover:text-white" /> : <SidebarOpen size={18} />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-[#0a0a0a]/98 backdrop-blur-xl z-40 overflow-y-auto">
          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.path ? (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base rounded-lg transition-colors ${
                      activeItem === item.label 
                        ? 'text-neon bg-neon/10 border-l-2 border-neon' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div>
                    <div className="px-4 py-3 text-gray-500 text-sm font-mono uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.dropdownItems && (
                      <div className="pl-4 space-y-1">
                        {item.dropdownItems.map((subItem, idx) => (
                          ('link' in subItem && subItem.link) ? (
                            <a
                              key={idx}
                              href={subItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.icon && <subItem.icon size={16} />}
                              {subItem.label}
                            </a>
                          ) : (
                            <Link
                              key={idx}
                              to={'path' in subItem ? subItem.path || '/' : '/'}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.icon && <subItem.icon size={16} />}
                              {subItem.label}
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Mobile Settings */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-gray-400">{uiText.appearance}</span>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {theme === 'light' ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Sun size={16} /> <span className="text-xs">LIGHT</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Moon size={16} /> <span className="text-xs">DARK</span>
                    </div>
                  )}
                </button>
              </div>
              
              <div className="px-4">
                <label className="text-xs text-gray-500 mb-2 block">{lang === 'EN' ? 'Presets' : '预设风格'}</label>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {THEME_PRESETS.map((p) => {
                    const active = primaryHue === p.primaryHue && secondaryHue === p.secondaryHue;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setPrimaryHue(p.primaryHue); setSecondaryHue(p.secondaryHue); }}
                        title={p.name}
                        className={`relative h-8 rounded-md overflow-hidden border transition-all ${active ? 'border-white scale-110' : 'border-white/10'}`}
                        style={{ background: `linear-gradient(135deg, ${presetPrimaryColor(p)}, ${presetSecondaryColor(p)})` }}
                      >
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={12} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4">
                <label className="text-xs text-gray-500 mb-2 block">{uiText.primary}</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={primaryHue} 
                  onChange={(e) => setPrimaryHue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--color-neon)' }}
                />
              </div>
              
              <div className="px-4">
                <label className="text-xs text-gray-500 mb-2 block">{uiText.secondary}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={secondaryHue} 
                  onChange={(e) => setSecondaryHue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-gray-400">Language</span>
                <button 
                  onClick={toggleLang}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                >
                  <Globe size={16} /> {lang}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
