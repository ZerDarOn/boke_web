import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-ink dark:text-paper text-xl">加载统计中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">文章总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalPosts || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              已发布 {stats?.totalPosts || 0} 篇文章
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">项目总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalProjects || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.totalProjects || 0} 个项目
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">动漫总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalAnime || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.totalAnime || 0} 部动漫
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">日记总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalDiaries || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.totalDiaries || 0} 篇日记
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">相册图片</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalGalleryImages || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.totalGalleryImages || 0} 张照片
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">评论总数</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.totalComments || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              {stats?.totalComments || 0} 条评论
            </p>
          </div>

          <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink dark:text-paper">访问统计</h3>
              <span className="text-3xl font-bold text-ink-50 dark:text-gray-300">{stats?.pageViews || 0}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70 dark:text-gray-400">
              总访问量
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
    </AdminLayout>
  );
};

export default AdminDashboard;
