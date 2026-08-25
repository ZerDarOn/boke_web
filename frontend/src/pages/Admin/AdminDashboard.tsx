import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, Bot, CheckCircle2, Database, Gauge, HardDrive, Loader2, RefreshCw } from 'lucide-react';
import { useAdminDashboardOverview } from '../../hooks/queries/dashboard';

const statusStyles = {
  healthy: 'border-neon/30 bg-neon/5 text-neon',
  configured: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  local: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  degraded: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  unhealthy: 'border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
} as const;

const formatBytes = (value: number) => `${(value / 1024 / 1024).toFixed(1)} MB`;
const formatRuntime = (value: number) => `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60).toString().padStart(2, '0')}m`;

const AdminDashboard: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboardOverview();

  if (isLoading) return <div className="flex min-h-96 items-center justify-center"><Loader2 className="animate-spin text-neon" size={32} /></div>;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><p className="font-medium">仪表盘数据暂时不可用</p><button type="button" onClick={() => refetch()} className="mt-3 inline-flex items-center gap-2 text-sm underline"><RefreshCw size={14} />重新获取</button></div>;

  const metrics = [
    { label: '累计访问', value: data.stats.totalRequests.toLocaleString(), hint: '真实采集数据', icon: Activity },
    { label: '独立访客', value: data.stats.uniqueVisitors.toLocaleString(), hint: '按日匿名去重', icon: Gauge },
    { label: '已发布内容', value: data.stats.contentStats.totalContent.toLocaleString(), hint: '内容总览', icon: Database },
    { label: '本次运行', value: formatRuntime(data.runtime.uptime), hint: `${formatBytes(data.runtime.memoryUsedBytes)} 堆内存`, icon: HardDrive },
  ];

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101010] md:flex-row md:items-end md:justify-between"><div><p className="font-mono text-xs tracking-[0.18em] text-neon">CONTROL ROOM</p><h2 className="mt-2 text-2xl font-bold text-ink dark:text-white">站点工作台</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">真实数据、内容待办与服务状态集中在这里。</p></div><button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-neon hover:text-neon disabled:opacity-60 dark:border-white/10 dark:text-gray-300"><RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />刷新状态</button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, hint, icon: Icon }) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"><span>{label}</span><Icon size={18} className="text-neon" /></div><div className="mt-4 text-3xl font-bold text-ink dark:text-white">{value}</div><p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p></div>)}</section>
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /><h3 className="font-semibold text-ink dark:text-white">内容待办</h3></div><Link to={data.contentOperations.path} className="text-sm font-medium text-neon hover:underline">运营工作台</Link></div><Link to={data.contentOperations.path} className="mt-4 flex items-center justify-between rounded-lg border border-neon/20 bg-neon/5 px-4 py-3 transition-colors hover:border-neon"><span className="text-sm text-gray-700 dark:text-gray-300">待完善内容总览</span><span className="rounded-full bg-neon px-3 py-1 font-mono text-sm font-semibold text-black">{data.contentOperations.total}</span></Link><div className="mt-3 divide-y divide-gray-100 dark:divide-white/10">{data.pending.map(item => <Link key={item.key} to={item.path} className="flex items-center justify-between gap-4 py-3 hover:text-neon"><span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span><span className="rounded-full bg-ink/5 px-3 py-1 font-mono text-sm font-semibold text-ink dark:bg-white/10 dark:text-white">{item.count}</span></Link>)}</div></div><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon" /><h3 className="font-semibold text-ink dark:text-white">服务监控</h3></div><div className="mt-4 space-y-3">{data.services.map(service => <div key={service.key} className={`rounded-lg border px-3 py-3 ${statusStyles[service.status]}`}><div className="flex items-center justify-between text-sm font-medium"><span>{service.label}</span><span>{service.status === 'healthy' ? '正常' : service.status === 'local' ? '本地' : service.status === 'configured' ? '已配置' : service.status === 'degraded' ? '降级' : '异常'}</span></div><p className="mt-1 text-xs opacity-80">{service.detail}</p></div>)}</div></div></section>
    <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-ink dark:text-white">访客行为</h3><span className="text-xs text-gray-500">近 {data.behavior.days} 天 · 匿名聚合</span></div><div className="mt-4 grid grid-cols-3 gap-3">{data.behavior.eventTypes.map(item => <div key={item.eventType} className="rounded-lg bg-ink/5 p-3 dark:bg-white/5"><p className="text-xs text-gray-500">{item.eventType === 'page_view' ? '浏览' : item.eventType === 'content_click' ? '站内点击' : '站内搜索'}</p><p className="mt-1 text-xl font-semibold text-ink dark:text-white">{item.count}</p></div>)}</div><p className="mt-3 text-xs text-gray-500">共 {data.behavior.eventCount} 个事件；不采集 IP、聊天或搜索内容。</p></div><div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#101010]"><h3 className="font-semibold text-ink dark:text-white">热门路径</h3><div className="mt-3 divide-y divide-gray-100 dark:divide-white/10">{data.behavior.topPaths.length ? data.behavior.topPaths.map(item => <div key={item.path} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate font-mono text-gray-600 dark:text-gray-300">{item.path}</span><span className="font-semibold text-ink dark:text-white">{item.count}</span></div>) : <p className="py-5 text-sm text-gray-500">尚无匿名行为数据。</p>}</div></div></section>
    <section className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-white/10 dark:bg-[#101010] dark:text-gray-300"><Bot size={18} className="text-neon" />系统指标按分钟刷新；服务未配置时会明确显示，不会伪造成功。</section>
  </div>;
};

export default AdminDashboard;
