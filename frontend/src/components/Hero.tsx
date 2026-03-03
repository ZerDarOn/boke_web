import React, { useEffect, useContext, useState, useMemo } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroContext } from './Layout';

interface HeroProps {
  scrollY: number;
  lang: 'EN' | 'ZH';
}

interface HeroContentItem {
  id: string;
  name: string;
  enabled: boolean;
  contentZH: {
    tag: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    quote: string;
  };
  contentEN: {
    tag: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    quote: string;
  };
}

const defaultHeroContent: HeroContentItem[] = [
  {
    id: 'ink',
    name: 'Ink Slash',
    enabled: true,
    contentZH: {
      tag: '数字编年史(2025)',
      titleStart: '以',
      titleHighlight: '代码',
      titleEnd: '书写',
      quote: '"在数字虚空中记录灵魂的回响。"'
    },
    contentEN: {
      tag: 'DIGITAL.CHRONICLES(2025)',
      titleStart: 'WRITTEN IN',
      titleHighlight: 'CODE',
      titleEnd: '',
      quote: '"Documenting the ghost in the shell, one line at a time."'
    }
  },
  {
    id: 'grid',
    name: 'Cyber Grid',
    enabled: true,
    contentZH: {
      tag: '系统重构中...',
      titleStart: '矩阵',
      titleHighlight: '重载',
      titleEnd: '',
      quote: '"系统即是现实，逻辑构建真理。"'
    },
    contentEN: {
      tag: 'SYSTEM.REFACTORING...',
      titleStart: 'MATRIX',
      titleHighlight: 'RELOADED',
      titleEnd: '',
      quote: '"The system is the reality. Logic builds truth."'
    }
  },
  {
    id: 'nebula',
    name: 'Void Nebula',
    enabled: true,
    contentZH: {
      tag: '星海漫游指南',
      titleStart: '凝视',
      titleHighlight: '深渊',
      titleEnd: '',
      quote: '"在数据洪流中寻找秩序的星光。"'
    },
    contentEN: {
      tag: 'GUIDE.TO.GALAXY',
      titleStart: 'VOID',
      titleHighlight: 'GAZING',
      titleEnd: '',
      quote: '"Staring into the abyss of data, finding order in chaos."'
    }
  }
];

const Hero: React.FC<HeroProps> = ({ scrollY, lang }) => {
  // 使用 Context 获取/设置背景索引，实现跨页面同步
  const { bgIndex, setBgIndex } = useContext(HeroContext);
  const [heroConfig, setHeroConfig] = useState<HeroContentItem[]>(defaultHeroContent);

  // 从 localStorage 读取 Hero 配置
  useEffect(() => {
    const saved = localStorage.getItem('site_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.heroBackgrounds && Array.isArray(parsed.heroBackgrounds)) {
          setHeroConfig(parsed.heroBackgrounds);
        }
      } catch (e) {
        console.error('Failed to parse hero config:', e);
      }
    }
  }, []);

  // 过滤出启用的背景
  const enabledContent = useMemo(() => {
    return heroConfig.filter(item => item.enabled !== false);
  }, [heroConfig]);

  // 如果没有启用的背景，使用默认值
  const heroContent = enabledContent.length > 0 ? enabledContent : defaultHeroContent;

  // 安全获取当前内容
  const safeIndex = bgIndex % heroContent.length;
  const currentItem = heroContent[safeIndex];
  const currentContent = lang === 'ZH' ? currentItem.contentZH : currentItem.contentEN;

  const nextBg = () => setBgIndex((prev) => (prev + 1) % heroContent.length);
  const prevBg = () => setBgIndex((prev) => (prev - 1 + heroContent.length) % heroContent.length);

  // Auto-play Background Switch - 使用 ref 避免依赖问题
  useEffect(() => {
    const timer = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % heroContent.length);
    }, 6000); // Switch every 6 seconds

    return () => clearInterval(timer);
  }, [setBgIndex, heroContent.length]);

  const progress = Math.min(scrollY / window.innerHeight, 1);
  const scale = Math.max(0.8, 1 - progress * 0.2); 
  const opacity = Math.max(0, 1 - progress * 1.2); 
  const translateY = scrollY * 0.5; 

  return (
    <section className="fixed top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center z-0 bg-paper transition-colors duration-500">
      
      {/* Inline Styles for Wave Animation */}
      <style>{`
        @keyframes drift {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .wave-anim-slow {
          animation: drift 15s linear infinite;
        }
        .wave-anim-fast {
          animation: drift 10s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        .grid-anim {
          animation: grid-move 2s linear infinite;
        }
      `}</style>

      {/* --- BACKGROUND VARIANT 1: INK SLASH --- */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${bgIndex === 0 ? 'opacity-100' : 'opacity-0'}`}
      >
          <div 
            className="absolute top-[-10%] bottom-[-10%] left-[-50%] right-[-50%] bg-ink transform origin-center transition-transform duration-75 ease-out shadow-2xl"
            style={{ 
              transform: `skewY(-12deg) scale(${scale})`,
              borderRadius: `${progress * 50}px` 
            }}
          >
            <div className="absolute inset-0 bg-dragon-scales opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-neon shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
            <div className="absolute bottom-0 right-0 w-full h-2 bg-neon shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
          </div>
      </div>

      {/* --- BACKGROUND VARIANT 2: CYBER GRID --- */}
      <div 
        className={`absolute inset-0 bg-[#050505] transition-opacity duration-700 ${bgIndex === 1 ? 'opacity-100' : 'opacity-0'}`}
      >
          {/* Perspective Grid */}
          <div className="absolute inset-0 opacity-30"
               style={{
                   backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
                   backgroundSize: '40px 40px',
                   transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)',
                   transformOrigin: 'top center'
               }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]"></div>
          
          {/* Floating Particles */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* --- BACKGROUND VARIANT 3: VOID NEBULA --- */}
      <div 
        className={`absolute inset-0 bg-[#020617] transition-opacity duration-700 ${bgIndex === 2 ? 'opacity-100' : 'opacity-0'}`}
      >
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black"></div>
           <div className="absolute top-0 left-0 w-full h-full opacity-40">
               <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-purple-900/30 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
               <div className="absolute bottom-[20%] right-[20%] w-[35vw] h-[35vw] bg-indigo-900/30 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '1.5s' }}></div>
               <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent rotate-45"></div>
           </div>
           {/* Stars */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
      </div>


      {/* --- CONTROLS (Clickable Layer) --- */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-40 flex flex-col justify-between pb-8 px-4 md:px-12">
          {/* Side Arrows */}
          <div className="flex-1 flex items-center justify-between w-full pointer-events-auto">
              <button 
                onClick={prevBg}
                className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-neon transition-all duration-300 group"
              >
                  <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={nextBg}
                className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-neon transition-all duration-300 group"
              >
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>

          {/* Bottom Dots */}
          <div className="flex justify-center gap-4 pointer-events-auto mt-auto">
              {heroContent.map((bg, idx) => (
                  <button
                    key={bg.id}
                    onClick={() => setBgIndex(idx)}
                    className={`
                        w-3 h-3 rounded-full border border-white/20 transition-all duration-300
                        ${bgIndex === idx ? 'bg-neon scale-125 border-neon shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-transparent hover:bg-white/20'}
                    `}
                    title={bg.name}
                  />
              ))}
          </div>
      </div>


      {/* --- HERO TEXT CONTENT --- */}
      <div 
        className="relative z-10 text-center select-none px-4 transition-all duration-75 ease-out w-full"
        style={{ 
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity: opacity 
        }}
      >
        <h2 className="font-mono text-neon text-sm md:text-lg tracking-[0.5em] mb-4 opacity-80 drop-shadow-lg uppercase">
          {currentContent.tag}
        </h2>
        
        <h1 className="font-sans font-black text-5xl md:text-8xl lg:text-9xl text-paper tracking-tighter mix-blend-difference relative drop-shadow-2xl leading-tight">
          {currentContent.titleStart}
          <br />
          {/* Apply Secondary Color Gradient Here */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-secondary filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            {currentContent.titleHighlight}
          </span>
          {currentContent.titleEnd && <span className="text-paper ml-4">{currentContent.titleEnd}</span>}
        </h1>

        <p className="mt-8 font-serif text-gray-400 text-lg md:text-xl max-w-lg mx-auto italic drop-shadow-md">
          {currentContent.quote}
        </p>
      </div>

      {/* Dynamic Transparent Wave Effect at Bottom (Only for Ink Mode) */}
      <div 
        className={`absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 transition-opacity duration-300 ${bgIndex === 0 ? 'opacity-100' : 'opacity-0'}`}
        style={{ opacity: Math.min(opacity, bgIndex === 0 ? 1 : 0) }} 
      >
        <div className="relative w-full h-[100px] md:h-[150px]">
           <svg className="absolute bottom-0 left-0 w-[200%] h-full wave-anim-slow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 120" preserveAspectRatio="none">
              <path 
                  d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
                  transform="translate(0, 50)"
                  fill="#ffffff" 
                  fillOpacity="0.1" 
              ></path>
              <path 
                  d="M1200,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C1638.64,32.43,1712.34,53.67,1783,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C2189.49,25,2313-14.29,2400,52.47V0Z" 
                  transform="translate(0, 50)"
                  fill="#ffffff" 
                  fillOpacity="0.1" 
              ></path>
           </svg>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-10 w-full flex justify-center items-center gap-2 text-ink/50 dark:text-white/50 animate-bounce z-30"
        style={{ opacity: Math.max(0, 1 - scrollY / 100) }}
      >
        <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs tracking-widest">READ MORE</span>
            <ArrowDown size={16} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
