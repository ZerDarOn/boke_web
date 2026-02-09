import React, { useState } from 'react';
import { BLOG_POSTS } from '../constants';
import { ArrowRight, List, GitCommit, Folder, Hash } from 'lucide-react';

const TimelineArchives: React.FC = () => {
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // Group posts by year
  const postsByYear = BLOG_POSTS.reduce((acc, post) => {
    const year = post.date.split('.')[0] || '2024';
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {} as Record<string, typeof BLOG_POSTS>);

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  // Visual helper for random-ish category colors
  const getCategoryColor = (cat: string) => {
      if (cat.includes('TECH') || cat.includes('ENGINEERING')) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      if (cat.includes('LIFE') || cat.includes('LIFESTYLE')) return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
  };

  return (
    <div className="w-full min-h-screen py-12 relative bg-white dark:bg-[#050505] overflow-hidden transition-colors duration-300">
      
      {/* View Toggle (Floating Top Right) */}
      <div className="fixed top-24 right-8 z-50 bg-white dark:bg-ink border border-gray-200 dark:border-white/10 rounded p-1 flex gap-1 shadow-lg">
          <button 
              onClick={() => setViewMode('timeline')}
              title="Timeline View"
              className={`p-2 rounded transition-colors ${viewMode === 'timeline' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-gray-400 hover:text-ink dark:hover:text-white'}`}
          >
              <GitCommit size={18} className="rotate-90" />
          </button>
          <button 
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-gray-400 hover:text-ink dark:hover:text-white'}`}
          >
              <List size={18} />
          </button>
      </div>

      {viewMode === 'timeline' ? (
        <>
            {/* 1. Central Kinetic Ink Slash (Timeline) */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[2px] bg-ink dark:bg-white/20 transform md:-translate-x-1/2 overflow-visible pointer-events-none">
                {/* Glowing Aura */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-neon opacity-20 blur-[1px]"></div>
                {/* Moving Pulse */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-32 bg-gradient-to-b from-transparent via-neon to-transparent animate-pulse opacity-80"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 relative z-10">
                
                {/* Title Block with Mask to hide line */}
                <div className="text-center mb-20 relative">
                    <div className="inline-block relative z-20 bg-white dark:bg-[#050505] px-8 py-4">
                        <h2 className="text-4xl md:text-6xl font-black font-sans text-ink dark:text-white tracking-tighter">
                            CHRONICLES
                        </h2>
                    </div>
                </div>

                {years.map((year) => (
                <div key={year} className="relative mb-24">
                    
                    {/* 2. Year Markers (Watermarks) */}
                    <div className="absolute -top-16 md:top-1/2 md:-translate-y-1/2 left-0 w-full text-center pointer-events-none select-none z-0">
                        <span className="text-[6rem] md:text-[12rem] font-black text-gray-100 dark:text-white/5 opacity-60 leading-none tracking-tighter">
                            {year}
                        </span>
                    </div>

                    <div className="relative z-10 flex flex-col gap-12">
                        {postsByYear[year].map((post, index) => {
                            const isLeft = index % 2 === 0;
                            return (
                                <div 
                                    key={post.id}
                                    className={`flex flex-col md:flex-row items-center w-full group ${isLeft ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Empty space for opposite side */}
                                    <div className="hidden md:block md:w-1/2"></div>
                                    
                                    {/* Connector Node on Timeline */}
                                    <div className="absolute left-[19px] md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-white dark:bg-neutral-900 border-2 border-ink dark:border-white group-hover:border-neon rotate-45 transition-colors duration-300 z-20 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-ink dark:bg-white group-hover:bg-neon transition-colors duration-300"></div>
                                    </div>

                                    {/* Content Node */}
                                    <div className={`
                                        w-full md:w-1/2 pl-12 md:pl-0 
                                        ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}
                                    `}>
                                        <div className="relative bg-white dark:bg-white/5 p-6 border-l-2 md:border-l-0 border-gray-100 dark:border-white/10 hover:border-l-4 hover:border-neon transition-all duration-300 group-hover:-translate-y-1 rounded-sm shadow-sm">
                                            
                                            {/* 4. Interactivity: Ink Slash Hover Effect */}
                                            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-neon transition-all duration-500 group-hover:w-full"></div>
                                            <div className="absolute top-0 right-0 w-[2px] h-0 bg-ink dark:bg-white transition-all duration-500 group-hover:h-full delay-100 opacity-10"></div>
                                            
                                            <div className={`flex flex-col gap-2 ${isLeft ? 'md:items-end' : 'md:items-start'}`}>
                                                <span className="font-mono text-xs text-gray-400 flex items-center gap-2">
                                                    {isLeft && <span className="hidden md:inline">{post.date}</span>}
                                                    <span className="px-1.5 py-0.5 border border-gray-200 dark:border-white/20 text-[10px] uppercase text-gray-500 dark:text-gray-400 group-hover:border-neon group-hover:text-neon transition-colors">
                                                        {post.category}
                                                    </span>
                                                    {!isLeft && <span>{post.date}</span>}
                                                    {/* Mobile date fallback */}
                                                    <span className="md:hidden">{post.date}</span>
                                                </span>

                                                <h3 className="text-xl md:text-2xl font-bold font-sans text-ink dark:text-white group-hover:text-neon-dark transition-colors cursor-pointer">
                                                    {post.title}
                                                </h3>
                                                
                                                <p className="font-serif text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {post.excerpt}
                                                </p>

                                                <button className="mt-2 text-xs font-mono font-bold text-ink dark:text-gray-200 uppercase flex items-center gap-1 group/btn hover:text-neon transition-colors">
                                                    Read File <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
                ))}
            </div>
        </>
      ) : (
        /* List View Mode (Styled Blocks) */
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
             <div className="flex items-center gap-4 mb-16">
                 <div className="p-3 bg-ink dark:bg-white text-white dark:text-ink rounded-lg">
                     <Folder size={24} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black font-sans text-ink dark:text-white">ARCHIVE.INDEX</h2>
                    <p className="font-mono text-sm text-gray-400">Total {BLOG_POSTS.length} records found.</p>
                 </div>
             </div>
             
             <div className="flex flex-col gap-12">
                 {years.map(year => (
                     <div key={year} className="bg-gray-50 dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
                         
                         {/* Large Year Watermark */}
                         <div className="absolute top-0 right-4 text-8xl font-black text-gray-200 dark:text-white/5 opacity-40 select-none">
                             {year}
                         </div>

                         {/* Header */}
                         <div className="flex items-center gap-3 mb-8 relative z-10">
                             <div className="w-1.5 h-6 bg-neon rounded-full"></div>
                             <h3 className="text-2xl font-bold font-mono text-ink dark:text-white tracking-wider">{year}</h3>
                             <span className="px-2 py-0.5 bg-white dark:bg-white/10 rounded text-xs font-mono text-gray-500">
                                 {postsByYear[year].length} ITEMS
                             </span>
                         </div>

                         {/* List of Posts */}
                         <div className="grid grid-cols-1 gap-3 relative z-10">
                             {postsByYear[year].map((post) => (
                                 <div 
                                    key={post.id}
                                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] border border-transparent hover:border-neon/50 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer"
                                 >
                                     <div className="flex items-center gap-4">
                                         {/* Category Tag */}
                                         <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold
                                            ${getCategoryColor(post.category)}
                                         `}>
                                             {post.category.substring(0, 2)}
                                         </div>
                                         
                                         <div>
                                            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 group-hover:text-neon transition-colors">
                                                {post.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 md:hidden">
                                                <span className="text-[10px] font-mono text-gray-400">{post.date}</span>
                                            </div>
                                         </div>
                                     </div>

                                     {/* Desktop Metadata */}
                                     <div className="hidden md:flex items-center gap-6">
                                         <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${getCategoryColor(post.category)}`}>
                                             {post.category}
                                         </span>
                                         <span className="font-mono text-sm text-gray-400 group-hover:text-ink dark:group-hover:text-white transition-colors">
                                             {post.date}
                                         </span>
                                         <ArrowRight size={14} className="text-gray-300 -ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      )}

      {/* End of Timeline */}
      <div className="relative flex justify-center mt-12 pb-12">
             <div className="bg-ink dark:bg-white text-white dark:text-ink px-4 py-1 font-mono text-xs tracking-[0.3em] uppercase rounded-sm">
                 End of Records
             </div>
      </div>
    </div>
  );
};

export default TimelineArchives;