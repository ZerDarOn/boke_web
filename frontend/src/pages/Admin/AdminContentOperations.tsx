import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, FileText, Film, Gamepad2, Image, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useContentOperations } from '../../hooks/queries/content-operations';
import type { ContentOperationPriority, ContentOperationType } from '../../lib/api';

const typeMeta: Record<ContentOperationType, { label: string; icon: typeof FileText }> = {
  post: { label: '文章', icon: FileText },
  game: { label: '游戏', icon: Gamepad2 },
  anime: { label: '追番', icon: Film },
  gallery: { label: '相册', icon: Image },
};

const priorityMeta: Record<ContentOperationPriority, { label: string; className: string }> = {
  high: { label: '优先完善', className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/60' },
  medium: { label: '建议补充', className: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/60' },
  low: { label: '可选优化', className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/60' },
};

const filterOptions: Array<{ value: 'all' | ContentOperationType; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'post', label: '文章' },
  { value: 'game', label: '游戏' },
  { value: 'anime', label: '追番' },
  { value: 'gallery', label: '相册' },
];

const AdminContentOperations: React.FC = () => {
  const [filter, setFilter] = useState<'all' | ContentOperationType>('all');
  const { data, isLoading, error, refetch, isFetching } = useContentOperations();
  const visibleItems = useMemo(
    () => data?.items.filter((item) => filter === 'all' || item.type === filter) ?? [],
    [data?.items, filter],
  );

  if (isLoading) return <div className="flex min-h-96 items-center justify-center"><Loader2 className="animate-spin text-neon" size={32} /></div>;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><p className="font-medium">内容扫描暂时不可用</p><button type="button" onClick={() => refetch()} className="mt-3 inline-flex items-center gap-2 text-sm underline"><RefreshCw size={14} />重新扫描</button></div>;

  return <div className="space-y-6">
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101010] md:flex md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs tracking-[0.18em] text-neon">CONTENT OPERATIONS</p>
        <h2 className="mt-2 text-2xl font-bold text-ink dark:text-white">内容运营工作台</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">按固定标准扫描前台内容的缺项，确认要完善什么后再进入对应管理页；不会自动修改、发布或生成内容。</p>
      </div>
      <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-neon hover:text-neon disabled:opacity-60 dark:border-white/10 dark:text-gray-300 md:mt-0"><RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />重新扫描</button>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.byType.map(({ type, count }) => {
        const meta = typeMeta[type];
        const Icon = meta.icon;
        return <button type="button" key={type} onClick={() => setFilter(type)} className={`rounded-xl border p-5 text-left transition-colors ${filter === type ? 'border-neon bg-neon/5' : 'border-gray-200 bg-white hover:border-neon/50 dark:border-white/10 dark:bg-[#101010]'}`}>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"><span>{meta.label}待办</span><Icon size={18} className="text-neon" /></div>
          <p className="mt-4 text-3xl font-bold text-ink dark:text-white">{count}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">点击筛选该类内容</p>
        </button>;
      })}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /><h3 className="font-semibold text-ink dark:text-white">待完善清单</h3><span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">{data.total} 项</span></div><div className="flex flex-wrap gap-2">{filterOptions.map((option) => <button type="button" key={option.value} onClick={() => setFilter(option.value)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === option.value ? 'bg-ink text-white dark:bg-neon dark:text-black' : 'bg-ink/5 text-gray-600 hover:bg-ink/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}>{option.label}</button>)}</div></div>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/10">
          {visibleItems.length ? visibleItems.map((item) => {
            const meta = typeMeta[item.type];
            const Icon = meta.icon;
            const priority = priorityMeta[item.priority];
            return <div key={`${item.type}:${item.id}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-neon" /><p className="truncate font-medium text-ink dark:text-white">{item.title}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${priority.className}`}>{priority.label}</span></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.issues.join(' · ')}</p></div><Link to={item.path} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neon hover:underline">去管理 <ArrowRight size={15} /></Link></div>;
          }) : <div className="py-10 text-center"><CheckCircle2 className="mx-auto text-neon" size={28} /><p className="mt-3 font-medium text-ink dark:text-white">这一类内容已没有待办</p></div>}
        </div>
        {data.total > data.visibleCount && <p className="mt-4 text-xs text-gray-500">为保证后台响应速度，本次显示优先级最高的 {data.visibleCount} 项，共发现 {data.total} 项。</p>}
      </div>
      <aside className="space-y-4"><div className="rounded-xl border border-neon/30 bg-neon/5 p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-neon" /><h3 className="font-semibold text-ink dark:text-white">本轮检查标准</h3></div><ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300"><li>文章：摘要、封面、标签</li><li>游戏：介绍、点评、截图、精彩片段</li><li>追番：简介、感想、精彩片段</li><li>相册：描述、标签、归属相册</li></ul></div><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center gap-2"><Bot size={18} className="text-neon" /><h3 className="font-semibold text-ink dark:text-white">AI 建议（下一步）</h3></div><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">这里已经准备好承接 AI 的标题、摘要、标签与关联推荐。下一阶段会保持“逐条预览、你确认后才写入”的方式。</p></div></aside>
    </section>
  </div>;
};

export default AdminContentOperations;
