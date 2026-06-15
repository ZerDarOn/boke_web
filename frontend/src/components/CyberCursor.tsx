import React, { useEffect, useRef, useState } from 'react';

/**
 * 统一自定义光标：墨点 + 滞后描边环 + 霓虹尾气（canvas 粒子）。
 * 前台与后台共用一套，悬停可交互元素时放大，触屏设备自动禁用。
 * 颜色取自 CSS 变量 --color-neon，随主题色实时变化。
 */
const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

const CyberCursor: React.FC = () => {
  const [enabled] = useState(() => !isTouchDevice());
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    // 仅非触屏时隐藏系统光标（配合 index.html 的 .custom-cursor-on 作用域）
    document.documentElement.classList.add('custom-cursor-on');

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    let lastX = mouse.x;
    let lastY = mouse.y;
    let visible = false;
    let hovering = false;
    let pressed = false;
    const particles: Particle[] = [];

    const neonColor = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neon')
        .trim() || '#10b981';

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) visible = true;

      const dx = mouse.x - lastX;
      const dy = mouse.y - lastY;
      const dist = Math.hypot(dx, dy);
      // 移动越快，尾气越多
      const count = Math.min(4, Math.floor(dist / 7));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          vx: -dx * 0.05 + (Math.random() - 0.5) * 0.7,
          vy: -dy * 0.05 + (Math.random() - 0.5) * 0.7,
          life: 0,
          max: 26 + Math.random() * 22,
          size: 1.5 + Math.random() * 2.5,
        });
      }
      lastX = mouse.x;
      lastY = mouse.y;

      const el = e.target as HTMLElement | null;
      hovering = !!el?.closest(
        'a, button, input, textarea, select, label, [role="button"], .cursor-pointer'
      );
    };

    const onLeave = () => { visible = false; };
    const onEnter = () => { visible = true; };
    const onDown = () => { pressed = true; };
    const onUp = () => { pressed = false; };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    let raf = 0;
    const render = () => {
      const color = neonColor();

      // 描边环平滑滞后
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;

      const dot = dotRef.current;
      const r = ringRef.current;
      if (dot) {
        dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) scale(${pressed ? 0.6 : 1})`;
        dot.style.opacity = visible ? '1' : '0';
      }
      if (r) {
        const scale = (hovering ? 1.8 : 1) * (pressed ? 0.85 : 1);
        r.style.transform = `translate(${ring.x}px, ${ring.y}px) scale(${scale})`;
        r.style.opacity = visible ? (hovering ? '1' : '0.7') : '0';
        r.style.borderColor = color;
      }

      // 尾气粒子
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        const t = 1 - p.life / p.max;
        if (t <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size * t), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = t * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      document.documentElement.classList.remove('custom-cursor-on');
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        aria-hidden
      />
      {/* 滞后描边环 */}
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 -ml-4 -mt-4 w-8 h-8 rounded-full border pointer-events-none z-[9999] mix-blend-difference will-change-transform transition-[opacity] duration-200"
        style={{ opacity: 0 }}
      />
      {/* 墨点 */}
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-neon pointer-events-none z-[9999] will-change-transform"
        style={{ opacity: 0, boxShadow: '0 0 8px var(--color-neon), 0 0 16px var(--color-neon)' }}
      />
    </>
  );
};

export default CyberCursor;
