import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDivination } from '@/hooks/queries/divination';
import { getZodiacDeep } from './zodiac-data';
import DivinationAI from './DivinationAI';

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

// ============ 月亮星座（天文近似） ============
// 以 2000-01-06 18:14 UTC 新月为基准，月亮每日东移约 13.176°
function getMoonSign(year: number, month: number, day: number, hour: number): ZodiacSign {
  const days = (Date.UTC(year, month - 1, day, hour) - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const moonLon = ((285.0 + days * 13.176396) % 360 + 360) % 360;
  const idx = Math.floor(moonLon / 30) % 12;
  return ZODIAC_SIGNS[idx];
}

// ============ 上升星座（教学近似） ============
// 正午出生时上升≈太阳星座；此后每约 2 小时移一宫
function getRisingSign(sunIdx: number, hour: number): ZodiacSign {
  const offset = Math.round((hour - 12) / 2);
  const idx = ((sunIdx + offset) % 12 + 12) % 12;
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

      {/* 扫描线（缓慢旋转） */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - rOuter}
        stroke="var(--color-neon)"
        strokeWidth="0.6"
        strokeOpacity="0.18"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: 'astro-spin-slow 14s linear infinite',
        }}
      />

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
            <circle
              cx={pos.x}
              cy={pos.y}
              r={4.5}
              fill="none"
              stroke={p.color}
              strokeWidth="0.4"
              strokeOpacity="0.4"
              style={{ animation: `astro-pulse 2.6s ease-in-out ${i * 0.4}s infinite` }}
            />
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

// ============ 星相综合解读 ============
function buildAstroReading(
  sun: ZodiacSign,
  moon: ZodiacSign,
  rising: ZodiacSign,
  q: string,
): { summary: string; points: string[]; advice: string } {
  const points: string[] = [];
  const counts: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };
  [sun, moon, rising].forEach((s) => counts[s.element]++);
  const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1]))[0][0];
  const elementLine: Record<string, string> = {
    火: '日月升以火象为主导，你凭直觉与热情行事，天性果敢、气场外放，适合开创与冲锋，而非守成观望。',
    土: '日月升以土象为主导，你务实而坚韧，习惯以行动说话，重视看得见的成果，是值得托付的人。',
    风: '日月升以风象为主导，你思维敏捷、以交流为先，善在变化中保持灵活，但须警惕想法满腹而疏于落地。',
    水: '日月升以水象为主导，你感受力极强、重情重义，靠直觉辨识人事，情感世界正是你力量的源泉。',
  };
  points.push(elementLine[dominant]);
  points.push(`太阳落${sun.name}——你的核心自我：${sun.description}`);
  points.push(`月亮落${moon.name}——你的情感与内在需求：${moon.description}`);
  points.push(`上升落${rising.name}——外界初见你的印象：${rising.description}`);

  const advice = q
    ? `回望「${q}」：太阳告诉你"为何出发"，月亮告诉你"真正想要"，上升则决定你"如何呈现"。宜以${sun.name}的意志定方向，以${moon.name}的节奏照顾内心，再以${rising.name}的姿态与外界周旋，三者和合，事自成焉。`
    : `让三者的能量各归其位：以${sun.name}的阳光照亮前路，以${moon.name}的潮汐安顿内心，以${rising.name}的姿态走进世界。星盘只绘轨迹，舵仍在你自己手中。`;

  return {
    summary: `你的星盘由${sun.name}（太阳）、${moon.name}（月亮）、${rising.name}（上升）三根支柱构成。`,
    points,
    advice,
  };
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
      const hour = Number(birthTime.split(':')[0]) || 12;
      const moonSign = getMoonSign(Number(yearStr), month, day, hour);
      const sunIdx = ZODIAC_SIGNS.findIndex((s) => s.name === sunSign.name);
      const risingSign = getRisingSign(sunIdx, hour);

      const res: ChartResult = { sunSign, moonSign, risingSign };
      setResult(res);
      setGenerating(false);

      // 默认高亮太阳星座
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
    <div className="relative min-h-screen overflow-y-auto" style={{ background: 'hsla(var(--div-bg-hsl))' }}>
      {/* 闪烁星点 */}
      <StarField />

      {/* 内联关键帧动画 */}
      <style>{`
        @keyframes astro-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes astro-pulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.65; }
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
            className="w-10 h-10 rounded-full border border-[hsla(var(--div-line-hsl)/0.12)] flex items-center justify-center text-[hsla(var(--div-text-hsl)/0.5)] hover:text-neon hover:border-neon/40 transition-colors"
            aria-label="返回"
          >
            <span className="font-mono text-lg">←</span>
          </button>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neon/70">/ ASTROLOGY</div>
            <h1 className="font-serif font-black text-3xl md:text-4xl text-[hsl(var(--div-text-hsl))] tracking-tight">星相</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 opacity-50">
            <div className="h-px w-8 bg-neon/40" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)]">NATAL CHART</span>
          </div>
        </header>

        {/* 表单 */}
        {!result && (
          <section className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] mb-2">STEP 01</div>
              <h2 className="font-serif text-xl text-[hsla(var(--div-text-hsl)/0.9)]">输入你的出生信息</h2>
              <p className="font-serif text-sm text-[hsla(var(--div-text-hsl)/0.4)] mt-1 italic">星辰于此刻定格，命运自此展开</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] block mb-2">
                  出生日期 *
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[hsla(var(--div-card-hsl))] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 text-[hsl(var(--div-text-hsl))] font-mono text-sm focus:outline-none focus:border-neon/50 transition-colors"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] block mb-2">
                  出生时间
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full bg-[hsla(var(--div-card-hsl))] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 text-[hsl(var(--div-text-hsl))] font-mono text-sm focus:outline-none focus:border-neon/50 transition-colors"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] block mb-2">
                  出生地点
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="城市 / 经纬度（可选）"
                  className="w-full bg-[hsla(var(--div-card-hsl))] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 text-[hsl(var(--div-text-hsl))] font-mono text-sm placeholder:text-[hsla(var(--div-text-hsl)/0.2)] focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] block mb-2">
                  心之所问
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="可留空"
                  className="w-full bg-[hsla(var(--div-card-hsl))] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 text-[hsl(var(--div-text-hsl))] font-mono text-sm placeholder:text-[hsla(var(--div-text-hsl)/0.2)] focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 font-mono text-xs text-red-400/80">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-6 w-full md:w-auto px-8 py-3 rounded-lg font-serif text-[hsl(var(--div-text-hsl))] tracking-wide transition-all duration-300 disabled:opacity-50"
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
            <div className="relative bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-4 md:p-8 backdrop-blur-sm">
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)]">
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

              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)]">
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
                  className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-xl p-5 hover:border-[hsla(var(--div-line-hsl)/0.25)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)]">
                      {item.key}
                    </span>
                    <span
                      className="text-2xl font-serif"
                      style={{ color: item.accent, filter: `drop-shadow(0 0 6px ${item.accent}80)` }}
                    >
                      {item.sign.symbol}
                    </span>
                  </div>
                  <div className="font-serif text-lg text-[hsl(var(--div-text-hsl))] mb-1">{item.label}</div>
                  <div className="font-serif font-bold text-xl text-[hsla(var(--div-text-hsl)/0.9)]">{item.sign.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mt-1">
                    {item.sign.dates} · {item.sign.element}象
                  </div>
                </div>
              ))}
            </div>

            {/* 星相总论 */}
            {(() => {
              const reading = buildAstroReading(result.sunSign, result.moonSign, result.risingSign, question);
              return (
                <div className="bg-neon/[0.03] border border-neon/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm animate-fade-up">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-5">
                    / 星相总论
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.8)] text-base leading-relaxed mb-5">
                    {reading.summary}
                  </p>
                  <div className="space-y-2.5 mb-6">
                    {reading.points.map((pt, i) => (
                      <p key={i} className="flex gap-2.5 text-[hsla(var(--div-text-hsl)/0.6)] text-sm leading-relaxed">
                        <span className="text-neon shrink-0">✦</span>
                        <span className="font-serif">{pt}</span>
                      </p>
                    ))}
                  </div>
                  <div className="border-t border-[hsla(var(--div-line-hsl)/0.12)] pt-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neon/60 mb-2">
                      〔指引〕
                    </div>
                    <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] text-sm leading-relaxed">{reading.advice}</p>
                  </div>
                </div>
              );
            })()}

            {/* AI 深度解读（用户主动选择才调用） */}
            <DivinationAI
              kind="astrology"
              spread={[
                `出生信息：${birthDate || '未填写'} ${birthTime || ''}`,
                `太阳星座：${result.sunSign.name}（${result.sunSign.element}象）`,
                `月亮星座：${result.moonSign.name}（${result.moonSign.element}象）`,
                `上升星座：${result.risingSign.name}（${result.risingSign.element}象）`,
              ].join('\n')}
              question={question.trim() || undefined}
            />

            {/* 星座详情面板 */}
            {selectedSign && (() => {
              const DEEP_KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
              const deep = getZodiacDeep(DEEP_KEYS[selectedSignIdx ?? 0] ?? '');
              const sections: [string, string][] = deep
                ? [
                    ['内心世界', deep.innerWorld],
                    ['爱情', deep.love],
                    ['事业', deep.career],
                    ['财运', deep.finance],
                    ['健康', deep.health],
                    ['成长课题', deep.growth],
                  ]
                : [];
              return (
                <div className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-6 md:p-8 backdrop-blur-sm">
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
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)]">
                        {deep ? `${deep.element}象 · ${deep.quality} · 守护星${deep.ruler} · ${deep.dateRange}` : `${selectedSign.element}象 · ${selectedSign.dates}`}
                      </div>
                      <h3 className="font-serif font-black text-2xl text-[hsl(var(--div-text-hsl))]">{selectedSign.name}</h3>
                      {deep?.keyword && (
                        <div className="font-mono text-[10px] text-secondary/70 mt-0.5">
                          {deep.keyword}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 深度性格解析 */}
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] leading-relaxed mb-4">
                    {deep?.personality ?? selectedSign.description}
                  </p>

                  {/* 核心特质 */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(deep?.coreTraits ?? selectedSign.traits).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-[hsla(var(--div-line-hsl)/0.12)] text-[hsla(var(--div-text-hsl)/0.6)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* 深度分板块 */}
                  {sections.length > 0 && (
                    <div className="space-y-4 border-t border-[hsla(var(--div-line-hsl)/0.06)] pt-5">
                      {sections.map(([label, content]) => (
                        <div key={label}>
                          <div className="font-mono text-[10px] tracking-widest text-secondary/60 mb-1.5">
                            ◆ {label}
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                            {content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 配对建议 */}
                  {deep?.compatibility && (
                    <div className="border-t border-[hsla(var(--div-line-hsl)/0.06)] pt-4 mt-4">
                      <div className="font-mono text-[10px] tracking-widest text-secondary/60 mb-2">
                        ❖ 配对建议
                      </div>
                      <div className="space-y-1.5">
                        {([
                          ['绝配', deep.compatibility.best, 'var(--color-neon)'],
                          ['良好', deep.compatibility.good, 'white'],
                          ['挑战', deep.compatibility.challenge, 'var(--color-secondary)'],
                        ] as [string, string[], string][]).map(([label, list, color]) => (
                          <div key={label} className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-[10px] text-[hsla(var(--div-text-hsl)/0.35)] shrink-0 w-10">{label}</span>
                            <span className="font-serif text-[hsla(var(--div-text-hsl)/0.6)]" style={{ color }}>
                              {list.join(' · ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 底部：重新占卜 */}
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-lg border border-[hsla(var(--div-line-hsl)/0.18)] font-serif text-[hsla(var(--div-text-hsl)/0.7)] tracking-wide hover:border-neon/50 hover:text-neon transition-colors"
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
