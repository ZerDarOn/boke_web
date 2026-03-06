import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * 自定义霓虹光标组件 - 在深色管理后台中更显眼
 */
const NeonCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  return (
    <>
      {/* 隐藏默认光标 */}
      <style>{`
        .admin-cursor-area {
          cursor: none !important;
        }
        .admin-cursor-area * {
          cursor: none !important;
        }
        .admin-cursor-area a,
        .admin-cursor-area button,
        .admin-cursor-area input,
        .admin-cursor-area textarea,
        .admin-cursor-area select {
          cursor: none !important;
        }
      `}</style>
      
      {/* 中心点 - 实心霓虹绿 */}
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <div className="w-3 h-3 bg-neon rounded-full shadow-[0_0_10px_#10b981,0_0_20px_#10b981,0_0_30px_#10b981]" />
      </div>
      
      {/* 外圈光环 */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 0.6 : 0,
          transition: 'opacity 0.15s ease, transform 0.1s ease',
        }}
      >
        <div className="w-8 h-8 border-2 border-neon rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
      </div>

      {/* 十字准星 - 增强可见性 */}
      <div
        className="fixed pointer-events-none z-[9997]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 0.4 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <div className="absolute w-6 h-[2px] bg-neon/80 -translate-x-1/2" />
        <div className="absolute w-[2px] h-6 bg-neon/80 -translate-y-1/2" />
      </div>
    </>
  );
};

const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

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

  useEffect(() => {
    // 只有在验证完成后且未登录才跳转
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
        <div className="text-2xl">未登录，跳转中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink/5 dark:bg-black/50 admin-cursor-area">
      {/* 霓虹光标 */}
      <NeonCursor />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            🎛 管理后台
          </h2>
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
