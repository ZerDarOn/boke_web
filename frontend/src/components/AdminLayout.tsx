import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const menuItems = [
    { icon: '📊', label: '仪表盘', path: '/admin/dashboard' },
    { icon: '📝', label: '文章管理', path: '/admin/posts' },
    { icon: '🚀', label: '项目管理', path: '/admin/projects' },
    { icon: '🎬', label: '动漫管理', path: '/admin/anime' },
    { icon: '📷', label: '相册管理', path: '/admin/gallery' },
    { icon: '📔', label: '日记管理', path: '/admin/diary' },
    { icon: '⚔️', label: '技能管理', path: '/admin/skills' },
    { icon: '📅', label: '时间线管理', path: '/admin/timeline' },
    { icon: '🕸️', label: '网络管理', path: '/admin/network' },
    { icon: '📢', label: '公告管理', path: '/admin/announcements' },
    { icon: '👥', label: '用户管理', path: '/admin/users' },
    { icon: '⚙️', label: '系统设置', path: '/admin/settings' },
  ];

  const [activeMenu, setActiveMenu] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5 dark:bg-black/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-ink dark:bg-black border-r border-ink/10 dark:border-gray/800">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-ink dark:text-paper">
            🎛 管理后台
          </h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => setActiveMenu(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeMenu === item.path
                    ? 'bg-ink-20 dark:bg-gray/700 text-paper dark:text-white'
                    : 'text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-gray/800'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ink/10 dark:border-gray/800">
          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-ink/70 dark:text-gray-400 hover:text-ink dark:hover:text-gray-300"
          >
            ← 返回网站首页
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink dark:text-paper">
            {menuItems.find(item => item.path === activeMenu)?.label || '管理后台'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-ink/70 dark:text-gray-400">
              {user?.displayName || '管理员'}
            </span>
            <span className="px-3 py-1 bg-ink/20 dark:bg-gray-700 rounded text-sm text-paper dark:text-white">
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
