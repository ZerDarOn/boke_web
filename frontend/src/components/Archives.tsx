import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { ArrowRight, LayoutList, LayoutGrid } from 'lucide-react';

const Archives: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <section id="articles" className="py-12 w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b-2 border-ink dark:border-white pb-4 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
            <h2 className="text-4xl md:text-6xl font-serif font-black text-ink dark:text-white tracking-tight leading-none">
            LATEST WRITINGS
            </h2>
            <span className="font-mono text-neon font-bold text-lg">
            / BLOG
            </span>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'bg-gray-100 text-gray-400 hover:text-ink dark:bg-white/10 dark:hover:text-white'}`}
            >
                <LayoutList size={18} />
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'bg-gray-100 text-gray-400 hover:text-ink dark:bg-white/10 dark:hover:text-white'}`}
            >
                <LayoutGrid size={18} />
            </button>
        </div>
      </div>

      <div className={viewMode === 'list' ? "grid grid-cols-1 gap-12" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {BLOG_POSTS.slice(0, 6).map((post) => (
          <Link
            key={post.id}
            to={`/posts/${post.id}`}
            className={`
                group relative transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-xl border border-transparent hover:border-ink/10 dark:border-white/5 dark:hover:border-neon/50
                ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 items-start p-6' : 'flex flex-col p-6 h-full'}
            `}
          >
            {/* Date Badge */}
            <div className={`flex-shrink-0 ${viewMode === 'list' ? 'md:w-28 pt-1' : 'mb-4'}`}>
               <span className="font-mono text-sm text-gray-400 block mb-1">{post.date}</span>
               <span className="font-mono text-xs text-neon border border-neon px-2 py-0.5 inline-block bg-neon/5">
                 {post.category}
               </span>
            </div>

            {/* Content Card */}
            <div className="flex-1 flex flex-col h-full">
               <h3 className="text-2xl font-bold font-sans text-ink dark:text-white group-hover:text-neon-dark dark:group-hover:text-neon transition-colors mb-3">
                   {post.title}
               </h3>
               <p className="font-serif text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4 flex-1">
                   {post.excerpt}
               </p>
               <button className="flex items-center gap-2 font-mono text-xs font-bold text-ink dark:text-gray-200 group-hover:text-neon transition-colors tracking-widest uppercase mt-auto">
                  Read <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>

            {/* Decorative Ink Splat / Glow in Dark Mode */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 rounded-bl-3xl transition-opacity -z-10"></div>
          </Link>
        ))}
      </div>
      
      <div className="mt-16 text-center">
          <Link to="/posts" className="px-8 py-3 border border-ink dark:border-white/50 text-ink dark:text-white bg-transparent hover:bg-ink hover:text-white dark:hover:bg-white dark:hover:text-ink transition-all duration-300 font-mono tracking-widest text-sm inline-block">
             VIEW ALL ARCHIVES
          </Link>
       </div>
    </section>
  );
};

export default Archives;