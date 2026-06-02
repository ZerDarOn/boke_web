import React from 'react';
import { Loader2, FileText, Rocket, Tv, Camera, Database } from 'lucide-react';
import { useActivities } from '../../hooks/useActivities';
import { useDashboardStats } from '../../hooks/queries/dashboard';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: loading, error: queryError, refetch } = useDashboardStats();
  const error = queryError?.message ?? null;
  const { activities } = useActivities({ limit: 4 });

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
          onClick={() => refetch()}
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
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                let icon;
                let iconBg;
                
                // 根据项目名称动态选择图标
                const projectName = (activity.project || '').toLowerCase();
                if (projectName.includes('文章') || projectName.includes('post')) {
                  icon = <FileText size={24} className="text-blue-600" />;
                  iconBg = 'bg-blue-100 dark:bg-blue-900/30';
                } else if (projectName.includes('项目') || projectName.includes('project')) {
                  icon = <Rocket size={24} className="text-purple-600" />;
                  iconBg = 'bg-purple-100 dark:bg-purple-900/30';
                } else if (projectName.includes('动漫') || projectName.includes('anime')) {
                  icon = <Tv size={24} className="text-pink-600" />;
                  iconBg = 'bg-pink-100 dark:bg-pink-900/30';
                } else if (projectName.includes('照片') || projectName.includes('gallery')) {
                  icon = <Camera size={24} className="text-green-600" />;
                  iconBg = 'bg-green-100 dark:bg-green-900/30';
                } else {
                  icon = <Database size={24} className="text-gray-600" />;
                  iconBg = 'bg-gray-100 dark:bg-gray-800/30';
                }

                const statusColor = activity.status === 'DONE' 
                  ? 'text-green-600 dark:text-green-400'
                  : activity.status === 'IN_PROGRESS'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400';

                const statusText = activity.status === 'DONE'
                  ? '已完成'
                  : activity.status === 'IN_PROGRESS'
                  ? '进行中'
                  : '计划中';

                const formatDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('zh-CN');
                  } catch {
                    return dateString;
                  }
                };

                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-ink/5 dark:bg-black/20 rounded-lg hover:bg-ink/10 dark:hover:bg-black/30 transition-colors">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-ink dark:text-paper">{activity.title}</p>
                      <p className="text-sm text-ink/70 dark:text-gray-400 mt-1">
                        {activity.project} · {formatDate(activity.date)}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusColor} bg-opacity-10`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">暂无最新动态</p>
              <p className="text-sm">请前往"最新动态管理"页面添加动态</p>
            </div>
          )}
        </div>
      </div>
    );
};

export default AdminDashboard;
