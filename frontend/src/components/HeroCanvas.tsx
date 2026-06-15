import React, { useEffect, useRef } from 'react';

/**
 * Hero 内置动态背景（替代旧的网格/星云/刀光三套程序生成特效）。
 * 深墨底 + 缓慢漂移的墨晕 + 霓虹星座节点连线 + 暗角。
 * 颜色跟随 --color-neon（主题色），无外链资源，触屏自动降密度。
 */
const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const resolveNeon = (): string => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--color-neon').trim();
      if (!v) return '#10b981';
      if (v.startsWith('#') || v.startsWith('hsl') || v.startsWith('rgb')) return v;
      // 退化情形：裸 hue 数字
      return `hsl(${v}, 90%, 45%)`;
    };

    interface Node { x: number; y: number; vx: number; vy: number; r: number; }
    interface Blob { x: number; y: number; r: number; vx: number; vy: number; }
    let nodes: Node[] = [];
    let blobs: Blob[] = [];
    let linkDist = 150;

    const rebuild = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const density = touch ? 32000 : 20000;
      const count = Math.max(20, Math.min(90, Math.floor((W * H) / density)));
      linkDist = Math.min(170, Math.max(110, Math.sqrt((W * H) / count) * 0.9));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      }));
      blobs = Array.from({ length: 4 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 200 + Math.random() * 240,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
      }));
    };

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };
    resize();
    window.addEventListener('resize', resize);

    // 鼠标交互：牵出星线 + 拖出星纹
    interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; }
    const sparks: Spark[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      // 仅 Hero 可见(未滚动离开)时拖出星纹
      if (window.scrollY < window.innerHeight) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (dx * dx + dy * dy > 90 && sparks.length < 90) {
          sparks.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -0.2 - Math.random() * 0.4,
            life: 0,
            max: 36 + Math.random() * 28,
            size: 1.4 + Math.random() * 2,
          });
          lastX = e.clientX;
          lastY = e.clientY;
        }
      }
    };
    const onOut = () => { mouse.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onOut);

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      if (document.visibilityState === 'hidden') return;

      const color = resolveNeon();

      // 墨底
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, W, H);

      // 漂移的墨晕（柔光）
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        ctx.globalAlpha = 0.06;
        g.addColorStop(0, color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 节点位移
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      // 连线（星座/神经网络）
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const maxD2 = linkDist * linkDist;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / linkDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 节点
      ctx.fillStyle = color;
      for (const n of nodes) {
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 鼠标牵出星线（仅 Hero 可见时）
      const heroVisible = window.scrollY < window.innerHeight;
      if (heroVisible && mouse.active) {
        const LR = 210;
        const lr2 = LR * LR;
        ctx.strokeStyle = color;
        for (const n of nodes) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < lr2) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / LR) * 0.4;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      // 鼠标拖出的星纹（十字星点，渐隐上飘）
      ctx.fillStyle = color;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vy -= 0.004;
        const t = 1 - s.life / s.max;
        if (t <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const sz = s.size * t;
        ctx.globalAlpha = t * 0.9;
        ctx.fillRect(s.x - sz, s.y - sz * 0.22, sz * 2, sz * 0.44);
        ctx.fillRect(s.x - sz * 0.22, s.y - sz, sz * 0.44, sz * 2);
      }
      ctx.globalAlpha = 1;

      // 暗角
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onOut);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />;
};

export default HeroCanvas;
