import React from 'react';
import { useDiaryList } from '../hooks/queries/diary';
import { usePageCopy } from '../hooks/useSiteConfig';
import { PageLoader } from './DataState';
import SectionHeading from './SectionHeading';

const ShadowFragments: React.FC = () => {
  const pageCopy = usePageCopy();
  const { data: entries = [], isLoading: loading, error, refetch } = useDiaryList({ limit: 5, type: 'SHORT' });

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '.');
    } catch {
      return dateString;
    }
  };

  return (
    <section id="thoughts" className="relative w-full overflow-hidden py-16 md:py-28">
      
      {/* Background Decor */}
      <div className="pointer-events-none absolute right-0 top-14 opacity-[0.035] dark:opacity-[0.055]">
         <span className="select-none font-serif text-[9rem] font-black leading-none text-ink dark:text-white md:text-[14rem]">{pageCopy.thoughtsBgText}</span>
      </div>

      <div className="relative z-10 w-full">
        <SectionHeading
          index="02"
          eyebrow={`${pageCopy.thoughtsLabel} / 碎片`}
          title={pageCopy.thoughtsTitle}
          description="不够长到成为文章，却值得在某一天被重新想起。"
        />

        {/* Loading State */}
        {loading && <PageLoader className="py-20" />}

        {!loading && error && (
          <div className="mt-12 border border-red-900/20 bg-red-950/[0.04] px-6 py-10 text-center dark:border-red-300/15 dark:bg-red-300/[0.04]" role="alert">
            <p className="font-serif text-lg text-ink dark:text-paper">思绪暂时没有回应。</p>
            <button type="button" onClick={() => refetch()} className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-neon-dark underline underline-offset-4 dark:text-neon">重新连接</button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center border-y border-ink/10 py-20 text-stone-400 dark:border-white/10 dark:text-stone-500">
            <p className="font-serif text-lg">下一枚念头还在路上。</p>
          </div>
        )}

        {/* Horizontal Scroll Container for Vertical Cards */}
        {!loading && !error && entries.length > 0 && (
          <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-8 pr-6 scrollbar-hide md:gap-7">
            {entries.slice(0, 5).map((entry, index) => (
              <article
                key={entry.id}
                className={`
                  group relative h-[26rem] w-44 flex-shrink-0 snap-start overflow-hidden border border-ink/10 bg-white/65 p-5
                  shadow-[0_24px_70px_rgba(33,31,26,0.07)] backdrop-blur-sm transition-all duration-300
                  hover:-translate-y-2 hover:border-neon/50 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none md:w-48
                `}
              >
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-neon via-neon/20 to-transparent opacity-80" />

                {/* Date */}
                <div className="absolute left-5 top-5 font-mono text-[0.62rem] tracking-[0.18em] text-stone-500 transition-colors group-hover:text-neon-dark dark:group-hover:text-neon">
                  {String(index + 1).padStart(2, '0')} · {formatDate(entry.date)}
                </div>

                {/* Vertical Text Content */}
                <div className="flex h-full w-full flex-row-reverse justify-center pb-20 pt-14">
                  <p
                    className="vertical-text h-full overflow-hidden border-l border-ink/10 pl-4 font-serif text-base leading-loose tracking-widest text-ink transition-colors group-hover:border-neon/30 dark:border-white/10 dark:text-stone-300 dark:group-hover:text-white"
                  >
                    {entry.content}
                  </p>
                </div>

                {/* CYBER SEAL */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
                  <div className={`
                    relative w-14 h-14 flex items-center justify-center
                    rotate-6 transition-transform duration-300 group-hover:rotate-0
                  `}>
                    {/* Outer Box */}
                    <div className="absolute inset-0 border-2 border-neon opacity-70 transition-all group-hover:opacity-100"></div>
                    
                    {/* Inner Box */}
                    <div className="absolute inset-1 border border-neon opacity-40 group-hover:inset-1.5 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    {/* Text */}
                    <span className="font-mono text-[10px] font-black text-neon uppercase tracking-wider relative z-10 group-hover:text-ink dark:group-hover:text-white bg-white/0 dark:bg-black/0 px-1">
                      {entry.stamp}
                    </span>

                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 bg-neon opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShadowFragments;
