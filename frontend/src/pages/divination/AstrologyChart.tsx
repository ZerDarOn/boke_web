import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDivination } from '@/hooks/queries/divination';

// ============ 十二星座数据 ============
interface ZodiacSign {
  name: string;
  symbol: string;
  element: '火' | '土' | '风' | '水';
  dates: string;
  traits: string[];
  description: string;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    name: '白羊座',
    symbol: '♈',
    element: '火',
    dates: '3.21 - 4.19',
    traits: ['冲动', '勇敢', '直率', '领导力', '热情'],
    description:
      '黄道第一宫，火星守护。白羊座如初春的烈焰，是天生的开拓者与战士。他们直来直去，不畏挑战，却也容易因急躁而错失风景。',
  },
  {
    name: '金牛座',
    symbol: '♉',
    element: '土',
    dates: '4.20 - 5.20',
    traits: ['稳重', '执着', '务实', '感官', '占有欲'],
    description:
      '金星守护的土象星座。金牛如沉静的大地，追求物质与感官的安稳。他们慢热而坚定，认定的事便如山岳不可撼动。',
  },
  {
    name: '双子座',
    symbol: '♊',
    element: '风',
    dates: '5.21 - 6.21',
    traits: ['灵动', '善变', '机智', '好奇', '善辩'],
    description:
      '水星守护的风象星座。双子座是讯息的信使，思维如风般迅捷。他们能在不同角色间自如切换，却也容易被新鲜事物牵引。',
  },
  {
    name: '巨蟹座',
    symbol: '♋',
    element: '水',
    dates: '6.22 - 7.22',
    traits: ['敏感', '念旧', '顾家', '温柔', '防御'],
    description:
      '月亮守护的水象星座。巨蟹如潮汐般情绪起伏，外壳坚硬、内心柔软。他们守护所爱之人，渴望情感的归属与安全。',
  },
  {
    name: '狮子座',
    symbol: '♌',
    element: '火',
    dates: '7.23 - 8.22',
    traits: ['自信', '骄傲', '慷慨', '戏剧性', '王者'],
    description:
      '太阳守护的火象星座。狮子座天生自带光芒，渴望成为众人瞩目的中心。他们慷慨大气，却也容易陷入自负与虚荣。',
  },
  {
    name: '处女座',
    symbol: '♍',
    element: '土',
    dates: '8.23 - 9.22',
    traits: ['细致', '完美主义', '理性', '服务', '批判'],
    description:
      '水星守护的土象星座。处女座是黄道的工匠，追求精确与秩序。他们善于分析与服务，却也容易因苛求完美而焦虑。',
  },
  {
    name: '天秤座',
    symbol: '♎',
    element: '风',
    dates: '9.23 - 10.23',
    traits: ['优雅', '犹豫', '和谐', '审美', '社交'],
    description:
      '金星守护的风象星座。天秤座是美的追求者与平衡的化身。他们擅长协调关系，却常在选择之间举棋不定。',
  },
  {
    name: '天蝎座',
    symbol: '♏',
    element: '水',
    dates: '10.24 - 11.22',
    traits: ['深邃', '执着', '神秘', '洞察', '占有'],
    description:
      '冥王星守护的水象星座。天蝎如深海般神秘，情感浓烈而极致。他们洞察人性，爱恨分明，是黄道中最具力量的灵魂。',
  },
  {
    name: '射手座',
    symbol: '♐',
    element: '火',
    dates: '11.23 - 12.21',
    traits: ['自由', '乐观', '哲学', '冒险', '直率'],
    description:
      '木星守护的火象星座。射手座是永远的旅人，向往远方与真理。他们热爱自由、追求智慧，却容易被理想冲昏现实。',
  },
  {
    name: '摩羯座',
    symbol: '♑',
    element: '土',
    dates: '12.22 - 1.19',
    traits: ['坚毅', '野心', '克制', '务实', '责任感'],
    description:
      '土星守护的土象星座。摩羯座如攀登高山的山羊，目标坚定、步步为营。他们重视责任与成就，是黄道的建设者。',
  },
  {
    name: '水瓶座',
    symbol: '♒',
    element: '风',
    dates: '1.20 - 2.18',
    traits: ['独立', '革新', '理性', '疏离', '博爱'],
    description:
      '天王星守护的风象星座。水瓶座是未来的预言者，思想超前、不拘一格。他们关怀群体却保持个体的独立与距离。',
  },
  {
    name: '双鱼座',
    symbol: '♓',
    element: '水',
    dates: '2.19 - 3.20',
    traits: ['梦幻', '共情', '艺术', '逃避', '慈悲'],
    description:
      '海王星守护的水象星座。双鱼座是黄道的终点，承载着所有星座的灵性。他们如水般包容万物，是浪漫与艺术的化身。',
  },
];

// 元素对应颜色
const ELEMENT_COLORS: Record<ZodiacSign['element'], string> = {
  火: '#ff6b3d',
  土: '#d4a76a',
  风: '#9dd9ff',
  水: '#5ec8d6',
};

// ============ 太阳星座计算（简化） ============
function getSunSign(month: number, day: number): ZodiacSign {
  // 月份 - 1 索引: 每个星座的边界（>= 视为下一星座起点）
  const boundaries: Record<number, number> = {
    1: 20, // 水瓶 1.20
    2: 19, // 双鱼 2.19
    3: 21, // 白羊 3.21
    4: 20, // 金牛 4.20
    5: 21, // 双子 5.21
    6: 22, // 巨蟹 6.22
    7: 23, // 狮子 7.23
    8: 23, // 处女 8.23
    9: 23, // 天秤 9.23
    10: 24, // 天蝎 10.24
    11: 23, // 射手 11.23
    12: 22, // 摩羯 12.22
  };
  // 起始星座索引（从摩羯开始，因为 1.1-1.19 属摩羯）
  const monthStartIndex: Record<number, number> = {
    1: 9, // 摩羯
    2: 10, // 水瓶
    3: 11, // 双鱼
    4: 0, // 白羊
    5: 1, // 金牛
    6: 2, // 双子
    7: 3, // 巨蟹
    8: 4, // 狮子
    9: 5, // 处女
    10: 6, // 天秤
    11: 7, // 天蝎
    12: 8, // 射手
  };

  const startIdx = monthStartIndex[month];
  const isAfterBoundary = day >= boundaries[month];
  const idx = isAfterBoundary ? (startIdx + 1) % 12 : startIdx;
  return ZODIAC_SIGNS[idx];
}

// 月亮/上升：基于生日 + 时间的伪随机（简化，但稳定）
function getDerivedSign(seed: string, offset: number): ZodiacSign {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const idx = (Math.abs(hash) + offset) % 12;
  return ZODIAC_SIGNS[idx];
}

// ============ 星点背景 ============
function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        delay: Math.random() * 3,
        duration: Math.random() * 2 + 2,
        opacity: Math.random() * 0.5 + 0.2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: 'var(--color-neon)',
            opacity: s.opacity,
            animation: `astro-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ============ 星盘 SVG ============
interface PlanetMark {
  label: string;
  angle: number; // 角度（度）
  radius: number; // 距中心比例 0~1
  color: string;
}

interface ChartProps {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  highlight: number | null; // 高亮的星座索引
  onSelect: (idx: number) => void;
  generating: boolean;
}

function AstrologyChartSVG({ sunSign, moonSign, risingSign, highlight, onSelect, generating }: ChartProps) {
  const cx = 200;
  const cy = 200;
  const rOuter = 180;
  const rMid = 140;
  const rInner = 80;
  const rCore = 30;

  // 行星标记（太阳、月亮、上升三个固定，其余伪随机散布）
  const planets: PlanetMark[] = useMemo(() => {
    const sunIdx = ZODIAC_SIGNS.findIndex((s) => s.name === sunSign.name);
    const moonIdx = ZODIAC_SIGNS.findIndex((s) => s.name === moonSign.name);
    const risingIdx = ZODIAC_SIGNS.findIndex((s) => s.name === risingSign.name);
    // 星座索引 0 对应外环顶部，每宫 30 度，宫中心角度
    const idxToAngle = (idx: number) => idx * 30 - 90 + 15;
    const extra = ['水', '金', '火', '木', '土'].map((l, i) => ({
      label: l,
      angle: (i * 67 + 23) % 360,
      radius: 0.45 + (i % 3) * 0.12,
      color: 'rgba(255,255,255,0.55)',
    }));
    return [
      {
        label: '日',
        angle: idxToAngle(sunIdx),
        radius: 0.55,
        color: '#ffd76b',
      },
      {
        label: '月',
        angle: idxToAngle(moonIdx),
        radius: 0.5,
        color: '#9dd9ff',
      },
      {
        label: '升',
        angle: idxToAngle(risingIdx),
        radius: 0.62,
        color: '#ff6b3d',
      },
      ...extra,
    ];
  }, [sunSign, moonSign, risingSign]);

  // 十二宫分割角度（每 30 度）
  const sectorLines = Array.from({ length: 12 }, (_, i) => i * 30 - 90);

  // 对宫连线（0-6, 1-7 ...）
  const oppositionPairs = [
    [0, 6],
    [1, 7],
    [2, 8],
    [3, 9],
    [4, 10],
    [5, 11],
  ];

  // 十二宫位名称
  const houseNames = [
    '一宫·命',
    '二宫·财',
    '三宫·兄',
    '四宫·家',
    '五宫·子',
    '六宫·奴',
    '七宫·偶',
    '八宫·疾',
    '九宫·迁',
    '十宫·官',
    '十一宫·福',
    '十二宫·玄',
  ];

  const polarToXY = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full"
      style={{
        filter: 'drop-shadow(0 0 20px rgba(0,255,102,0.15))',
        transform: generating ? 'scale(0)' : 'scale(1)',
        opacity: generating ? 0 : 1,
        transition: 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease',
      }}
    >
      <defs>
        <radialGradient id="chart-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-neon)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-neon)" stopOpacity="0" />
        </radialGradient>
        <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 中心辉光 */}
      <circle cx={cx} cy={cy} r={rCore * 2.5} fill="url(#chart-core-glow)" />

      {/* 对宫连线（半透明虚线） */}
      {oppositionPairs.map(([a, b]) => {
        const angleA = a * 30 - 90 + 15;
        const angleB = b * 30 - 90 + 15;
        const pa = polarToXY(angleA, rInner);
        const pb = polarToXY(angleB, rInner);
        return (
          <line
            key={`opp-${a}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="var(--color-neon)"
            strokeWidth="0.5"
            strokeOpacity="0.15"
            strokeDasharray="3 4"
          />
        );
      })}

      {/* 外环 */}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="var(--color-neon)" strokeWidth="1" strokeOpacity="0.5" />
      {/* 中环 */}
      <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="var(--color-secondary)" strokeWidth="0.6" strokeOpacity="0.4" />
      {/* 内环 */}
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="var(--color-neon)" strokeWidth="0.5" strokeOpacity="0.3" />
      {/* 核心 */}
      <circle cx={cx} cy={cy} r={rCore} fill="none" stroke="var(--color-neon)" strokeWidth="0.5" strokeOpacity="0.5" />
      <circle cx={cx} cy={cy} r={2} fill="var(--color-neon)" />

      {/* 外环与中环之间的分割线 */}
      {sectorLines.map((angle, i) => {
        const outer = polarToXY(angle, rOuter);
        const inner = polarToXY(angle, rMid);
        return (
          <line
            key={`div-${i}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="var(--color-neon)"
            strokeWidth="0.5"
            strokeOpacity="0.4"
          />
        );
      })}

      {/* 中环与内环之间的分割线 */}
      {sectorLines.map((angle, i) => {
        const outer = polarToXY(angle, rMid);
        const inner = polarToXY(angle, rInner);
        return (
          <line
            key={`div2-${i}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="var(--color-secondary)"
            strokeWidth="0.4"
            strokeOpacity="0.3"
          />
        );
      })}

      {/* 外环：十二星座符号（可点击） */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const angle = i * 30 - 90 + 15; // 每宫中心
        const pos = polarToXY(angle, (rOuter + rMid) / 2);
        const isHighlight = highlight === i;
        const elementColor = ELEMENT_COLORS[sign.element];
        return (
          <g
            key={`sign-${i}`}
            onClick={() => onSelect(i)}
            className="cursor-pointer"
            style={{ transition: 'opacity 0.3s' }}
          >
            {/* 点击热区 */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={16}
              fill={isHighlight ? elementColor : 'transparent'}
              fillOpacity={isHighlight ? 0.18 : 0}
              stroke={isHighlight ? elementColor : 'transparent'}
              strokeWidth="0.5"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="20"
              fill={isHighlight ? elementColor : 'rgba(255,255,255,0.7)'}
              style={{
                fontFamily: 'var(--font-serif)',
                filter: isHighlight ? `drop-shadow(0 0 6px ${elementColor})` : 'none',
                transition: 'fill 0.3s, filter 0.3s',
              }}
            >
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* 中环：十二宫位名 */}
      {houseNames.map((name, i) => {
        const angle = i * 30 - 90 + 15;
        const pos = polarToXY(angle, (rMid + rInner) / 2);
        return (
          <text
            key={`house-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6"
            fill="rgba(255,255,255,0.4)"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
          >
            {name}
          </text>
        );
      })}

      {/* 内环：行星标记 */}
      {planets.map((p, i) => {
        const pos = polarToXY(p.angle, rInner * p.radius + rCore * 0.4);
        return (
          <g key={`planet-${i}`} filter="url(#planet-glow)">
            <circle cx={pos.x} cy={pos.y} r={2.5} fill={p.color} />
            <circle cx={pos.x} cy={pos.y} r={4.5} fill="none" stroke={p.color} strokeWidth="0.4" strokeOpacity="0.4" />
            <text
              x={pos.x}
              y={pos.y - 6}
              textAnchor="middle"
              fontSize="5"
              fill={p.color}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============ 主组件 ============
interface ChartResult {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
}

export default function AstrologyChart() {
  const navigate = useNavigate();
  const createDivination = useCreateDivination();

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [question, setQuestion] = useState('');

  const [result, setResult] = useState<ChartResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedSignIdx, setSelectedSignIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  // 生成星盘
  const handleGenerate = () => {
    setError('');
    if (!birthDate) {
      setError('请输入出生日期');
      return;
    }
    const [yearStr, monthStr, dayStr] = birthDate.split('-');
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      setError('出生日期格式有误');
      return;
    }

    setGenerating(true);
    setSelectedSignIdx(null);

    // 模拟"运算"延迟
    window.setTimeout(() => {
      const sunSign = getSunSign(month, day);
      const seed = `${birthDate}-${birthTime}-${yearStr}`;
      const moonSign = getDerivedSign(seed, Number(yearStr) % 12);
      const risingSign = getDerivedSign(`${seed}-rising`, (Number(yearStr) + 7) % 12);

      const res: ChartResult = { sunSign, moonSign, risingSign };
      setResult(res);
      setGenerating(false);

      // 默认高亮太阳星座
      const sunIdx = ZODIAC_SIGNS.findIndex((s) => s.name === sunSign.name);
      setSelectedSignIdx(sunIdx);

      // 记录到后端（不阻塞 UI；失败静默）
      createDivination.mutate({
        type: 'ASTROLOGY',
        question: question || undefined,
        result: {
          birthDate,
          birthTime,
          birthPlace: birthPlace || undefined,
          sunSign: sunSign.name,
          moonSign: moonSign.name,
          risingSign: risingSign.name,
          chartData: {
            planets: [
              { name: '太阳', sign: sunSign.name, element: sunSign.element },
              { name: '月亮', sign: moonSign.name, element: moonSign.element },
              { name: '上升', sign: risingSign.name, element: risingSign.element },
            ],
          },
        },
      });
    }, 900);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedSignIdx(null);
    setGenerating(false);
  };

  const selectedSign = selectedSignIdx !== null ? ZODIAC_SIGNS[selectedSignIdx] : null;

  return (
    <div className="relative min-h-screen overflow-y-auto" style={{ background: '#05060a' }}>
      {/* 闪烁星点 */}
      <StarField />

      {/* 内联关键帧动画 */}
      <style>{`
        @keyframes astro-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes astro-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* 顶部：返回 + 标题 */}
        <header className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-neon hover:border-neon/40 transition-colors"
            aria-label="返回"
          >
            <span className="font-mono text-lg">←</span>
          </button>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neon/70">/ ASTROLOGY</div>
            <h1 className="font-serif font-black text-3xl md:text-4xl text-white tracking-tight">星相</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 opacity-50">
            <div className="h-px w-8 bg-neon/40" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">NATAL CHART</span>
          </div>
        </header>

        {/* 表单 */}
        {!result && (
          <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">STEP 01</div>
              <h2 className="font-serif text-xl text-white/90">输入你的出生信息</h2>
              <p className="font-serif text-sm text-white/40 mt-1 italic">星辰于此刻定格，命运自此展开</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">
                  出生日期 *
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">
                  出生时间
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">
                  出生地点
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="城市 / 经纬度（可选）"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40 block mb-2">
                  心之所问
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="可留空"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 font-mono text-xs text-red-400/80">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-6 w-full md:w-auto px-8 py-3 rounded-lg font-serif text-white tracking-wide transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--color-neon) 0%, var(--color-secondary) 100%)',
                boxShadow: '0 8px 30px hsl(var(--color-neon-hsl) / 0.2)',
              }}
            >
              {generating ? '推演中…' : '铸造星盘'}
            </button>
          </section>
        )}

        {/* 结果：星盘 + 三大星座概览 */}
        {result && (
          <section className="space-y-8">
            {/* 星盘 SVG */}
            <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-sm">
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
                NATAL WHEEL
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--color-neon)', animation: 'astro-spin-slow 8s linear infinite' }}
                />
                <span className="font-mono text-[10px] uppercase tracking-widest text-neon/70">LIVE</span>
              </div>

              <div className="aspect-square max-w-md mx-auto">
                <AstrologyChartSVG
                  sunSign={result.sunSign}
                  moonSign={result.moonSign}
                  risingSign={result.risingSign}
                  highlight={selectedSignIdx}
                  onSelect={(i) => setSelectedSignIdx(i)}
                  generating={generating}
                />
              </div>

              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
                · 点击外环符号查看星座详情 ·
              </p>
            </div>

            {/* 三大星座概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: '太阳星座', key: 'SUN', sign: result.sunSign, accent: '#ffd76b' },
                { label: '月亮星座', key: 'MOON', sign: result.moonSign, accent: '#9dd9ff' },
                { label: '上升星座', key: 'RISING', sign: result.risingSign, accent: '#ff6b3d' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      {item.key}
                    </span>
                    <span
                      className="text-2xl font-serif"
                      style={{ color: item.accent, filter: `drop-shadow(0 0 6px ${item.accent}80)` }}
                    >
                      {item.sign.symbol}
                    </span>
                  </div>
                  <div className="font-serif text-lg text-white mb-1">{item.label}</div>
                  <div className="font-serif font-bold text-xl text-white/90">{item.sign.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mt-1">
                    {item.sign.dates} · {item.sign.element}象
                  </div>
                </div>
              ))}
            </div>

            {/* 星座详情面板 */}
            {selectedSign && (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="text-4xl font-serif flex-shrink-0"
                    style={{
                      color: ELEMENT_COLORS[selectedSign.element],
                      filter: `drop-shadow(0 0 10px ${ELEMENT_COLORS[selectedSign.element]}80)`,
                    }}
                  >
                    {selectedSign.symbol}
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      {selectedSign.element}象 · {selectedSign.dates}
                    </div>
                    <h3 className="font-serif font-black text-2xl text-white">{selectedSign.name}</h3>
                  </div>
                </div>

                <p className="font-serif text-white/70 leading-relaxed mb-4">
                  {selectedSign.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedSign.traits.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 text-white/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 底部：重新占卜 */}
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-lg border border-white/15 font-serif text-white/70 tracking-wide hover:border-neon/50 hover:text-neon transition-colors"
              >
                重新占卜
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
