import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BLOG_POSTS, CATEGORIES, TRANSLATIONS } from '../constants';
import { ArrowRight, LayoutList, LayoutGrid, Filter, X } from 'lucide-react';

const Posts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const categoryParam = searchParams.get('category');
  const tagParam = searchParams.get('tag');

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedTag(tagParam);
  }, [categoryParam, tagParam]);

  const filteredPosts = BLOG_POSTS.filter(post => {
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (selectedTag && !post.tags.includes(selectedTag)) return false;
    return true;
  });

  const allTags = Array.from(new Set(BLOG_POSTS.flatMap(post => post.tags))).sort();

  const lang: 'EN' | 'ZH' = 'ZH';
  const t = TRANSLATIONS[lang];

  return (
    <section className="py-12 w-full relative">
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
        <div className="flex items-center gap-3 mb-4">
          <Filter size={18} className="text-neon" />
          <span className="text-sm font-bold text-ink dark:text-white">筛选</span>
        </div>

        {/* Category Filters */}
        <div className="mb-4">
          <span className="text-xs font-mono text-gray-500 mb-2 block">CATEGORY</span>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/posts"
              className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                !selectedCategory
                  ? 'bg-neon text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
              }`}
            >
              全部
            </Link>
             {CATEGORIES.map(category => (
               <Link
                 key={category.name}
                 to={`/posts?category=${category.name}`}
                 className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                   selectedCategory === category.name
                     ? 'bg-neon text-white'
                     : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                 }`}
               >
                 {category.name}
               </Link>
             ))}
          </div>
        </div>

        {/* Tag Filters */}
        <div>
          <span className="text-xs font-mono text-gray-500 mb-2 block">TAGS</span>
          <div className="flex flex-wrap gap-2">
            <Link
              to={selectedCategory ? `/posts?category=${selectedCategory}` : '/posts'}
              className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                !selectedTag
                  ? 'bg-secondary text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
              }`}
            >
              全部
            </Link>
            {allTags.map(tag => (
              <Link
                key={tag}
                to={`/posts?tag=${encodeURIComponent(tag)}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                  selectedTag === tag
                    ? 'bg-secondary text-white'
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
                {CATEGORIES.find(c => c.name === selectedCategory)?.name || selectedCategory}
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
      </div>

      <div className={viewMode === 'list' ? "grid grid-cols-1 gap-12" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {filteredPosts.map((post) => (
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
      
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="font-mono text-lg">NO POSTS FOUND</p>
        </div>
      )}
    </section>
  );
};

export default Posts;
