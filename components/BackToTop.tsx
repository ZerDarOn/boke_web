import React from 'react';
import { useLocation } from 'react-router-dom';
 
interface BackToTopProps {
  color?: 'neon' | 'pink' | 'ink';
}

const BackToTop: React.FC<BackToTopProps> = ({ color = 'neon' }) => {
  const location = useLocation();
  
  // 详情页面（包含 :id 的路由）
  const isDetailPage = /\/(posts|announcement|anime|diary|gallery|projects)\/.+$/.test(location.pathname);
  
  const getButtonClass = () => {
    switch (color) {
      case 'neon':
        return 'bg-neon dark:bg-neon dark:text-white hover:bg-neon/80 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]';
      case 'pink':
        return 'bg-pink-400 dark:bg-pink-400 dark:text-white hover:bg-pink-400/80 hover:shadow-[0_0_20px_rgba(244,114,182,0.3)] dark:hover:shadow-[0_0_20px_rgba(244,114,182,0.5)]';
      case 'ink':
        return 'bg-ink dark:bg-white text-white dark:text-ink hover:bg-ink/90 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]';
      default:
        return 'bg-neon dark:bg-neon dark:text-white hover:bg-neon/80 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]';
    }
  };
 
  const handleScrollToTop = () => {
    const scrollPosition = isDetailPage ? window.innerHeight : 0;
    window.scrollTo({ top: scrollPosition, left: 0, behavior: 'smooth' });
  };
 
  return (
    <div className="text-center">
      <button
        onClick={handleScrollToTop}
        className={`group px-8 py-3 font-mono text-sm rounded transition-all duration-300 hover:-translate-y-1 ${getButtonClass()}`}
      >
        ↑ 返回顶部
      </button>
    </div>
  );
};
 
export default BackToTop;
