import React, { useState, useEffect, useMemo, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { ArrowRight, LayoutList, LayoutGrid, Filter, X, Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import type { Post as ApiPost } from '../lib/api';
import { usePostsList, usePostCategories, usePostTags } from '../hooks/queries/posts';
import { PostListSkeleton } from '../components/Skeleton';

// 分类类型定义
interface Category {
  name: string;
  count: number;
}

// 文章卡片数据类型
interface PostCardProps {
  id: string;
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
const PostCard = memo(({ id, slug, title, date, category, excerpt, coverImage, viewMode }: PostCardProps) => {
  return (
    <Link
      to={`/posts/${slug}`}
      className={`
        group relative transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm hover:shadow-xl border border-transparent hover:border-ink/10 dark:border-white/5 dark:hover:border-neon/50
        ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 items-start p-6' : 'flex flex-col p-6 h-full'}
      `}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className={`flex-shrink-0 overflow-hidden rounded-xl ${viewMode === 'list' ? 'md:w-48 w-full h-48 md:h-32' : 'w-full h-48 mb-4'}`}>
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
        <span className="font-mono text-sm text-gray-400 block mb-1">{date}</span>
        <span className="font-mono text-xs text-neon border border-neon rounded px-2 py-0.5 inline-block bg-neon/5">
          {category}
        </span>
      </div>

      {/* Content Card */}
      <div className="flex-1 flex flex-col h-full">
        <h3 className="text-2xl font-bold font-sans text-ink dark:text-white group-hover:text-neon-dark dark:group-hover:text-neon transition-colors mb-3">
          {title}
        </h3>
        <p className="font-serif text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4 flex-1">
          {excerpt}
        </p>
        <button className="flex items-center gap-2 font-mono text-xs font-bold text-ink dark:text-gray-200 group-hover:text-neon transition-colors tracking-widest uppercase mt-auto">
          Read <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

      {/* Decorative Ink Splat / Glow in Dark Mode */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 rounded-bl-3xl transition-opacity -z-10"></div>
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

  const lang: 'EN' | 'ZH' = 'ZH';
  const t = TRANSLATIONS[lang];

  return (
    <section className="py-12 w-full relative">
      <SEO
        title="文章"
        description="技术笔记、项目复盘、思考随笔"
        type="website"
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b-2 border-ink dark:border-white pb-4 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
          <h2 className="text-4xl md:text-6xl font-serif font-black text-ink dark:text-white tracking-tight leading-none">
            我
          </h2>
          <h2 className="text-4xl md:text-6xl font-serif font-black text-neon tracking-tight leading-none">
            的文章
          </h2>
          <span className="font-mono text-neon font-bold text-lg">
            / POSTS
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

      {/* Filters */}
       <div className="mb-8">
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

      <div className={viewMode === 'list' ? "grid grid-cols-1 gap-12" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
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
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="font-mono text-lg">NO POSTS FOUND</p>
        </div>
      )}
    </section>
  );
}
