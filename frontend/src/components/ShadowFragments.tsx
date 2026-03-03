import React from 'react';
import { DIARY_ENTRIES } from '../constants';
import { usePageCopy } from '../hooks/useSiteConfig';

const ShadowFragments: React.FC = () => {
  const pageCopy = usePageCopy();

  return (
    <section id="thoughts" className="py-24 border-t border-ink/10 dark:border-white/10 relative overflow-hidden w-full">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
         <span className="font-serif text-[10rem] leading-none select-none text-ink dark:text-white">{pageCopy.thoughtsBgText}</span>
      </div>

      <div className="w-full px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-sans font-bold text-ink dark:text-white">
            {pageCopy.thoughtsTitle}
          </h2>
          <span className="font-mono text-xs tracking-widest text-gray-500">
             // {pageCopy.thoughtsLabel}
          </span>
        </div>

        {/* Horizontal Scroll Container for Vertical Cards */}
        <div className="flex overflow-x-auto pb-12 gap-10 scrollbar-hide snap-x snap-mandatory px-4 py-4">
          {DIARY_ENTRIES.slice(0, 5).map((entry, index) => (
<div
              key={entry.id}
              className={`
                flex-shrink-0 snap-center bg-white dark:bg-[#111]
                shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none
                w-48 h-[450px] p-6 relative group
                transition-all duration-500 ease-out
                border border-transparent dark:border-white/5
                hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] dark:hover:border-neon/30
                /* Tilt Effect: Default tilted, Hover straightens */
                hover:rotate-0 hover:-translate-y-4 hover:z-10 hover:scale-105
                ${index % 2 === 0 ? '-rotate-2' : 'rotate-1'}
              `}
            >
              {/* Top Neon Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-neon opacity-50 group-hover:opacity-100 transition-opacity"></div>

              {/* Date */}
              <div className="font-mono text-[10px] text-gray-400 absolute top-6 left-4 border-b border-gray-200 dark:border-white/10 pb-2 w-8 group-hover:text-neon transition-colors">
                {entry.date}
              </div>

{/* Vertical Text Content */}
              <div className="h-full w-full flex flex-row-reverse justify-center pt-16 pb-24">
                <p
                  className={`vertical-text font-serif text-base text-ink dark:text-gray-300 leading-loose tracking-widest border-l border-gray-100 dark:border-white/10 pl-4 h-full overflow-hidden text-ellipsis transition-all duration-500 ease-out group-hover:text-black dark:group-hover:text-white group-hover:border-neon/30 group-hover:scale-110 group-hover:rotate-0 ${index % 2 === 0 ? '-rotate-6' : 'rotate-6'}`}
                >
                  {entry.content}
                </p>
              </div>

              {/* CYBER SEAL (The Stamp from Screenshot) */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className={`
                    relative w-14 h-14 flex items-center justify-center
                    transition-transform duration-500 ease-spring
                    /* Seal Tilt: More aggressive tilt than the card */
                    rotate-12 group-hover:rotate-0 group-hover:scale-110
                  `}>
                      {/* Outer Box (Thick) */}
                      <div className="absolute inset-0 border-2 border-neon opacity-80 group-hover:opacity-100 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all"></div>
                      
                      {/* Inner Box (Thin/Offset) */}
                      <div className="absolute inset-1 border border-neon opacity-40 group-hover:inset-1.5 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      {/* Text */}
                      <span className="font-mono text-[10px] font-black text-neon uppercase tracking-wider relative z-10 group-hover:text-ink dark:group-hover:text-white bg-white/0 dark:bg-black/0 px-1">
                          {entry.stamp}
                      </span>

                      {/* Hover Glow Background */}
                      <div className="absolute inset-0 bg-neon opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShadowFragments;