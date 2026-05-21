/**
 * ============================================================================
 * 移动端底部边栏组件 (Mobile Bottom Bar Component)
 * ============================================================================
 * 
 * 【文件用途】
 * 为移动端（手机）提供专用的底部边栏，将桌面端的左右边栏内容整合到底部可折叠区块中。
 * 
 * 【设计思路】
 * 1. 移动端屏幕宽度有限（竖屏），无法像桌面端那样展示三列布局
 * 2. 采用单列布局 + 底部折叠区块的方式，用户点击展开/收起
 * 3. 仅在移动端显示（lg:hidden = 小于1024px时显示）
 * 
 * 【包含内容】
 * - 分类列表（Categories）：博客文章分类
 * - 标签云（Tags）：文章标签
 * - 最新动态（Activities）：项目动态信息
 * 
 * 【相关文件】
 * - 引入位置：Layout.tsx
 * - 样式配合：index.css 中的移动端触摸优化规则
 * 
 * 【修改建议】
 * - 如需调整折叠区块：修改 toggleSection 函数和 expandedSection 状态
 * - 如需修改显示数量：调整 slice() 参数
 * - 如需更改显示断点：修改 lg:hidden 为其他 Tailwind 断点
 * 
 * @created 2024 - 移动端兼容性优化
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Hash, Bell, Activity, ChevronRight, Loader2 } from 'lucide-react';
import { usePostCategories, usePostTags } from '../hooks/queries/posts';
import { useSiteConfig } from '../hooks/useSiteConfig';
import useActivities from '../hooks/useActivities';

/* ============================================================================
 * 类型定义
 * ============================================================================ */

/** 分类数据结构 */
interface Category {
  name: string;
  count: number;
}

/** 标签数据结构 */
interface Tag {
  name: string;
  count: number;
}

/* ============================================================================
 * 主组件
 * ============================================================================ */

const MobileBottomBar: React.FC = () => {
  const location = useLocation();
  const config = useSiteConfig();
  
  const { activities } = useActivities({ limit: 3 });

  const { data: categoriesRaw, isLoading: categoriesLoading } = usePostCategories();
  const { data: tagsRaw, isLoading: tagsLoading } = usePostTags();
  const loading = categoriesLoading || tagsLoading;
  const [expandedSection, setExpandedSection] = useState<'categories' | 'tags' | 'activities' | null>(null);

  const categories = useMemo((): Category[] => {
    if (!categoriesRaw?.length) return [];
    const totalCount = categoriesRaw.reduce((sum, cat) => sum + (cat.count || 0), 0);
    return [
      { name: 'ALL', count: totalCount },
      ...categoriesRaw.map((cat) => ({
        name: cat.name,
        count: cat.count || 0,
      })),
    ];
  }, [categoriesRaw]);

  const tags = useMemo((): Tag[] => {
    if (!tagsRaw) return [];
    return tagsRaw
      .map((tag) => ({
        name: tag.name,
        count: tag.count || 0,
      }))
      .slice(0, 10);
  }, [tagsRaw]);

  /* --------
   * 折叠控制函数
   * 点击区块标题时切换展开/收起状态
   * 再次点击同一区块会收起
   * -------- */
  const toggleSection = (section: 'categories' | 'tags' | 'activities') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  /* --------
   * 加载中状态显示
   * -------- */
  if (loading) {
    return (
      // lg:hidden: 仅在屏幕宽度 < 1024px 时显示
      <div className="lg:hidden p-4 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neon" />
      </div>
    );
  }

  /* --------
   * 主渲染
   * -------- */
  return (
    // lg:hidden: 仅在移动端显示，桌面端隐藏此组件
    <div className="lg:hidden mt-6 border-t border-white/10 dark:border-white/5">
      <div className="p-4 space-y-4">
        
        {/* 博客名称标题 */}
        <div className="mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-neon">
            <User size={16} />
            <span className="font-mono text-xs uppercase tracking-widest">{config.blogName}</span>
          </div>
        </div>

        {/* ========== 分类区块 ========== */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          {/* 区块标题按钮 */}
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <span className="text-sm font-medium text-gray-300">分类</span>
            </div>
            {/* 箭头图标：展开时旋转90度 */}
            <ChevronRight
              size={16}
              className={`text-gray-500 transition-transform ${expandedSection === 'categories' ? 'rotate-90' : ''}`}
            />
          </button>
          {/* 展开内容：分类列表，最多显示6个 */}
          {expandedSection === 'categories' && (
            <div className="p-3 space-y-1 bg-black/20">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.name}
                  to={`/?category=${cat.name}`}
                  className="flex items-center justify-between py-2 px-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-600 font-mono">{cat.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ========== 标签区块 ========== */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('tags')}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-neon" />
              <span className="text-sm font-medium text-gray-300">标签</span>
            </div>
            <ChevronRight
              size={16}
              className={`text-gray-500 transition-transform ${expandedSection === 'tags' ? 'rotate-90' : ''}`}
            />
          </button>
          {/* 展开内容：标签云形式展示 */}
          {expandedSection === 'tags' && tags.length > 0 && (
            <div className="p-3 flex flex-wrap gap-2 bg-black/20">
              {tags.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/?tag=${tag.name}`}
                  className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-neon/20 rounded-full transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ========== 最新动态区块 ========== */}
        {/* 仅在有动态数据时显示 */}
        {activities.length > 0 && (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('activities')}
              className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-neon" />
                <span className="text-sm font-medium text-gray-300">最新动态</span>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-500 transition-transform ${expandedSection === 'activities' ? 'rotate-90' : ''}`}
              />
            </button>
            {/* 展开内容：动态列表 */}
            {expandedSection === 'activities' && (
              <div className="p-3 space-y-2 bg-black/20">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0"
                  >
                    <Bell size={12} className="text-neon mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.project}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileBottomBar;
