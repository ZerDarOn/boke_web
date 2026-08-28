import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, FileText, Film, Gamepad2, Image, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useContentOperations } from '../../hooks/queries/content-operations';
import { contentOperationsApi, type ContentOperationItem, type ContentOperationPriority, type ContentOperationType, type ContentSuggestionResult } from '../../lib/api';
import { unwrapApi } from '../../hooks/api/fetcher';
import { useToastActions } from '../../contexts/ToastContext';

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

interface ContentSuggestionSelection {
  excerpt?: string;
  tags?: string[];
}

const getSuggestionKey = (item: ContentOperationItem) => `${item.type}:${item.id}`;

const AdminContentOperations: React.FC = () => {
  const [filter, setFilter] = useState<'all' | ContentOperationType>('all');
  const [suggestionsByKey, setSuggestionsByKey] = useState<Record<string, ContentSuggestionResult>>({});
  const [selectedByKey, setSelectedByKey] = useState<Record<string, ContentSuggestionSelection>>({});
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useContentOperations();
  const toast = useToastActions();
  const visibleItems = useMemo(
    () => data?.items.filter((item) => filter === 'all' || item.type === filter) ?? [],
    [data?.items, filter],
  );

  const handleGenerateSuggestions = async (item: ContentOperationItem) => {
    const key = getSuggestionKey(item);
    setProcessingKey(key);
    try {
      const result = await unwrapApi(contentOperationsApi.getSuggestions(item.type, item.id));
      const selection = result.suggestions.reduce<ContentSuggestionSelection>((next, suggestion) => ({
        ...next,
        [suggestion.field]: suggestion.value,
      }), {});
      setSuggestionsByKey((current) => ({ ...current, [key]: result }));
      setSelectedByKey((current) => ({ ...current, [key]: selection }));
      if (result.notice) toast.info('暂未生成建议', result.notice);
    } catch (suggestionError) {
      toast.error('生成建议失败', suggestionError instanceof Error ? suggestionError.message : '请检查 AI 服务后重试');
    } finally {
      setProcessingKey(null);
    }
  };

  const handleToggleSuggestion = (item: ContentOperationItem, field: 'excerpt' | 'tags', value: string | string[]) => {
    const key = getSuggestionKey(item);
    setSelectedByKey((current) => {
      const next = { ...current[key] };
      if (next[field]) delete next[field];
      else if (field === 'excerpt' && typeof value === 'string') next.excerpt = value;
      else if (field === 'tags' && Array.isArray(value)) next.tags = value;
      return { ...current, [key]: next };
    });
  };

  const handleApplySuggestions = async (item: ContentOperationItem) => {
    const key = getSuggestionKey(item);
    const selection = selectedByKey[key];
    if (!selection?.excerpt && !selection?.tags?.length) {
      toast.warning('尚未选择建议', '至少选择一项后再应用。');
      return;
    }
    setProcessingKey(key);
    try {
      const result = await unwrapApi(contentOperationsApi.applySuggestions(item.type, item.id, selection));
      setSuggestionsByKey((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSelectedByKey((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      await refetch();
      toast.success('建议已应用', result.indexRebuildRequired ? `已更新：${result.applied.join('、')}；若要让 AI 立即读取新资料，请到 AI 服务配置重建索引。` : `已更新：${result.applied.join('、')}`);
    } catch (applyError) {
      toast.error('应用建议失败', applyError instanceof Error ? applyError.message : '内容可能已被修改，请重新扫描。');
    } finally {
      setProcessingKey(null);
    }
  };

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
            const key = getSuggestionKey(item);
            const suggestionResult = suggestionsByKey[key];
            const selection = selectedByKey[key];
            const isProcessing = processingKey === key;
            return <div key={key} className="py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-neon" /><p className="truncate font-medium text-ink dark:text-white">{item.title}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${priority.className}`}>{priority.label}</span></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.issues.join(' · ')}</p></div><div className="flex shrink-0 items-center gap-3"><button type="button" onClick={() => handleGenerateSuggestions(item)} disabled={isProcessing} className="inline-flex items-center gap-1 text-sm font-medium text-neon hover:underline disabled:opacity-60">{isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}AI 建议</button><Link to={item.path} className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-neon dark:text-gray-300">去管理 <ArrowRight size={15} /></Link></div></div>{suggestionResult && <div className="mt-4 rounded-lg border border-neon/25 bg-neon/5 p-4"><div className="flex items-center gap-2"><Bot size={16} className="text-neon" /><p className="text-sm font-medium text-ink dark:text-white">AI 建议预览</p></div><div className="mt-3 space-y-3">{suggestionResult.suggestions.map((suggestion) => { const selected = suggestion.field === 'excerpt' ? selection?.excerpt === suggestion.value : JSON.stringify(selection?.tags) === JSON.stringify(suggestion.value); return <label key={suggestion.field} className="flex cursor-pointer items-start gap-3 rounded-md bg-white/70 p-3 dark:bg-black/20"><input type="checkbox" checked={selected} onChange={() => handleToggleSuggestion(item, suggestion.field, suggestion.value)} className="mt-1 h-4 w-4 accent-neon" /><span className="min-w-0"><span className="text-xs font-medium text-neon">{suggestion.label}</span><span className="mt-1 block text-sm leading-6 text-gray-700 dark:text-gray-300">{Array.isArray(suggestion.value) ? suggestion.value.join(' · ') : suggestion.value}</span></span></label>; })}</div><div className="mt-3 flex justify-end"><button type="button" onClick={() => handleApplySuggestions(item)} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg bg-neon px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neon/80 disabled:opacity-60"><CheckCircle2 size={15} />确认应用</button></div></div>}</div>;
          }) : <div className="py-10 text-center"><CheckCircle2 className="mx-auto text-neon" size={28} /><p className="mt-3 font-medium text-ink dark:text-white">这一类内容已没有待办</p></div>}
        </div>
        {data.total > data.visibleCount && <p className="mt-4 text-xs text-gray-500">为保证后台响应速度，本次显示优先级最高的 {data.visibleCount} 项，共发现 {data.total} 项。</p>}
      </div>
      <aside className="space-y-4"><div className="rounded-xl border border-neon/30 bg-neon/5 p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-neon" /><h3 className="font-semibold text-ink dark:text-white">本轮检查标准</h3></div><ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300"><li>文章：摘要、封面、标签</li><li>游戏：介绍、点评、截图、精彩片段</li><li>追番：简介、感想、精彩片段</li><li>相册：描述、标签、归属相册</li></ul></div><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center gap-2"><Bot size={18} className="text-neon" /><h3 className="font-semibold text-ink dark:text-white">AI 建议（下一步）</h3></div><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">这里已经准备好承接 AI 的标题、摘要、标签与关联推荐。下一阶段会保持“逐条预览、你确认后才写入”的方式。</p></div></aside>
    </section>
  </div>;
};

export default AdminContentOperations;
