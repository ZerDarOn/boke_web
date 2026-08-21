import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ArrowUpRight, BookOpen, Clock3, Moon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDivinationRecords } from '@/hooks/queries/divination';
import type { DivinationRecord, DivinationType } from '@/lib/api';

function DivinationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(48, Math.floor((canvas.width * canvas.height) / 32000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.3 + 0.08,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-neon').trim() || '#c4a574';
      particles.forEach(p => {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${accent}${Math.round(p.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
      if (!reducedMotion) animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ background: 'hsla(var(--div-bg-hsl))' }} />;
}

function TarotMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} fill="none" aria-hidden="true">
      <rect x="19" y="7" width="62" height="126" rx="6" stroke="currentColor" strokeWidth="1.5" opacity=".75" />
      <rect x="25" y="14" width="50" height="112" rx="3" stroke="currentColor" opacity=".3" />
      <circle cx="50" cy="61" r="18" stroke="currentColor" opacity=".5" />
      <path d="M50 43v36M32 61h36M38 49l24 24M62 49L38 73" stroke="currentColor" opacity=".35" />
      <circle cx="50" cy="61" r="3" fill="currentColor" opacity=".8" />
      <path d="M37 103h26M42 109h16" stroke="currentColor" opacity=".5" />
    </svg>
  );
}

function BaguaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="50" cy="50" r="38" strokeWidth="1" opacity=".5" />
      <circle cx="50" cy="50" r="22" strokeWidth="1" opacity=".35" />
      <path d="M50 12a38 38 0 0 1 0 76 19 19 0 0 0 0-38 19 19 0 0 1 0-38Z" fill="currentColor" opacity=".08" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        return <line key={i} x1={50 + 27 * Math.cos(angle)} y1={50 + 27 * Math.sin(angle)} x2={50 + 39 * Math.cos(angle)} y2={50 + 39 * Math.sin(angle)} strokeWidth="2" opacity=".45" />;
      })}
      <circle cx="50" cy="50" r="3" fill="currentColor" opacity=".7" />
    </svg>
  );
}

function AstrologyMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="50" cy="50" r="40" strokeWidth="1" opacity=".5" />
      <circle cx="50" cy="50" r="28" strokeWidth="1" opacity=".35" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={50 + 28 * Math.cos(angle)} y1={50 + 28 * Math.sin(angle)} x2={50 + 40 * Math.cos(angle)} y2={50 + 40 * Math.sin(angle)} strokeWidth=".7" opacity=".45" />;
      })}
      <circle cx="50" cy="17" r="2.5" fill="currentColor" />
      <circle cx="76" cy="65" r="2" fill="currentColor" opacity=".7" />
      <circle cx="35" cy="48" r="1.6" fill="currentColor" opacity=".6" />
    </svg>
  );
}

interface DivinationDoor {
  type: DivinationType;
  title: string;
  subtitle: string;
  description: string;
  prompt: string;
  path: string;
  Mark: ComponentType<{ className?: string }>;
}

const DOORS: DivinationDoor[] = [
  { type: 'TAROT', title: '塔罗牌', subtitle: 'TAROT / 直觉之镜', description: '让牌面照见当下的情绪、关系与选择。适合带着一个具体问题来。', prompt: '我现在真正想知道什么？', path: '/divination/tarot', Mark: TarotMark },
  { type: 'ICHING', title: '易经六爻', subtitle: 'I CHING / 变化之书', description: '从一卦六爻读出局势如何展开，动爻与变卦会告诉你变化的方向。', prompt: '这件事正在往哪里变化？', path: '/divination/iching', Mark: BaguaMark },
  { type: 'ASTROLOGY', title: '星盘', subtitle: 'ASTROLOGY / 天穹档案', description: '用出生时刻建立你的天穹坐标，理解性格底色、关系模式与内在驱动力。', prompt: '我如何更好地理解自己？', path: '/divination/astrology', Mark: AstrologyMark },
];

const TYPE_META: Record<DivinationType, { label: string; accent: string }> = {
  TAROT: { label: '塔罗牌', accent: 'text-neon' },
  ICHING: { label: '易经六爻', accent: 'text-[hsl(var(--color-secondary-hsl))]' },
  ASTROLOGY: { label: '星盘', accent: 'text-neon' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function getRecordSummary(record: DivinationRecord) {
  const result = record.result as { cards?: Array<{ nameZh?: string; name?: string }>; hexagram?: { name?: string }; sunSign?: string } | null;
  if (record.type === 'TAROT') return result?.cards?.slice(0, 3).map(card => card.nameZh ?? card.name).filter(Boolean).join(' · ') || '牌面已落定';
  if (record.type === 'ICHING') return result?.hexagram?.name || '卦象已成';
  return result?.sunSign ? `太阳落在${result.sunSign}` : '星盘已建立';
}

function RecentReadings({ records }: { records: DivinationRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="border border-dashed border-[hsla(var(--div-line-hsl)/0.18)] px-5 py-8 text-center">
        <BookOpen className="mx-auto mb-3 h-5 w-5 text-neon/70" strokeWidth={1.5} />
        <p className="font-serif text-sm text-[hsla(var(--div-text-hsl)/0.65)]">还没有留下记录</p>
        <p className="mt-1 font-mono text-[10px] tracking-wide text-[hsla(var(--div-text-hsl)/0.35)]">第一次占卜之后，这里会成为你的私人档案</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[hsla(var(--div-line-hsl)/0.1)] border-y border-[hsla(var(--div-line-hsl)/0.12)]">
      {records.slice(0, 3).map(record => (
        <article key={record.id} className="group flex w-full items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-[hsla(var(--div-line-hsl)/0.04)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[hsla(var(--div-line-hsl)/0.16)] text-neon/70">
            {record.type === 'TAROT' ? <Sparkles size={16} /> : record.type === 'ICHING' ? <BookOpen size={16} /> : <Moon size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[hsla(var(--div-text-hsl)/0.42)]"><span className={TYPE_META[record.type].accent}>{TYPE_META[record.type].label}</span><span>·</span><span>{formatDate(record.createdAt)}</span></div>
            <p className="mt-1 truncate font-serif text-sm text-[hsl(var(--div-text-hsl))]">{record.question || getRecordSummary(record)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Divination() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState<DivinationType | null>('TAROT');
  const recordsQuery = useDivinationRecords({ page: 1 }, { enabled: Boolean(user) });
  const records = recordsQuery.data?.data ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--div-bg-hsl))] text-[hsl(var(--div-text-hsl))]">
      <DivinationCanvas />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,hsl(var(--color-neon-hsl)/.12),transparent_28%),radial-gradient(circle_at_82%_58%,hsl(var(--color-secondary-hsl)/.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-16 md:px-10 md:pt-24">
        <section className="grid items-end gap-10 border-b border-[hsla(var(--div-line-hsl)/0.12)] pb-12 lg:grid-cols-[1.2fr_.8fr] lg:pb-16">
          <div>
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.38em] text-neon"><span className="h-px w-10 bg-neon/60" />Divination archive</div>
            <h1 className="max-w-3xl font-serif text-5xl font-black leading-[.95] tracking-[-.04em] md:text-8xl">占卜馆</h1>
            <p className="mt-6 max-w-xl font-serif text-base leading-8 text-[hsla(var(--div-text-hsl)/0.6)] md:text-lg">把问题交给牌、卦与星辰。这里不替你决定未来，只把此刻的线索摊开，让你看见正在发生的变化。</p>
          </div>
          <div className="max-w-sm justify-self-end border-l border-neon/40 pl-5 lg:mb-1">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[.24em] text-neon"><Clock3 size={13} />今日入馆提示</div>
            <p className="font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/0.55)]">好的问题不需要很长。先写下你最想弄清楚的那一件事，再选择最适合它的入口。</p>
          </div>
        </section>

        <section className="py-12 md:py-16" aria-labelledby="doors-title">
          <div className="mb-7 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.3em] text-neon/70">01 / CHOOSE YOUR LENS</p><h2 id="doors-title" className="mt-2 font-serif text-2xl font-bold md:text-3xl">三种看见自己的方式</h2></div><p className="hidden max-w-xs text-right font-serif text-xs leading-6 text-[hsla(var(--div-text-hsl)/.4)] md:block">没有哪一种方式更“准”，只有哪一种更适合你此刻的问题。</p></div>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr_.85fr]">
            {DOORS.map((door, index) => {
              const active = hovered === door.type;
              return (
                <button key={door.type} type="button" onMouseEnter={() => setHovered(door.type)} onFocus={() => setHovered(door.type)} onClick={() => navigate(door.path)} className={`group relative min-h-[280px] overflow-hidden border p-6 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 md:p-8 ${index === 0 ? 'lg:min-h-[360px]' : ''} ${active ? 'border-neon/60 bg-[hsla(var(--div-card-hsl)/.86)] shadow-[0_24px_70px_hsl(var(--color-neon-hsl)/.08)]' : 'border-[hsla(var(--div-line-hsl)/.14)] bg-[hsla(var(--div-card-hsl)/.62)]'}`}>
                  <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-neon/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between"><span className="font-mono text-[10px] tracking-[.28em] text-[hsla(var(--div-text-hsl)/.38)]">0{index + 1} / {door.subtitle}</span><ArrowUpRight size={17} className={`transition-all duration-300 ${active ? 'text-neon' : 'text-[hsla(var(--div-text-hsl)/.25)]'} group-hover:-translate-y-1 group-hover:translate-x-1`} /></div>
                    <door.Mark className={`mt-7 h-28 w-24 text-neon transition-transform duration-500 ${active ? 'scale-105' : ''}`} />
                    <div className="mt-auto pt-6"><h3 className="font-serif text-2xl font-bold">{door.title}</h3><p className="mt-3 max-w-sm font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/.58)]">{door.description}</p><div className="mt-5 border-t border-[hsla(var(--div-line-hsl)/.12)] pt-3 font-mono text-[10px] tracking-wide text-neon/75">适合问：{door.prompt}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-12 border-t border-[hsla(var(--div-line-hsl)/.12)] pt-10 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:pt-14">
          <div><p className="font-mono text-[10px] tracking-[.3em] text-neon/70">02 / YOUR ARCHIVE</p><h2 className="mt-2 font-serif text-2xl font-bold">最近的回响</h2><p className="mt-4 font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/.52)]">每一次占卜都是一个时间切片。站主登录后可以把结果留在私人档案里，日后回来对照变化。</p>{user ? <p className="mt-4 font-mono text-[10px] tracking-widest text-neon/70">站主已登录 · 档案仅当前账号可见</p> : <p className="mt-4 font-mono text-[10px] leading-5 tracking-widest text-[hsla(var(--div-text-hsl)/.48)]">访客无需登录即可占卜 · 本次结果不会保存到服务器</p>}</div>
          <RecentReadings records={records} />
        </section>

        <section className="mt-16 grid gap-4 border-t border-[hsla(var(--div-line-hsl)/.12)] pt-10 md:grid-cols-3">
          {[
            ['先写问题', '把模糊的焦虑变成一句可以被看见的话。'],
            ['再做选择', '塔罗看当下，易经看变化，星盘看你的长期底色。'],
            ['最后追问', 'AI 会结合这次结果解释，也允许你继续把问题问深。'],
          ].map(([title, text], i) => <div key={title} className="border-l border-neon/30 pl-4"><span className="font-mono text-[10px] text-neon/70">0{i + 1}</span><h3 className="mt-3 font-serif text-base font-bold">{title}</h3><p className="mt-2 font-serif text-xs leading-6 text-[hsla(var(--div-text-hsl)/.5)]">{text}</p></div>)}
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-[hsla(var(--div-line-hsl)/.1)] pt-5 font-mono text-[10px] tracking-[.18em] text-[hsla(var(--div-text-hsl)/.3)]"><span>INK.SPIRIT / ORACLE ROOM</span><span className="hidden md:block">命由天定，运由心生</span></footer>
      </div>
    </main>
  );
}
