import React, { useEffect, useRef } from 'react';
import { defaultCursorConfig, toCursorCssValue } from '../config/cursor-config';
import { useSiteConfig } from '../hooks/useSiteConfig';

const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

const CURSOR_VARIABLES = {
  default: ['--cursor-default', 'auto'],
  pointer: ['--cursor-pointer', 'pointer'],
  text: ['--cursor-text', 'text'],
  move: ['--cursor-move', 'move'],
  resizeHorizontal: ['--cursor-resize-horizontal', 'ew-resize'],
  resizeVertical: ['--cursor-resize-vertical', 'ns-resize'],
  resizeDiagonal1: ['--cursor-resize-diagonal-1', 'nwse-resize'],
  resizeDiagonal2: ['--cursor-resize-diagonal-2', 'nesw-resize'],
} as const;

/** 应用后台管理的鼠标皮肤；可选保留轻量霓虹尾迹，触屏设备自动停用。 */
const SiteCursor: React.FC = () => {
  const { cursorConfig = defaultCursorConfig } = useSiteConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = cursorConfig.enabled && !isTouchDevice();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('custom-cursor-on');

    if (!enabled) {
      root.classList.remove('custom-cursor-skin');
      return;
    }

    root.classList.add('custom-cursor-skin');
    for (const [key, [variable, fallback]] of Object.entries(CURSOR_VARIABLES)) {
      root.style.setProperty(
        variable,
        toCursorCssValue(cursorConfig[key as keyof typeof CURSOR_VARIABLES], fallback)
      );
    }

    return () => {
      root.classList.remove('custom-cursor-skin');
      for (const [variable] of Object.values(CURSOR_VARIABLES)) {
        root.style.removeProperty(variable);
      }
    };
  }, [cursorConfig, enabled]);

  useEffect(() => {
    if (!enabled || !cursorConfig.trailEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: Particle[] = [];
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (event: MouseEvent) => {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const count = Math.min(4, Math.floor(Math.hypot(dx, dy) / 7));
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: event.clientX,
          y: event.clientY,
          vx: -dx * 0.05 + (Math.random() - 0.5) * 0.7,
          vy: -dy * 0.05 + (Math.random() - 0.5) * 0.7,
          life: 0,
          max: 26 + Math.random() * 22,
          size: 1.5 + Math.random() * 2.5,
        });
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const render = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neon').trim() || '#10b981';
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life += 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        const opacity = 1 - particle.life / particle.max;
        if (opacity <= 0) {
          particles.splice(index, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, Math.max(0.1, particle.size * opacity), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [cursorConfig.trailEnabled, enabled]);

  if (!enabled || !cursorConfig.trailEnabled) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9998]" aria-hidden />;
};

export default SiteCursor;
