import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePostsList } from '../hooks/queries/posts';
import { ArrowUpRight, LayoutList, LayoutGrid } from 'lucide-react';
import { PageLoader } from './DataState';
import SectionHeading from './SectionHeading';

const Archives: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { data: posts = [], isLoading: loading, error, refetch } = usePostsList({ limit: 6 });

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '.');
    } catch {
      return dateString;
    }
  };

  return (
    <section id="articles" className="relative w-full py-16 md:py-28">
      <SectionHeading
        index="01"
        eyebrow="Archive / 近期文字"
        title="最近写下的"
        description="技术、创作与生活留下的可检索切片。比起追逐更新频率，我更在意每一篇是否值得再次打开。"
        action={(
          <div className="inline-flex border border-ink/15 bg-white/55 p-1 dark:border-white/15 dark:bg-white/[0.03]" aria-label="文章布局">
            <button 
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="列表视图"
                aria-pressed={viewMode === 'list'}
                className={`grid size-10 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon ${viewMode === 'list' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-stone-500 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white'}`}
            >
                <LayoutList size={17} strokeWidth={1.7} />
            </button>
            <button 
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="网格视图"
                aria-pressed={viewMode === 'grid'}
                className={`grid size-10 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon ${viewMode === 'grid' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-stone-500 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white'}`}
            >
                <LayoutGrid size={17} strokeWidth={1.7} />
            </button>
          </div>
        )}
      />

      {/* Loading State */}
      {loading && <PageLoader className="py-24" />}

      {!loading && error && (
        <div className="mt-12 border border-red-900/20 bg-red-950/[0.04] px-6 py-10 text-center dark:border-red-300/15 dark:bg-red-300/[0.04]" role="alert">
          <p className="font-serif text-lg text-ink dark:text-paper">暂时无法取回文章。</p>
          <button type="button" onClick={() => refetch()} className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-neon-dark underline decoration-neon/40 underline-offset-4 dark:text-neon">
            重新连接
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="mt-12 border-y border-ink/10 py-16 text-center dark:border-white/10">
          <p className="font-serif text-xl text-ink dark:text-paper">新的文字正在酝酿。</p>
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-stone-500">The next entry is taking shape</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && posts.length > 0 && (
        <div className={viewMode === 'list' ? "mt-12 grid grid-cols-1 border-t border-ink/10 dark:border-white/10" : "mt-12 grid grid-cols-1 gap-px bg-ink/10 dark:bg-white/10 md:grid-cols-2"}>
          {posts.slice(0, 6).map((post) => (
          <Link
            key={post.id}
            to={`/posts/${post.slug}`}
            className={`
                group relative transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon
                ${viewMode === 'list' ? 'grid grid-cols-1 gap-5 border-b border-ink/10 py-7 dark:border-white/10 md:grid-cols-[8rem_minmax(0,1fr)_2rem] md:items-start md:px-4 hover:bg-white/55 dark:hover:bg-white/[0.035]' : 'flex min-h-72 flex-col bg-paper px-7 py-8 hover:bg-white dark:bg-[#0b0d0c] dark:hover:bg-[#101310] md:p-10'}
            `}
          >
            {/* Date Badge */}
            <div className={`flex-shrink-0 ${viewMode === 'list' ? 'pt-1' : 'mb-8'}`}>
               <time dateTime={post.date} className="mb-2 block font-mono text-[0.68rem] tracking-[0.16em] text-stone-500 tabular-nums">{formatDate(post.date)}</time>
               <span className="inline-block border-l-2 border-neon pl-2 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-neon-dark dark:text-neon">
                 {post.category}
               </span>
            </div>

            {/* Content Card */}
            <div className="flex-1 flex flex-col h-full">
               <h3 className="mb-3 font-serif text-2xl font-bold leading-tight tracking-[-0.025em] text-ink transition-colors group-hover:text-neon-dark dark:text-white dark:group-hover:text-neon md:text-3xl">
                   {post.title}
               </h3>
               <p className="mb-4 max-w-[62ch] flex-1 font-serif text-sm leading-7 text-stone-600 text-pretty dark:text-stone-400">
                   {post.excerpt}
               </p>
               {viewMode === 'grid' && (
                 <span className="mt-auto flex items-center justify-end text-stone-400 transition-colors group-hover:text-neon-dark dark:group-hover:text-neon" aria-hidden="true">
                   <ArrowUpRight size={20} strokeWidth={1.5} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                 </span>
               )}
            </div>
            {viewMode === 'list' && <ArrowUpRight aria-hidden="true" size={20} strokeWidth={1.5} className="mt-1 hidden text-stone-400 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-neon-dark dark:group-hover:text-neon md:block" />}
          </Link>
        ))}
        </div>
      )}
      
      <div className="mt-10 flex justify-end">
          <Link to="/posts" className="group inline-flex min-h-11 items-center gap-3 border-b border-ink pb-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:border-neon hover:text-neon-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon dark:border-white/60 dark:text-white dark:hover:border-neon dark:hover:text-neon">
             查看全部文章
             <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
       </div>
    </section>
  );
};

export default Archives;
