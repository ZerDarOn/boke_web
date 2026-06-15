import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';


const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 路由变化时自动收起移动端侧边栏
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // 延迟显示loading，避免闪烁
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowLoading(true);
      }, 500); // 500ms后才显示loading
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    // 验证完成后：未登录或非管理员都跳回登录页
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, loading, navigate]);

  const menuItems = [
    { icon: '📊', label: '仪表盘', path: '/admin/dashboard' },
    { icon: '📝', label: '文章管理', path: '/admin/posts' },
    { icon: '🚀', label: '项目管理', path: '/admin/projects' },
    { icon: '🎬', label: '动漫管理', path: '/admin/anime' },
    { icon: '🎮', label: '游戏管理', path: '/admin/games' },
    { icon: '📷', label: '相册管理', path: '/admin/gallery' },
    { icon: '📔', label: '长日记管理', path: '/admin/diary' },
    { icon: '💭', label: '短日记管理', path: '/admin/short-diary' },
    { icon: '🌌', label: '宇宙图管理', path: '/admin/universe' },
    { icon: '🎯', label: '宇宙图可视化', path: '/admin/universe-visual' },
    { icon: '⚔️', label: '技能管理', path: '/admin/skills' },
    { icon: '📅', label: '时间线管理', path: '/admin/timeline' },
    { icon: '📡', label: '当前状态管理', path: '/admin/current-status' },
    { icon: '📚', label: '历史项目管理', path: '/admin/history' },
    { icon: '🕸️', label: '网络管理', path: '/admin/network' },
     { icon: '📢', label: '公告管理', path: '/admin/announcements' },
     { icon: '👥', label: '用户管理', path: '/admin/users' },
       { icon: '⚡', label: '最新动态', path: '/admin/activities' },
        { icon: '📝', label: '内容初始化', path: '/admin/import' },
        { icon: '📤', label: '内容导出', path: '/admin/export' },
        { icon: '📁', label: '文件管理', path: '/admin/files' },
        { icon: '⚙️', label: '系统设置', path: '/admin/settings' },
     ];

  // 根据当前路由动态设置激活菜单
  const getActiveMenu = () => {
    const currentPath = location.pathname;
    if (currentPath === '/admin') return '/admin/dashboard';
    return currentPath;
  };

  const activeMenu = getActiveMenu();

  // 只在延迟后才显示loading，避免闪烁
  if (showLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">验证登录状态...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="text-2xl">{!user ? '未登录，跳转中...' : '无管理员权限，跳转中...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5 dark:bg-black/50 admin-cursor-area">
      {/* 光标由全局 CyberCursor 统一渲染 */}

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar：移动端抽屉，桌面端常驻 */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            🎛 管理后台
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="关闭菜单"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
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
        <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={() => navigate('/')}
            className="w-full text-center py-2 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            ← 返回网站首页
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 md:p-8">
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-3 bg-white rounded-xl px-4 md:px-6 py-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="打开菜单"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {menuItems.find(item => item.path === activeMenu)?.label || '管理后台'}
            </h1>
          </div>
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
