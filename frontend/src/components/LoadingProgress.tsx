import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 页面加载进度条组件
 * 在路由切换时显示顶部进度条
 */
export const LoadingProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 路由变化时开始加载
    setIsLoading(true);
    setProgress(0);

    // 模拟加载进度
    const timer1 = setTimeout(() => setProgress(30), 50);
    const timer2 = setTimeout(() => setProgress(60), 150);
    const timer3 = setTimeout(() => setProgress(90), 300);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  if (!isLoading && progress === 100) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[100] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-neon via-neon-dark to-neon shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: progress < 100 ? 1 : 0,
        }}
      />
    </div>
  );
};

export default LoadingProgress;
