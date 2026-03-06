import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Github, Twitter, Hash, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useSiteConfig } from '../hooks/useSiteConfig';

// 分类和标签的类型定义
interface Category {
  name: string;
  count: number;
  icon?: string;
}

interface Tag {
  name: string;
  count: number;
}

// 分类图标映射
const CATEGORY_ICONS: Record<string, string> = {
  'ALL': '📚',
  'PHILOSOPHY': '☯️',
  'ENGINEERING': '⚙️',
  'LIFESTYLE': '🍵',
  'LIFE': '🏠',
  'TECH': '⚡',
  'BACKEND.OPS': '🔧',
  'DESIGN.ARTS': '🎨',
  'FRONTEND.CORE': '💻',
  'DEFAULT': '📁',
};

// 获取分类图标
const getCategoryIcon = (categoryName: string): string => {
  return CATEGORY_ICONS[categoryName] || CATEGORY_ICONS['DEFAULT'];
};

const BilibiliIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.758v6.844c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.338 0 16.828V9.985c.036-1.51.556-2.762 1.56-3.758 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v6.844c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893V9.907c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96v-1.173c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96v-1.173c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const categoryParam = new URLSearchParams(location.search).get('category');
  const tagParam = new URLSearchParams(location.search).get('tag');
  const config = useSiteConfig();

  // 状态管理
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 API 获取分类和标签
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行请求分类和标签
        const [categoriesRes, tagsRes] = await Promise.all([
          api.posts.getCategories(),
          api.posts.getTags(),
        ]);

        // 处理分类数据
        if (categoriesRes.success && categoriesRes.data) {
          const categoryList = categoriesRes.data.map(cat => ({
            name: cat.name,
            count: cat.count || 0,
            icon: getCategoryIcon(cat.name),
          }));

          // 添加 "ALL" 分类作为第一项
          const totalCount = categoryList.reduce((sum, cat) => sum + cat.count, 0);
          const allCategory: Category = {
            name: 'ALL',
            count: totalCount,
            icon: CATEGORY_ICONS['ALL'],
          };

          setCategories([allCategory, ...categoryList]);
        } else {
          console.error('获取分类失败:', categoriesRes.error);
          setError('获取分类失败');
        }

        // 处理标签数据
        if (tagsRes.success && tagsRes.data) {
          const tagList = tagsRes.data.map(tag => ({
            name: tag.name,
            count: tag.count || 0,
          }));
          setTags(tagList);
        } else {
          console.error('获取标签失败:', tagsRes.error);
          setError('获取标签失败');
        }
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-64 flex-shrink-0 sticky top-24 h-fit z-20">
      
      {/* 1. Avatar Card */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_rgba(10,10,10,0.1)] dark:shadow-none hover:shadow-[6px_6px_0px_rgba(16,185,129,0.2)] transition-all duration-300 rounded-lg relative overflow-hidden group">
        <div className="w-20 h-20 rounded-full bg-ink dark:bg-black border-2 border-neon p-1 mb-3 relative">
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                {config.authorAvatar ? (
                  <img src={config.authorAvatar} alt={config.authorName} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-gray-500 w-10 h-10" />
                )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon rounded-full border-2 border-white dark:border-black animate-pulse"></div>
        </div>
        <h3 className="font-sans font-bold text-lg text-ink dark:text-white transition-colors">{config.authorName}</h3>
        <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mb-4 tracking-widest uppercase">{config.authorTitle}</p>
        <div className="flex gap-4 text-ink dark:text-gray-300">
            <a href={config.github} target="_blank" rel="noopener noreferrer" className="hover:text-neon cursor-pointer transition-colors">
              <Github size={16} />
            </a>
            <a href={config.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-neon cursor-pointer transition-colors">
              <Twitter size={16} />
            </a>
            <a href={config.bilibili} target="_blank" rel="noopener noreferrer" className="hover:text-neon cursor-pointer transition-colors">
              <BilibiliIcon />
            </a>
        </div>
      </div>

      {/* 2. Categories */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
            <Hash size={14} className="text-neon" />
            CATEGORIES
        </h4>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-red-500 dark:text-red-400">{error}</div>
        ) : categories.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">暂无分类</div>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.name} className={`flex justify-between items-center group p-1 hover:bg-gray-50 dark:hover:bg-white/5 rounded transition-colors ${categoryParam === cat.name || (cat.name === 'ALL' && !categoryParam) ? 'bg-neon/5' : ''}`}>
                <Link to={cat.name === 'ALL' ? '/posts' : `/posts?category=${cat.name}`} className="flex items-center gap-2 font-mono text-xs text-gray-600 dark:text-gray-400 group-hover:text-ink dark:group-hover:text-white flex-1">
                  <span className="opacity-50 grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span>
                  {cat.name}
                </Link>
                <span className="font-mono text-[10px] bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded group-hover:bg-neon group-hover:text-white transition-colors">
                  {cat.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Tags */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
            <Hash size={14} className="text-neon" />
            TAGS
        </h4>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-red-500 dark:text-red-400">{error}</div>
        ) : tags.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">暂无标签</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.name}
                to={`/posts?tag=${tag.name}`}
                className={`font-mono text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded hover:border-neon hover:text-neon transition-all ${tagParam === tag.name ? 'bg-neon text-white border-neon' : ''}`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;