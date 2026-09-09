import React, { useState, useEffect, useMemo, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowUpRight, LayoutList, LayoutGrid, Filter, X, Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import SectionHeading from '../components/SectionHeading';
import type { Post as ApiPost } from '../lib/api';
import { usePostsList, usePostCategories, usePostTags } from '../hooks/queries/posts';
import { PostListSkeleton } from '../components/Skeleton';

// 文章卡片数据类型
interface PostCardProps {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  coverImage?: string;
  viewMode: 'list' | 'grid';
}

// 映射前端类型到后端类型
const mapPostType = (post: ApiPost) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  date: post.date.split('T')[0], // 只取日期部分
  category: post.category,
  excerpt: post.excerpt,
  coverImage: post.coverImage,
  content: post.content,
  tags: post.tags,
  readingTime: post.readingTime || '5 min',
});

// 使用 React.memo 优化文章卡片组件
const PostCard = memo(({ slug, title, date, category, excerpt, coverImage, viewMode }: PostCardProps) => {
  return (
    <Link
      to={`/posts/${slug}`}
      className={`
        group relative transition-colors duration-300 bg-white/65 dark:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon
        ${viewMode === 'list' ? 'flex flex-col border-b border-ink/10 py-7 dark:border-white/10 md:flex-row md:items-start md:gap-7 md:px-4 hover:bg-white dark:hover:bg-white/[0.05]' : 'flex min-h-72 flex-col p-7 hover:bg-white dark:hover:bg-white/[0.05]'}
      `}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className={`flex-shrink-0 overflow-hidden ${viewMode === 'list' ? 'h-48 w-full md:h-32 md:w-48' : 'mb-5 h-48 w-full'}`}>
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Date Badge */}
      <div className={`flex-shrink-0 ${viewMode === 'list' ? 'md:w-28 pt-1' : coverImage ? '' : 'mb-4'}`}>
        <time className="mb-2 block font-mono text-[0.68rem] tracking-[0.16em] text-stone-500 tabular-nums" dateTime={date}>{date}</time>
        <span className="inline-block border-l-2 border-neon pl-2 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-neon-dark dark:text-neon">
          {category}
        </span>
      </div>

      {/* Content Card */}
      <div className="flex-1 flex flex-col h-full">
        <h3 className="mb-3 font-serif text-2xl font-bold leading-tight tracking-[-0.025em] text-ink transition-colors group-hover:text-neon-dark dark:text-white dark:group-hover:text-neon md:text-3xl">
          {title}
        </h3>
        <p className="mb-5 max-w-[62ch] flex-1 font-serif text-sm leading-7 text-stone-600 text-pretty dark:text-stone-400">
          {excerpt}
        </p>
        <span className="mt-auto flex items-center gap-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink transition-colors group-hover:text-neon-dark dark:text-stone-300 dark:group-hover:text-neon">
          阅读全文 <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>

    </Link>
  );
});

PostCard.displayName = 'PostCard';

export default function Posts() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const categoryParam = searchParams.get('category');
  const tagParam = searchParams.get('tag');

  const {
    data: postsRaw,
    isLoading: loading,
    error: postsError,
  } = usePostsList({
    category: categoryParam || undefined,
    tag: tagParam || undefined,
  });

  const { data: categories = [], isLoading: loadingCategories } = usePostCategories();
  const { data: tagsRaw } = usePostTags();

  const posts = useMemo(
    () => (postsRaw ?? []).map(mapPostType),
    [postsRaw]
  );

  const error = postsError?.message ?? null;

  const allTags = useMemo(() => {
    if (!tagsRaw) return [];
    return tagsRaw.map((tag) => tag.name);
  }, [tagsRaw]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedTag(tagParam);
  }, [categoryParam, tagParam]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedCategory && post.category !== selectedCategory) return false;
      if (selectedTag && !post.tags.includes(selectedTag)) return false;
      return true;
    });
  }, [posts, selectedCategory, selectedTag]);

  return (
    <section className="relative w-full py-10 md:py-16">
      <SEO
        title="文章"
        description="技术笔记、项目复盘、思考随笔"
        type="website"
      />
      <SectionHeading
        index="P.01"
        eyebrow="Writing archive / 文章"
        level="h1"
        title="思想留下的路径"
        description="技术笔记、项目复盘，以及一些无法归入代码的观察。"
        action={(
          <div className="inline-flex border border-ink/15 bg-white/55 p-1 dark:border-white/15 dark:bg-white/[0.03]" aria-label="文章布局">
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="列表视图"
            aria-pressed={viewMode === 'list'}
            className={`grid size-10 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon ${viewMode === 'list' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-stone-500 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white'}`}
          >
            <LayoutList size={18} />
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="网格视图"
            aria-pressed={viewMode === 'grid'}
            className={`grid size-10 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon ${viewMode === 'grid' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-stone-500 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white'}`}
          >
            <LayoutGrid size={18} />
          </button>
          </div>
        )}
      />

      {/* Filters */}
       <div className="my-12 border-y border-ink/10 py-6 dark:border-white/10">
         {/* Loading State */}
         {loading && (
           <PostListSkeleton count={5} viewMode={viewMode} />
         )}
         
         {/* Error State */}
         {error && (
           <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
             <p className="text-red-600 dark:text-red-300 font-mono text-sm">
               ERROR: {error}
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="text-red-600 dark:text-red-300 underline font-mono text-xs"
             >
               Retry
             </button>
           </div>
         )}
         
         {!loading && !error && (
           <>
         <div className="flex items-center gap-3 mb-4">
           <Filter size={18} className="text-neon" />
           <span className="text-sm font-bold text-ink dark:text-white">筛选</span>
         </div>

        {/* Category Filters */}
        <div className="mb-4">
          <span className="text-xs font-mono text-gray-500 mb-2 block">CATEGORY</span>
           <div className="flex flex-wrap gap-2">
             {loadingCategories ? (
               <div className="flex items-center gap-2">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 <span className="text-xs text-gray-500">加载中...</span>
               </div>
             ) : (
               <>
                 <Link
                   key="category-all"
                   to={selectedTag ? `/posts?tag=${selectedTag}` : '/posts'}
                   className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                     !selectedCategory
                       ? 'bg-neon text-white'
                       : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                   }`}
                 >
                   全部
                 </Link>
                 {categories.map(category => (
                   <Link
                     key={`category-${category.name}`}
                     to={`/posts?category=${category.name}${selectedTag ? `&tag=${selectedTag}` : ''}`}
                     className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                       selectedCategory === category.name
                         ? 'bg-neon text-white'
                         : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                     }`}
                   >
                     {category.name}
                   </Link>
                 ))}
               </>
             )}
           </div>
        </div>

        {/* Tag Filters */}
        <div>
           <span className="text-xs font-mono text-gray-500 mb-2 block">TAGS</span>
           <div className="flex flex-wrap gap-2">
              <Link
                key="all-tags"
                to={selectedCategory ? `/posts?category=${selectedCategory}` : '/posts'}
                className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                  !selectedTag
                    ? 'bg-neon text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                全部
              </Link>
             {allTags.map(tag => (
               <Link
                 key={`tag-${tag}`}
                 to={`/posts?tag=${encodeURIComponent(tag)}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                 className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                   selectedTag === tag
                     ? 'bg-neon text-white'
                     : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                 }`}
               >
                 {tag}
               </Link>
             ))}
           </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || selectedTag) && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs font-mono text-gray-500 mr-2">当前筛选：</span>
             {selectedCategory && (
               <Link
                 to={selectedTag ? `/posts?tag=${encodeURIComponent(selectedTag)}` : '/posts'}
                 className="px-3 py-1 bg-neon/10 text-neon border border-neon rounded-full text-sm font-mono flex items-center gap-2 hover:bg-neon hover:text-white transition-colors"
               >
                 {selectedCategory}
                 <X size={12} />
               </Link>
             )}
            {selectedTag && (
              <Link
                to={selectedCategory ? `/posts?category=${selectedCategory}` : '/posts'}
                className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary rounded-full text-sm font-mono flex items-center gap-2 hover:bg-secondary hover:text-white transition-colors"
              >
                {selectedTag}
                <X size={12} />
              </Link>
            )}
          </div>
        )}
          </>
        )}
      </div>

      <div className={viewMode === 'list' ? "grid grid-cols-1 border-t border-ink/10 dark:border-white/10" : "grid grid-cols-1 gap-px bg-ink/10 dark:bg-white/10 md:grid-cols-2"}>
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            date={post.date}
            category={post.category}
            excerpt={post.excerpt}
            coverImage={post.coverImage}
            viewMode={viewMode}
          />
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="border-y border-ink/10 py-20 text-center text-stone-500 dark:border-white/10 dark:text-stone-400">
          <p className="font-serif text-lg">这个筛选下还没有文章。</p>
        </div>
      )}
    </section>
  );
}
