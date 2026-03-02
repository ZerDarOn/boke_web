import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { DashboardStats } from '../../lib/api';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  totalProjects: number;
  totalAnime: number;
  totalDiaries: number;
  totalGalleryImages: number;
  totalUsers: number;
  totalComments: number;
  pageViews: number;
  uniqueVisitors: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.dashboard.getStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-xl">加载统计中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 font-mono text-sm">
          ERROR: {error}
        </p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-600 dark:text-red-300 underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">文章总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.contentStats?.articles || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              已发布 {stats?.contentStats?.articles || 0} 篇文章
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">相册图片</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.contentStats?.photos || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.contentStats?.photos || 0} 张照片
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">日记总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.contentStats?.diaries || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.contentStats?.diaries || 0} 篇日记
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">总内容数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.contentStats?.totalContent || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.contentStats?.totalContent || 0} 个内容项
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">点赞总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.contentStats?.totalLikes || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.contentStats?.totalLikes || 0} 次点赞
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">总请求数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalRequests || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              系统总访问量
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">独立访客</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.uniqueVisitors || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              唯一访客数
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">系统运行时间</h3>
              <span className="text-xl font-bold text-ink-50 dark:text-gray-300">{stats?.uptime || '-'}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              系统已持续运行
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-ink dark:text-paper">📊 最新动态</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-ink/5 dark:bg-black/20 rounded-lg">
              <div className="text-2xl">📝</div>
              <div className="flex-1">
                <p className="font-medium text-ink dark:text-paper">发布了新文章</p>
                <p className="text-sm text-ink/70 dark:text-gray-400">2024年5月20日 · 重构现实：赛博空间的虚无与存在</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-ink/5 dark:bg-black/20 rounded-lg">
              <div className="text-2xl">🚀</div>
              <div className="flex-1">
                <p className="font-medium text-ink dark:text-paper">上线新项目</p>
                <p className="text-sm text-ink/70 dark:text-gray-400">2024年5月15日 · INK.ENGINE 博客主题</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-ink/5 dark:bg-black/20 rounded-lg">
              <div className="text-2xl">🎬</div>
              <div className="flex-1">
                <p className="font-medium text-ink dark:text-paper">观看动漫完成</p>
                <p className="text-sm text-ink/70 dark:text-gray-400">2024年5月18日 · Cyberpunk: Edgerunners</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-ink/5 dark:bg-black/20 rounded-lg">
              <div className="text-2xl">📷</div>
              <div className="flex-1">
                <p className="font-medium text-ink dark:text-paper">上传新照片</p>
                <p className="text-sm text-ink/70 dark:text-gray-400">2024年5月10日 · 东京赛博之旅 (12张)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AdminDashboard;
