import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Posts from './pages/Posts';
import Archives from './pages/Archives';
import Announcement from './pages/Announcement';
import Projects from './pages/Projects';
import Skills from './pages/Skills';
import Timeline from './pages/Timeline';
import About from './pages/About';
import Network from './pages/Network';
import Dashboard from './pages/Dashboard';
import Anime from './pages/Anime';
import Diary from './pages/Diary';
import Gallery from './pages/Gallery';

// 路由切换滚动到顶部
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
};

// 404 页面
const NotFound: React.FC = () => (
  <div className="min-h-[600px] flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
      <p className="font-mono text-gray-500">PAGE NOT FOUND</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* 所有页面共享 Layout */}
        <Route element={<Layout />}>
          {/* 首页 */}
          <Route path="/" element={<Home />} />
          
          {/* 文章相关 */}
          <Route path="/posts" element={<Posts />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/announcement" element={<Announcement />} />
          
          {/* 个人展示 */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/timeline" element={<Timeline />} />
          
          {/* 关于 */}
          <Route path="/about" element={<About />} />
          <Route path="/network" element={<Network />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 我的 */}
          <Route path="/anime" element={<Anime />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/gallery" element={<Gallery />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
