import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// ============ Canvas 粒子背景 ============
function DivinationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 25000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const neon = getComputedStyle(document.documentElement).getPropertyValue('--color-neon').trim() || '#00ff66';

      // 粒子
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${neon}${Math.round(p.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      // 连线
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = neon;
            ctx.globalAlpha = (1 - dist / 140) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ background: '#05060a' }}
    />
  );
}

// ============ 卦象装饰 SVG ============
function BaguaSVG({ className = '' }: { className?: string }) {
  const lines = [
    [1, 1, 1], // 乾
    [0, 0, 0], // 坤
  ];
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      {/* 外圆 */}
      <circle cx="50" cy="50" r="45" strokeWidth="1" opacity="0.3" />
      {/* 太极 */}
      <path d="M50 10 A20 20 0 0 1 50 50 A20 20 0 0 0 50 90 A40 40 0 0 1 50 10 Z" opacity="0.2" />
      {/* 六爻装饰 */}
      {lines.map((line, li) =>
        line.map((yao, yi) => (
          <line
            key={`${li}-${yi}`}
            x1={30}
            x2={70}
            y1={35 + li * 12 + yi * 4}
            y2={35 + li * 12 + yi * 4}
            strokeWidth="3"
            opacity={yao ? 0.6 : 0.3}
            strokeDasharray={yao ? 'none' : '8 4'}
          />
        ))
      )}
    </svg>
  );
}

// ============ 塔罗牌装饰 SVG ============
function TarotSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      {/* 牌框 */}
      <rect x="25" y="15" width="50" height="70" rx="4" strokeWidth="1" opacity="0.4" />
      {/* 内框 */}
      <rect x="30" y="22" width="40" height="56" rx="2" strokeWidth="0.5" opacity="0.2" />
      {/* 星月符号 */}
      <circle cx="50" cy="40" r="8" strokeWidth="1" opacity="0.5" />
      <path d="M46 37 Q52 37 52 43 Q48 41 46 37 Z" fill="currentColor" opacity="0.3" />
      {/* 底部装饰 */}
      <line x1="35" y1="65" x2="65" y2="65" strokeWidth="0.5" opacity="0.3" />
      <line x1="38" y1="69" x2="62" y2="69" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="73" r="2" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ============ 星盘装饰 SVG ============
function AstrologySVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      {/* 三重圆 */}
      <circle cx="50" cy="50" r="42" strokeWidth="0.5" opacity="0.3" />
      <circle cx="50" cy="50" r="32" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="50" r="22" strokeWidth="0.5" opacity="0.15" />
      {/* 十二宫分割线 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={50 + 22 * Math.cos(angle)}
            y1={50 + 22 * Math.sin(angle)}
            x2={50 + 42 * Math.cos(angle)}
            y2={50 + 42 * Math.sin(angle)}
            strokeWidth="0.5"
            opacity="0.2"
          />
        );
      })}
      {/* 行星标记 */}
      <circle cx="50" cy="18" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="78" cy="45" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="30" cy="60" r="1.5" fill="currentColor" opacity="0.3" />
      {/* 中心点 */}
      <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// ============ 三扇门数据 ============
const DOORS = [
  {
    type: 'TAROT' as const,
    title: '塔罗',
    subtitle: 'TAROT',
    desc: '洗牌、切牌、抽牌\n聆听牌面的低语',
    path: '/divination/tarot',
    Icon: TarotSVG,
    accent: 'var(--color-neon)',
  },
  {
    type: 'ICHING' as const,
    title: '易卦',
    subtitle: 'ICHING',
    desc: '铜钱起卦，六爻成象\n推演吉凶消长之理',
    path: '/divination/iching',
    Icon: BaguaSVG,
    accent: 'var(--color-secondary)',
  },
  {
    type: 'ASTROLOGY' as const,
    title: '星相',
    subtitle: 'ASTROLOGY',
    desc: '日月星辰，黄道十二宫\n窥探命运的天穹图谱',
    path: '/divination/astrology',
    Icon: AstrologySVG,
    accent: 'var(--color-neon)',
  },
];

export default function Divination() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DivinationCanvas />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-16 md:py-24">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon mb-4">
            / DIVINATION CHAMBER
          </div>
          <h1 className="font-serif font-black text-4xl md:text-6xl text-white tracking-tight mb-3">
            占卜屋
          </h1>
          <p className="font-serif text-white/40 text-sm md:text-base tracking-wide">
            虚空之中，自有回响
          </p>
          {/* 装饰线 */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-px w-12 bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-slow" />
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>

        {/* 三扇门 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
          {DOORS.map((door, i) => {
            const isHovered = hovered === i;
            return (
              <button
                key={door.type}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(door.path)}
                className="group relative bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:border-neon/50 overflow-hidden"
                style={{
                  boxShadow: isHovered ? `0 20px 60px hsl(var(--color-neon-hsl) / 0.12)` : undefined,
                }}
              >
                {/* 顶部强调线 */}
                <div
                  className="absolute top-0 left-0 right-0 h-px transition-all duration-500"
                  style={{
                    background: door.accent,
                    opacity: isHovered ? 1 : 0.2,
                  }}
                />

                {/* 网格背景纹理 */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* SVG 图标 */}
                <door.Icon
                  className="w-24 h-24 mb-6 transition-transform duration-500 group-hover:scale-110"
                />

                {/* 标题 */}
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  {door.subtitle}
                </div>
                <h2 className="font-serif font-black text-2xl text-white mb-4">
                  {door.title}
                </h2>

                {/* 描述 */}
                <p className="font-serif text-white/40 text-sm whitespace-pre-line leading-relaxed">
                  {door.desc}
                </p>

                {/* 底部装饰 */}
                <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neon">
                    Enter
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
                </div>

                {/* 右上角赛博印章 */}
                <div className="absolute top-4 right-4 w-8 h-8 border border-white/10 rounded flex items-center justify-center group-hover:border-neon/30 transition-colors">
                  <span className="font-mono text-[9px] text-white/20 group-hover:text-neon/50 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 登录提示 */}
        {!user && (
          <div className="mt-12 text-center">
            <p className="font-mono text-xs text-white/30 tracking-wide">
              · 占卜结果需登录后方可记录 ·
            </p>
          </div>
        )}

        {/* 底部 */}
        <div className="mt-auto pt-16">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-8 bg-white/10" />
            <span className="font-serif text-white/20 text-xs italic">命由天定，运由心生</span>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
