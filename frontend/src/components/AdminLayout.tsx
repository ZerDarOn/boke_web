import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
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

  // 根据当前路由动态设置激活菜单
  const getActiveMenu = () => {
    const currentPath = location.pathname;
    if (currentPath === '/admin') return '/admin/dashboard';
    return currentPath;
  };

  const activeMenu = getActiveMenu();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="text-2xl">检查登录状态...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="text-2xl">未登录，跳转中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5 dark:bg-black/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-white">
            🎛 管理后台
          </h2>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeMenu === item.path
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={() => navigate('/')}
            className="w-full text-center py-2 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            ← 返回网站首页
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {menuItems.find(item => item.path === activeMenu)?.label || '管理后台'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-medium">
              {user?.displayName || '管理员'}
            </span>
            <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm font-semibold text-blue-700">
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
