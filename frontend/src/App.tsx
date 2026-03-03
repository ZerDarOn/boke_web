import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import Layout from './components/Layout';
import { LangProvider } from './contexts/LangContext';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Archives from './pages/Archives';
import Announcement from './pages/Announcement';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Skills from './pages/Skills';
import Timeline from './pages/Timeline';
import About from './pages/About';
import Network from './pages/Network';
import Dashboard from './pages/Dashboard';
import Anime from './pages/Anime';
import AnimeDetail from './pages/AnimeDetail';
import Diary from './pages/Diary';
import DiaryDetail from './pages/DiaryDetail';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminPosts from './pages/Admin/AdminPosts';
import AdminAnime from './pages/Admin/AdminAnime';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminShortDiary from './pages/Admin/AdminShortDiary';
import AdminActivities from './pages/Admin/AdminActivities';
import { AdminProjects, AdminGallery, AdminDiary, AdminSkills, AdminTimeline, AdminNetwork, AdminAnnouncements, AdminUsers } from './pages/Admin/SimpleAdminPages';

// 路由切换滚动逻辑
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  // 详情页面路径（包含 :id 的路由）
  const isDetailPage = /\/(posts|announcement|anime|diary|gallery|projects)\/.+$/.test(location.pathname);
  const isHomePage = location.pathname === '/';
  
  React.useEffect(() => {
    // 详情页：平滑滚动到100%位置
    if (isDetailPage) {
      window.scrollTo({ top: window.innerHeight, left: 0, behavior: 'smooth' });
    }
    // 其他列表页：平滑滚动到70%位置
    else if (!isHomePage) {
      window.scrollTo({ top: window.innerHeight * 0.7, left: 0, behavior: 'smooth' });
    }
    // 主页：回到顶部
    else {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [location.pathname, isHomePage, isDetailPage]);
  
  return null;
};

// 404 页面
const NotFound: React.FC = () => (
  <div className="min-h-[600px] flex items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 opacity-5 dark:opacity-3 pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-slow">
        <defs>
          <radialGradient id="inkGradient404" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#inkGradient404)" className="text-ink dark:text-white"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-ink dark:text-white"/>
      </svg>
    </div>

    <div className="text-center relative z-10">
      <div className="mb-8 relative">
        <h1 className="text-8xl md:text-9xl font-black text-ink dark:text-white mb-2 relative inline-block">
          404
          <span className="absolute -top-4 -right-4 text-neon text-sm font-mono animate-pulse">
            ERROR
          </span>
        </h1>
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-neon to-transparent"></div>
      </div>

      <p className="font-mono text-gray-500 dark:text-gray-400 text-lg mb-2">
        PAGE NOT FOUND
      </p>

      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-md mx-auto">
        您访问的页面似乎迷失在数字空间的虚无中
      </p>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link
          to="/"
          className="px-6 py-3 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
        >
          返回首页
        </Link>
        <Link
          to="/posts"
          className="px-6 py-3 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-ink dark:text-white font-mono text-sm rounded hover:border-neon transition-colors"
        >
          浏览文章
        </Link>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Layout包裹的页面 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/:id" element={<PostDetail />} />
            <Route path="archives" element={<Archives />} />
            <Route path="announcement" element={<Announcement />} />
            <Route path="announcement/:id" element={<AnnouncementDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="skills" element={<Skills />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="about" element={<About />} />
            <Route path="network" element={<Network />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="anime" element={<Anime />} />
            <Route path="anime/:id" element={<AnimeDetail />} />
            <Route path="diary" element={<Diary />} />
            <Route path="diary/:id" element={<DiaryDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="gallery/:id" element={<GalleryDetail />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Pages */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="anime" element={<AdminAnime />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="diary" element={<AdminDiary />} />
            <Route path="short-diary" element={<AdminShortDiary />} />
            <Route path="skills" element={<AdminSkills />} />
            <Route path="timeline" element={<AdminTimeline />} />
            <Route path="network" element={<AdminNetwork />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
};

export default App;
