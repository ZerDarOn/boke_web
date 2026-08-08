import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDivination } from '@/hooks/queries/divination';

/* ------------------------------------------------------------------ *
 * tarot-kit 适配层
 * 包声明在 package.json 但当前 node_modules 中缺失，因此采用动态探测 +
 * fallback 策略：优先调用 tarot-kit 的 drawCards，失败则使用内置大阿卡纳。
 * ------------------------------------------------------------------ */

interface KitCard {
  name: string;
  number?: number;
  keywords?: string[];
  meanings?: { upright?: string; reversed?: string };
}

interface DrawnCard {
  card: KitCard;
  reversed: boolean;
}

// 内置 22 张大阿卡纳 fallback 数据
const FALLBACK_DECK: KitCard[] = [
  { name: 'The Fool', number: 0, keywords: ['开始', '天真', '自由'], meanings: { upright: '崭新的旅程即将开始，带着纯真与勇气踏入未知。', reversed: '鲁莽行事，缺乏计划，需要停下来思考。' } },
  { name: 'The Magician', number: 1, keywords: ['创造', '意志', '技能'], meanings: { upright: '你拥有实现目标的一切工具，意志力将化为现实。', reversed: '才能被滥用或未发挥，警惕欺骗与操纵。' } },
  { name: 'The High Priestess', number: 2, keywords: ['直觉', '神秘', '潜意识'], meanings: { upright: '倾听内心的声音，答案隐藏在直觉之中。', reversed: '忽视直觉，被表象迷惑，秘密被揭露。' } },
  { name: 'The Empress', number: 3, keywords: ['丰饶', '母性', '创造'], meanings: { upright: '丰盛与创造力降临，生命进入繁盛期。', reversed: '过度依赖，创造力受阻，情感空虚。' } },
  { name: 'The Emperor', number: 4, keywords: ['权威', '结构', '掌控'], meanings: { upright: '建立秩序与规则，以坚定的意志掌控局面。', reversed: '专制僵化，失控，权威被挑战。' } },
  { name: 'The Hierophant', number: 5, keywords: ['传统', '信仰', '教导'], meanings: { upright: '遵循传统智慧，寻求精神导师的指引。', reversed: '打破常规，挑战体制，自由探索。' } },
  { name: 'The Lovers', number: 6, keywords: ['选择', '结合', '价值'], meanings: { upright: '重要的人生抉择，爱与和谐的结合。', reversed: '关系失衡，错误的选择，价值观冲突。' } },
  { name: 'The Chariot', number: 7, keywords: ['意志', '胜利', '前进'], meanings: { upright: '凭借坚定意志克服障碍，驶向胜利。', reversed: '方向迷失，冲动行事，内部分裂。' } },
  { name: 'Strength', number: 8, keywords: ['勇气', '耐心', '内在力量'], meanings: { upright: '以柔克刚，用耐心与慈悲驯服内心的野兽。', reversed: '自我怀疑，情绪失控，力量被压抑。' } },
  { name: 'The Hermit', number: 9, keywords: ['独处', '内省', '智慧'], meanings: { upright: '独处中孕育智慧，向内探索寻找真相。', reversed: '孤立隔绝，拒绝指引，迷失方向。' } },
  { name: 'Wheel of Fortune', number: 10, keywords: ['命运', '转折', '循环'], meanings: { upright: '命运的转盘开始转动，机遇降临。', reversed: '运势低迷，抗拒变化，厄运缠身。' } },
  { name: 'Justice', number: 11, keywords: ['公正', '因果', '真相'], meanings: { upright: '公正的裁决降临，因果自有平衡。', reversed: '不公，偏见，逃避责任。' } },
  { name: 'The Hanged Man', number: 12, keywords: ['牺牲', '暂停', '视角'], meanings: { upright: '换个角度看世界，主动的牺牲带来顿悟。', reversed: '停滞不前，无谓的牺牲，抗拒改变。' } },
  { name: 'Death', number: 13, keywords: ['终结', '转化', '重生'], meanings: { upright: '旧的事物终结，为新生命腾出空间。', reversed: '抗拒结束，无法放手，停滞腐朽。' } },
  { name: 'Temperance', number: 14, keywords: ['平衡', '调和', '耐心'], meanings: { upright: '在对立中寻找平衡，耐心地融合一切。', reversed: '失衡，过度，缺乏调和。' } },
  { name: 'The Devil', number: 15, keywords: ['束缚', '欲望', '执念'], meanings: { upright: '被物质或执念束缚，直面内心的阴暗面。', reversed: '挣脱枷锁，重获自由，觉醒。' } },
  { name: 'The Tower', number: 16, keywords: ['剧变', '崩塌', '觉醒'], meanings: { upright: '虚假的根基崩塌，突变带来觉醒。', reversed: '勉强维持，逃避真相，延迟的崩溃。' } },
  { name: 'The Star', number: 17, keywords: ['希望', '灵感', '疗愈'], meanings: { upright: '黑暗过后的希望之光，心灵的疗愈。', reversed: '绝望，信心丧失，与灵感断连。' } },
  { name: 'The Moon', number: 18, keywords: ['幻象', '恐惧', '潜意识'], meanings: { upright: '迷雾中潜行，直面潜意识深处的恐惧。', reversed: '迷雾散去，真相浮现，恐惧消散。' } },
  { name: 'The Sun', number: 19, keywords: ['喜悦', '成功', '活力'], meanings: { upright: '纯粹的喜悦与成功，阳光普照万物。', reversed: '短暂的阴霾，过度乐观，活力受阻。' } },
  { name: 'Judgement', number: 20, keywords: ['重生', '召唤', '觉醒'], meanings: { upright: '倾听内在的召唤，迎来精神的复活。', reversed: '自我批判过重，错失召唤，拒绝反省。' } },
  { name: 'The World', number: 21, keywords: ['完成', '圆满', '成就'], meanings: { upright: '一个循环圆满完成，旅程的终点即起点。', reversed: '功亏一篑，未完成的循环，停滞于终点前。' } },
];

// 英文名 -> 中文名 映射
const NAME_ZH: Record<string, string> = {
  'The Fool': '愚者', 'The Magician': '魔术师', 'The High Priestess': '女祭司',
  'The Empress': '女皇', 'The Emperor': '皇帝', 'The Hierophant': '教皇',
  'The Lovers': '恋人', 'The Chariot': '战车', 'Strength': '力量',
  'The Hermit': '隐者', 'Wheel of Fortune': '命运之轮', 'Justice': '正义',
  'The Hanged Man': '倒吊人', 'Death': '死神', 'Temperance': '节制',
  'The Devil': '恶魔', 'The Tower': '高塔', 'The Star': '星星',
  'The Moon': '月亮', 'The Sun': '太阳', 'Judgement': '审判', 'The World': '世界',
};

function drawFallback(count: number): DrawnCard[] {
  const shuffled = [...FALLBACK_DECK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    card,
    reversed: Math.random() < 0.5,
  }));
}

// 探测 tarot-kit 并在可用时调用，否则使用 fallback
async function drawCardsAdaptive(count: number): Promise<DrawnCard[]> {
  try {
    const mod: any = await import('@cometpisces/tarot-kit');
    if (typeof mod.drawCards === 'function') {
      const result = mod.drawCards(count);
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
    }
  } catch {
    // 包不可用，静默回退
  }
  return drawFallback(count);
}

/* ------------------------------------------------------------------ *
 * 类型定义
 * ------------------------------------------------------------------ */

type Stage = 'select' | 'shuffle' | 'draw' | 'reveal' | 'result';
type Spread = 'single' | 'three-card';

interface FinalCard {
  name: string;
  nameZh: string;
  reversed: boolean;
  position: string;
  keywords: string[];
  meaning: string;
  number: number;
}

const POSITIONS: Record<Spread, string[]> = {
  single: ['当下'],
  'three-card': ['过去', '现在', '未来'],
};

/* ------------------------------------------------------------------ *
 * 单张塔罗牌（支持 3D 翻转）
 * ------------------------------------------------------------------ */

interface TarotCardProps {
  flipped: boolean;
  onFlip?: () => void;
  card?: FinalCard;
  index: number;
  total: number;
}

function TarotCard({ flipped, onFlip, card, index, total }: TarotCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 位置标签 */}
      {card && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 text-center mb-3">
          {card.position}
        </div>
      )}

      {/* 牌体容器 */}
      <div
        className="relative w-full transition-transform duration-700"
        style={{
          aspectRatio: '2 / 3',
          transformStyle: 'preserve-3d',
          transform: `${flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} ${hover ? 'translateY(-16px)' : ''}`,
        }}
        onClick={() => !flipped && onFlip?.()}
      >
        {/* 牌背 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden cursor-pointer border"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: '#0a0a0a',
            borderColor: hover ? 'var(--color-neon)' : 'rgba(255,255,255,0.1)',
            boxShadow: hover ? `0 16px 48px hsl(var(--color-neon-hsl) / 0.25)` : '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* 顶部强调线 */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--color-neon)' }} />
          {/* 网格纹理 */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          {/* 内框 */}
          <div className="absolute inset-2 border border-white/10 rounded" />
          {/* 中心赛博符号 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-1/2 h-1/2" fill="none" stroke="var(--color-neon)" strokeWidth="1.5">
              <circle cx="50" cy="50" r="40" strokeWidth="1" opacity="0.3" />
              <circle cx="50" cy="50" r="28" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3" />
              {/* 八角星 */}
              <path d="M50 18 L56 44 L82 50 L56 56 L50 82 L44 56 L18 50 L44 44 Z" opacity="0.5" />
              <circle cx="50" cy="50" r="4" fill="var(--color-neon)" opacity="0.6" />
            </svg>
          </div>
          {/* 牌堆编号 */}
          <div className="absolute top-3 right-3 font-mono text-[9px] text-white/30">
            {String(total - index).padStart(2, '0')}
          </div>
          {/* 底部标签 */}
          <div className="absolute bottom-3 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
            ? ? ?
          </div>
        </div>

        {/* 牌正面 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border bg-[#0d0d0d]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: card ? 'hsl(var(--color-neon-hsl) / 0.4)' : 'rgba(255,255,255,0.1)',
            boxShadow: card ? `0 0 24px hsl(var(--color-neon-hsl) / 0.15)` : undefined,
          }}
        >
          {card && (
            <>
              {/* 顶部强调线 */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--color-neon)' }} />
              {/* 内框 */}
              <div className="absolute inset-2 border border-white/10 rounded flex flex-col items-center justify-between p-4">
                {/* 牌号 */}
                <div className="font-mono text-[10px] text-white/40 mt-1">
                  {String(card.number).padStart(2, '0')}
                </div>

                {/* 牌面文字渲染 */}
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center"
                  style={{ transform: card.reversed ? 'rotate(180deg)' : undefined }}
                >
                  {/* 赛博符号占位 */}
                  <svg viewBox="0 0 60 60" className="w-16 h-16 mb-3 opacity-70" fill="none" stroke="var(--color-neon)" strokeWidth="1">
                    <circle cx="30" cy="30" r="24" strokeWidth="0.5" opacity="0.4" />
                    <path d="M30 12 L36 27 L51 30 L36 33 L30 48 L24 33 L9 30 L24 27 Z" opacity="0.5" />
                    <circle cx="30" cy="30" r="3" fill="var(--color-neon)" opacity="0.6" />
                  </svg>
                  <div className="font-serif text-white text-sm font-bold leading-tight mb-1">
                    {card.nameZh}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                    {card.name}
                  </div>
                  {card.reversed && (
                    <div className="font-mono text-[9px] mt-2 px-2 py-0.5 rounded border" style={{ color: 'var(--color-secondary)', borderColor: 'hsl(var(--color-secondary-hsl) / 0.4)' }}>
                      逆位 / REVERSED
                    </div>
                  )}
                </div>

                {/* 关键词 */}
                <div className="flex flex-wrap gap-1 justify-center mb-1">
                  {card.keywords.map(k => (
                    <span key={k} className="font-mono text-[9px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 抽牌提示 */}
      {!flipped && (
        <div className="absolute -bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-widest text-neon animate-pulse-slow">
          ▲ 点击翻牌
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 牌阵选择卡
 * ------------------------------------------------------------------ */

interface SpreadOption {
  id: Spread;
  title: string;
  subtitle: string;
  desc: string;
  positions: string[];
}

const SPREADS: SpreadOption[] = [
  {
    id: 'single',
    title: '单张牌',
    subtitle: 'SINGLE DRAW',
    desc: '聚焦当下的核心能量',
    positions: ['当下'],
  },
  {
    id: 'three-card',
    title: '三牌阵',
    subtitle: 'THREE CARD SPREAD',
    desc: '追溯过去、洞察现在、预见未来',
    positions: ['过去', '现在', '未来'],
  },
];

/* ------------------------------------------------------------------ *
 * 主组件
 * ------------------------------------------------------------------ */

export default function TarotReading() {
  const navigate = useNavigate();
  const createMutation = useCreateDivination();

  const [stage, setStage] = useState<Stage>('select');
  const [spread, setSpread] = useState<Spread>('single');
  const [question, setQuestion] = useState('');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [finalCards, setFinalCards] = useState<FinalCard[]>([]);
  const [saved, setSaved] = useState(false);

  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
    };
  }, []);

  // 选择牌阵 -> 洗牌阶段
  const handleSelectSpread = useCallback((s: Spread) => {
    setSpread(s);
    setStage('shuffle');
  }, []);

  // 洗牌结束 -> 抽牌阶段
  const handleShuffleDone = useCallback(async () => {
    const count = spread === 'single' ? 1 : 3;
    const cards = await drawCardsAdaptive(count);
    setDrawn(cards);
    setFlipped(new Array(count).fill(false));
    setStage('draw');
  }, [spread]);

  // 洗牌阶段进入时，延时 2.5 秒后自动进入抽牌
  useEffect(() => {
    if (stage === 'shuffle') {
      shuffleTimer.current = setTimeout(() => {
        handleShuffleDone();
      }, 2500);
    }
  }, [stage, handleShuffleDone]);

  // 翻开单张牌
  const handleFlip = useCallback((index: number) => {
    setFlipped(prev => {
      const next = [...prev];
      next[index] = true;
      // 全部翻开后，延时进入结果阶段
      if (next.every(Boolean)) {
        setTimeout(() => setStage('result'), 800);
      }
      return next;
    });
  }, []);

  // 全部翻开（抽牌阶段一键全翻）
  const handleRevealAll = useCallback(() => {
    setFlipped(new Array(drawn.length).fill(true));
    setTimeout(() => setStage('result'), 800);
  }, [drawn.length]);

  // 进入结果阶段时构造最终数据并保存
  useEffect(() => {
    if (stage !== 'result' || drawn.length === 0) return;

    const positions = POSITIONS[spread];
    const cards: FinalCard[] = drawn.map((d, i) => {
      const c = d.card;
      const nameZh = NAME_ZH[c.name] ?? c.name;
      const meaning = d.reversed
        ? (c.meanings?.reversed ?? '逆位含义未知。')
        : (c.meanings?.upright ?? '正位含义未知。');
      return {
        name: c.name,
        nameZh,
        reversed: d.reversed,
        position: positions[i] ?? `第${i + 1}张`,
        keywords: c.keywords ?? [],
        meaning,
        number: c.number ?? i,
      };
    });
    setFinalCards(cards);

    // 保存记录（仅一次）
    if (!saved) {
      setSaved(true);
      createMutation.mutate({
        type: 'TAROT',
        question: question.trim() || undefined,
        result: {
          spread,
          cards: cards.map(c => ({
            name: c.name,
            reversed: c.reversed,
            position: c.position,
            meaning: c.meaning,
          })),
        },
      });
    }
  }, [stage, drawn, spread, question, saved, createMutation]);

  // 重新占卜
  const handleReset = useCallback(() => {
    setStage('select');
    setDrawn([]);
    setFlipped([]);
    setFinalCards([]);
    setQuestion('');
    setSaved(false);
  }, []);

  /* -------------------- 渲染各阶段 -------------------- */

  const count = spread === 'single' ? 1 : 3;

  return (
    <div className="relative min-h-screen" style={{ background: '#05060a' }}>
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-12 md:py-16 max-w-4xl mx-auto">
        {/* 顶部：返回 + 标题 */}
        <div className="w-full mb-12">
          <button
            onClick={() => navigate('/divination')}
            className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-neon transition-colors mb-6 flex items-center gap-2"
          >
            <span>←</span> 返回占卜屋
          </button>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon mb-3">
              / TAROT READING
            </div>
            <h1 className="font-serif font-black text-3xl md:text-5xl text-white tracking-tight mb-2">
              塔罗占卜
            </h1>
            <p className="font-serif text-white/40 text-sm tracking-wide">
              凝视牌面，聆听来自虚空的低语
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-slow" />
              <div className="h-px w-12 bg-white/20" />
            </div>
          </div>
        </div>

        {/* 阶段内容 */}
        <div className="w-full flex-1 flex flex-col items-center justify-start">

          {/* ---- 阶段 1：选择牌阵 ---- */}
          {stage === 'select' && (
            <div className="w-full max-w-2xl">
              {/* 提问输入（可选） */}
              <div className="mb-8">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">
                  你的疑问（可选）
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  maxLength={100}
                  placeholder="想问什么？留空则进行开放式占卜…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-serif text-white/80 text-sm placeholder:text-white/20 focus:border-neon/50 focus:outline-none transition-colors"
                />
              </div>

              {/* 牌阵选项 */}
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">
                选择牌阵
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPREADS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSpread(s.id)}
                    className="group relative bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 text-left transition-all duration-500 hover:-translate-y-2 hover:border-neon/50 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-neon opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <div className="relative">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">
                        {s.subtitle}
                      </div>
                      <h3 className="font-serif font-black text-2xl text-white mb-3">
                        {s.title}
                      </h3>
                      <p className="font-serif text-white/40 text-sm mb-4">
                        {s.desc}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.positions.map(p => (
                          <span key={p} className="font-mono text-[9px] uppercase tracking-widest text-neon/60 px-2 py-0.5 rounded border border-neon/20">
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-neon">
                          开始
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---- 阶段 2：洗牌动画 ---- */}
          {stage === 'shuffle' && (
            <div className="flex flex-col items-center justify-center py-20">
              {/* 洗牌牌堆效果 */}
              <div className="relative w-40 h-56 mb-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-lg border border-white/10"
                    style={{
                      background: '#0a0a0a',
                      transform: `translate(${(i - 3) * 3}px, ${(i - 3) * 2}px) rotate(${(i - 3) * 4}deg)`,
                      animation: `tarot-shuffle 0.8s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--color-neon)' }} />
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-1/2 h-1/2" fill="none" stroke="var(--color-neon)" strokeWidth="1.5">
                        <path d="M50 18 L56 44 L82 50 L56 56 L50 82 L44 56 L18 50 L44 44 Z" opacity="0.5" />
                        <circle cx="50" cy="50" r="4" fill="var(--color-neon)" opacity="0.6" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neon animate-pulse-slow">
                洗牌中… SHUFFLING
              </div>
              <p className="font-serif text-white/30 text-xs mt-3">
                静心凝视，让能量流入牌中
              </p>

              <style>{`
                @keyframes tarot-shuffle {
                  0%, 100% { transform: translate(0, 0) rotate(0deg); }
                  25% { transform: translate(8px, -6px) rotate(8deg); }
                  50% { transform: translate(-4px, 4px) rotate(-6deg); }
                  75% { transform: translate(6px, 2px) rotate(4deg); }
                }
              `}</style>
            </div>
          )}

          {/* ---- 阶段 3：抽牌 ---- */}
          {stage === 'draw' && (
            <div className="w-full flex flex-col items-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">
                DRAW YOUR {count === 1 ? 'CARD' : 'CARDS'}
              </div>
              <p className="font-serif text-white/50 text-sm mb-10">
                {count === 1 ? '点击牌背，翻开你的牌' : '依次点击牌背，翻开三张牌'}
              </p>

              {/* 牌堆 + 抽出的牌 */}
              <div className="flex items-end justify-center gap-6 md:gap-10 w-full">
                {/* 牌堆（剩余） */}
                <div className="relative w-24 h-36 md:w-28 md:h-40 flex-shrink-0">
                  {Array.from({ length: Math.max(1, 8 - flipped.filter(Boolean).length) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-md border border-white/10 bg-[#0a0a0a]"
                      style={{
                        transform: `translate(${i * 1.5}px, ${-i * 1}px)`,
                        opacity: 1 - i * 0.08,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--color-neon)' }} />
                    </div>
                  ))}
                  <div className="absolute -bottom-6 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-widest text-white/25">
                    DECK
                  </div>
                </div>

                {/* 抽出的牌位 */}
                <div className={`grid gap-4 ${count === 1 ? 'grid-cols-1' : 'grid-cols-3'} justify-items-center`}>
                  {drawn.map((_, i) => (
                    <div key={i} style={{ width: count === 1 ? '180px' : '140px' }}>
                      <TarotCard
                        flipped={flipped[i]}
                        onFlip={() => handleFlip(i)}
                        card={finalCards[i]}
                        index={i}
                        total={drawn.length}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 一键全翻 */}
              {flipped.some(f => !f) && (
                <button
                  onClick={handleRevealAll}
                  className="mt-16 font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-neon border border-white/10 hover:border-neon/40 rounded px-4 py-2 transition-colors"
                >
                  全部翻开 / REVEAL ALL
                </button>
              )}
            </div>
          )}

          {/* ---- 阶段 4：结果 ---- */}
          {stage === 'result' && finalCards.length > 0 && (
            <div className="w-full max-w-3xl">
              {/* 牌面展示 */}
              <div className="font-mono text-[10px] uppercase tracking-widest text-neon mb-6 text-center">
                / YOUR READING
              </div>

              <div className={`grid gap-6 mb-10 ${count === 1 ? 'grid-cols-1 max-w-[200px] mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
                {finalCards.map((c, i) => (
                  <div key={i} style={{ width: count === 1 ? '100%' : undefined }} className="mx-auto" >
                    <div style={{ width: count === 3 ? '160px' : undefined, margin: '0 auto' }}>
                      <TarotCard
                        flipped={true}
                        card={c}
                        index={i}
                        total={finalCards.length}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 牌义解读 */}
              <div className="space-y-4 mb-10">
                {finalCards.map((c, i) => (
                  <div
                    key={i}
                    className="bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-5"
                    style={{ boxShadow: `0 0 24px hsl(var(--color-neon-hsl) / 0.05)` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-neon/60 px-2 py-0.5 rounded border border-neon/20">
                          {c.position}
                        </span>
                        <span className="font-serif text-white font-bold">
                          {c.nameZh}
                        </span>
                        {c.reversed && (
                          <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: 'var(--color-secondary)', background: 'hsl(var(--color-secondary-hsl) / 0.1)' }}>
                            逆位
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-white/25">
                        {c.name}
                      </span>
                    </div>
                    <p className="font-serif text-white/60 text-sm leading-relaxed">
                      {c.meaning}
                    </p>
                  </div>
                ))}
              </div>

              {/* 保存状态 */}
              {createMutation.isPending && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30 mb-6">
                  正在记录占卜结果…
                </div>
              )}
              {createMutation.isSuccess && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-neon mb-6">
                  ✓ 已记录
                </div>
              )}
              {createMutation.isError && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30 mb-6">
                  记录失败，但不影响你的占卜
                </div>
              )}

              {/* 提问回显 */}
              {question.trim() && (
                <div className="text-center mb-8">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    你的问题
                  </div>
                  <p className="font-serif text-white/60 text-sm italic">
                    「{question.trim()}」
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部：重新占卜 */}
        {(stage === 'result' || stage === 'draw') && (
          <div className="mt-8">
            <button
              onClick={handleReset}
              className="font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-neon border border-white/20 hover:border-neon/50 rounded-lg px-6 py-3 transition-all duration-300 hover:-translate-y-1"
            >
              ↻ 重新占卜
            </button>
          </div>
        )}

        {/* 最底部装饰 */}
        <div className="mt-auto pt-16">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-8 bg-white/10" />
            <span className="font-serif text-white/20 text-xs italic">牌之所言，心之所映</span>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
