import { useEffect, useRef, useState } from 'react';

/** 页面阅读进度 0–100，用于顶部进度条 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const latestProgressRef = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      rafIdRef.current = null;
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const next = height > 0 ? (winScroll / height) * 100 : 0;
      if (Math.abs(next - latestProgressRef.current) >= 0.1) {
        latestProgressRef.current = next;
        setProgress(next);
      }
    };

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(updateProgress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return progress;
}
