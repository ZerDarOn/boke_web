import React from 'react';
import { Plus, Loader2, Search } from 'lucide-react';
import type { CrudAccent, StatConfig } from './types';

const CREATE_CLASSES: Record<CrudAccent, string> = {
  purple: 'bg-gradient-to-r from-gray-800 to-purple-600 hover:from-gray-700 hover:to-purple-700',
  cyan: 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 shadow-lg hover:shadow-cyan-500/25',
  orange: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
};

const TINTED_TONES: Record<string, { card: string; value: string; iconBg: string }> = {
  blue: {
    card: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800',
    value: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  green: {
    card: 'bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-900/20 dark:to-green-800/10 border border-green-200 dark:border-green-800',
    value: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
  pink: {
    card: 'bg-gradient-to-br from-pink-500/10 to-pink-600/5 dark:from-pink-900/20 dark:to-pink-800/10 border border-pink-200 dark:border-pink-800',
    value: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
  },
  yellow: {
    card: 'bg-gradient-to-br from-yellow-500/10 to-orange-600/5 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-orange-800',
    value: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  orange: {
    card: 'bg-gradient-to-br from-orange-100/50 to-amber-100/30 dark:from-orange-900/20 dark:to-amber-900/10 border border-orange-200 dark:border-amber-800/50',
    value: 'text-orange-700 dark:text-amber-400',
    iconBg: 'bg-orange-200 dark:bg-amber-900/30',
  },
  gray: {
    card: 'bg-gradient-to-br from-gray-100/50 to-slate-100/30 dark:from-gray-800/50 dark:to-slate-900/20 border border-gray-200 dark:border-slate-700',
    value: 'text-gray-700 dark:text-gray-400',
    iconBg: 'bg-gray-200 dark:bg-slate-800',
  },
};

const SOLID_TONES: Record<string, { card: string; label: string }> = {
  purple: {
    card: 'bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg',
    label: 'text-purple-100 text-sm',
  },
  green: {
    card: 'bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg',
    label: 'text-green-100 text-sm',
  },
  gray: {
    card: 'bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg',
    label: 'text-gray-100 text-sm',
  },
};

const StatCard: React.FC<{ stat: StatConfig }> = ({ stat }) => {
  const tone = stat.tone ?? 'blue';
  if (stat.variant === 'solid') {
    const solid = SOLID_TONES[tone] ?? SOLID_TONES.purple;
    return (
      <div className={solid.card}>
        <div className="flex items-center justify-between">
          <div>
            <p className={solid.label}>{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
          <div className="opacity-70">{stat.icon}</div>
        </div>
      </div>
    );
  }
  const tinted = TINTED_TONES[tone] ?? TINTED_TONES.blue;
  return (
    <div className={`${tinted.card} rounded-xl p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${tinted.value}`}>{stat.value}</p>
        </div>
        {stat.icon && (
          <div className={`w-10 h-10 rounded-lg ${tinted.iconBg} flex items-center justify-center`}>{stat.icon}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Admin 列表页通用外壳：加载/错误态 → 头部 → 统计卡 → 筛选栏 → 内容/空态。
 * 各实体页只需提供配置与内容插槽（卡片渲染、筛选控件、弹窗表单）。
 */
export const AdminPageShell: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: CrudAccent;
  /** 头部图标底座类名（各页面主题色渐变） */
  iconClassName?: string;
  count: number;
  countLabel: string;
  createLabel: string;
  onCreate: () => void;
  /** 头部新建按钮左侧的额外操作（如 Steam 同步） */
  headerActions?: React.ReactNode;
  loading: boolean;
  loadingText?: string;
  error: string | null;
  onRetry: () => void;
  stats?: StatConfig[];
  statsClassName?: string;
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  /** 筛选控件（下拉/tab 等），渲染在搜索框右侧；variant=bare 时不带卡片容器 */
  filters?: React.ReactNode;
  filterVariant?: 'card' | 'bare';
  isEmpty: boolean;
  emptyEmoji?: string;
  emptyTitle: string;
  emptyActionLabel: string;
  children: React.ReactNode;
}> = ({
  title,
  icon,
  accent = 'purple',
  iconClassName = 'bg-gradient-to-br from-gray-200/50 to-purple-500/20 dark:from-gray-700/50 dark:to-purple-800/30',
  count,
  countLabel,
  createLabel,
  onCreate,
  headerActions,
  loading,
  loadingText = '加载中...',
  error,
  onRetry,
  stats,
  statsClassName = 'md:grid-cols-4',
  search,
  filters,
  filterVariant = 'card',
  isEmpty,
  emptyEmoji = '📝',
  emptyTitle,
  emptyActionLabel,
  children,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-500" size={32} />
          <p className="text-gray-600 dark:text-gray-300 text-lg">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 font-mono text-sm">ERROR: {error}</p>
        <button onClick={onRetry} className="mt-2 text-sm text-red-600 dark:text-red-300 underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClassName}`}>{icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              共 {count} {countLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <button
            onClick={onCreate}
            className={`px-6 py-3 ${CREATE_CLASSES[accent]} text-white rounded-xl transition-all shadow-lg flex items-center gap-2 font-medium`}
          >
            <Plus size={18} />
            {createLabel}
          </button>
        </div>
      </div>

      {/* 统计卡 */}
      {stats && stats.length > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${statsClassName}`}>
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      )}

      {/* 搜索 + 筛选 */}
      {(search || filters) &&
        (filterVariant === 'card' ? (
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {search && (
                <div className={filters ? 'flex-1 relative' : 'flex-1 relative max-w-xl'}>
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={search.placeholder ?? `搜索${title}...`}
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              )}
              {filters && <div className="flex items-center gap-2">{filters}</div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            {search && (
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={search.placeholder ?? `搜索${title}...`}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}
            {filters}
          </div>
        ))}

      {/* 内容 / 空态 */}
      {isEmpty ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">{emptyEmoji}</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{emptyTitle}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">点击右上角按钮{emptyActionLabel}</p>
          <button
            onClick={onCreate}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 to-purple-600 text-white rounded-xl hover:from-gray-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto"
          >
            <Plus size={18} />
            {createLabel}
          </button>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
