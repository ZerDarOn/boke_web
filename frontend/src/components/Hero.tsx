import React, { useEffect, useRef, useContext, useState, useMemo } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroContext } from './Layout';
import HeroCanvas from './HeroCanvas';
import type { HeroBackground } from '../lib/api';

interface HeroProps {
  lang: 'EN' | 'ZH';
  backgrounds?: HeroBackground[];
}

const defaultHeroContent: HeroBackground[] = [
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

const Hero: React.FC<HeroProps> = ({ lang, backgrounds }) => {
  // 使用 Context 获取/设置背景索引，实现跨页面同步
  const { bgIndex, setBgIndex } = useContext(HeroContext);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 过滤出启用的背景
  const enabledContent = useMemo(() => {
    return (backgrounds ?? defaultHeroContent).filter(item => item.enabled !== false);
  }, [backgrounds]);

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
    if (prefersReducedMotion || heroContent.length <= 1) return;
    const timer = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % heroContent.length);
    }, 6000); // Switch every 6 seconds

    return () => clearInterval(timer);
  }, [setBgIndex, heroContent.length, prefersReducedMotion]);

  const textRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // 视差与淡出直接操作 DOM（rAF 节流），避免把滚动位置提升到 React state 触发整页 re-render
  useEffect(() => {
    if (prefersReducedMotion) {
      if (textRef.current) {
        textRef.current.style.transform = '';
        textRef.current.style.opacity = '';
      }
      if (indicatorRef.current) indicatorRef.current.style.opacity = '';
      return;
    }

    let rafId: number | null = null;
    const update = () => {
      rafId = null;
      const sy = window.scrollY;
      const progress = Math.min(sy / window.innerHeight, 1);
      const scale = Math.max(0.8, 1 - progress * 0.2);
      const opacity = Math.max(0, 1 - progress * 1.2);
      const translateY = sy * 0.5;
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${translateY}px) scale(${scale})`;
        textRef.current.style.opacity = String(opacity);
      }
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = String(Math.max(0, 1 - sy / 100));
      }
    };
    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  return (
    <section className="fixed top-0 left-0 w-full h-[100svh] overflow-hidden flex items-center justify-center z-0 bg-[#05060a] transition-colors duration-500" aria-label="首页视觉导览">

      {/* 自定义图只负责底图；星空层始终叠在其上，保留 Hero 的动态辨识度。 */}
      {heroContent.map((item, idx) =>
        item.backgroundImage ? (
          <div
            key={item.id}
            className={`absolute inset-0 z-0 transition-opacity duration-700 motion-reduce:transition-none ${idx === safeIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90"
              style={{ backgroundImage: `url("${item.backgroundImage}")` }}
            />
            {/* 遮罩：统一到站点星空基调（#05060a），边缘晕染让封面融入星空、保证文字可读 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#05060a]/70 via-[#05060a]/30 to-[#05060a]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(5,6,10,0.72)_100%)]" />
          </div>
        ) : null
      )}

      {/* 减少动态时保留静态星图，不再把整片星空替换成纯渐变。 */}
      <HeroCanvas reducedMotion={prefersReducedMotion} />

      {/* --- CONTROLS (Clickable Layer) --- */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-40 flex flex-col justify-between pb-8 px-4 md:px-12">
          {/* Side Arrows */}
          <div className="flex-1 flex items-center justify-between w-full pointer-events-auto">
              <button 
                type="button"
                onClick={prevBg}
                className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-neon transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon motion-reduce:transition-none"
                aria-label="上一张首页背景"
              >
                  <ChevronLeft className="group-hover:-translate-x-1 transition-transform motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
              </button>
              
              <button 
                type="button"
                onClick={nextBg}
                className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-neon transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon motion-reduce:transition-none"
                aria-label="下一张首页背景"
              >
                  <ChevronRight className="group-hover:translate-x-1 transition-transform motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
              </button>
          </div>

          {/* Bottom Dots */}
          <div className="flex justify-center gap-4 pointer-events-auto mt-auto">
              {heroContent.map((bg, idx) => (
                  <button
                    type="button"
                    key={bg.id}
                    onClick={() => setBgIndex(idx)}
                    className={`
                        w-3 h-3 rounded-full border border-white/20 transition-all duration-300
                        ${bgIndex === idx ? 'bg-neon scale-125 border-neon' : 'bg-transparent hover:bg-white/20'}
                    `}
                    title={bg.name}
                    aria-label={`切换到首页背景：${bg.name}`}
                    aria-current={safeIndex === idx ? 'true' : undefined}
                  />
              ))}
          </div>
      </div>


      {/* --- HERO TEXT CONTENT --- */}
      <div
        ref={textRef}
        className="relative z-10 mx-auto w-full max-w-6xl select-none px-16 text-center transition-all duration-75 ease-out sm:px-20 md:px-24"
      >
        <h2 className="font-serif text-neon text-xs sm:text-sm md:text-lg tracking-[0.2em] md:tracking-[0.35em] mb-5 opacity-90 drop-shadow-lg">
          {currentContent.tag}
        </h2>

        <h1 className="relative break-words font-serif text-4xl font-bold leading-tight text-white drop-shadow-2xl sm:text-5xl md:text-8xl lg:text-9xl">
          {currentContent.titleStart}
          <br />
          {/* Apply Secondary Color Gradient Here */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-secondary">
            {currentContent.titleHighlight}
          </span>
          {currentContent.titleEnd && <span className="text-paper ml-4">{currentContent.titleEnd}</span>}
        </h1>

        <p className="mx-auto mt-6 max-w-lg break-words font-serif text-base italic text-gray-400 drop-shadow-md md:mt-8 md:text-xl">
          {currentContent.quote}
        </p>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={indicatorRef}
        className="absolute bottom-10 w-full flex justify-center items-center gap-2 text-ink/50 dark:text-white/50 animate-bounce z-30 motion-reduce:animate-none"
        aria-hidden="true"
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
