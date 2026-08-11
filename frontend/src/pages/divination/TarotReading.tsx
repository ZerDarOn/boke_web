import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDivination } from '@/hooks/queries/divination';
import { getImagePath } from '@cometpisces/tarot-kit-images';
import { getDeepReading, getZhtwName, type DeepReading } from './tarot-deep';
import DivinationAI from './DivinationAI';

// 预加载 78 张韦特塔罗牌面（Rider-Waite，公有领域），文件名为 key
const tarotImageUrls = import.meta.glob(
  '../../../../node_modules/@cometpisces/tarot-kit-images/images/*.png',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

function cardImageUrl(cardId?: string): string | undefined {
  if (!cardId) return undefined;
  const filename = getImagePath(cardId);
  if (!filename) return undefined;
  const key = Object.keys(tarotImageUrls).find(k => k.endsWith(filename));
  return key ? tarotImageUrls[key] : undefined;
}

/* ------------------------------------------------------------------ *
 * tarot-kit 适配层
 * 包声明在 package.json 但当前 node_modules 中缺失，因此采用动态探测 +
 * fallback 策略：优先调用 tarot-kit 的 drawCards，失败则使用内置大阿卡纳。
 * ------------------------------------------------------------------ */

interface KitCard {
  name: string;
  id?: string;
  arcana?: 'major' | 'minor';
  suit?: string;
  number?: number;
  keywords?: string[];
  meanings?: { upright?: string; reversed?: string };
  description?: string;
  // tarot-kit readingAspects 五维解读（zh 文案，按正逆位区分）
  aspects?: {
    currentSituation: string;
    innerState: string;
    rootCause: string;
    development: string;
    advice: string;
  };
  // 情境解读：爱情 / 事业 / 财运
  contexts?: {
    love: string;
    work: string;
    finance: string;
  };
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
    card: {
      ...card,
      id: card.name.toLowerCase().replace(/[^a-z]+/g, '-'),
      arcana: 'major' as const,
      suit: undefined,
      description: card.meanings?.upright,
    },
    reversed: Math.random() < 0.5,
  }));
}

// tarot-kit 的 LocalizedText 结构：{ en: string, zh: string }
type LocalizedText = { en: string; zh: string };
const isLocalized = (v: unknown): v is LocalizedText =>
  typeof v === 'object' && v !== null && 'en' in v && 'zh' in v;

// 把 tarot-kit 返回的卡片归一化为前端期望的结构
// tarot-kit 五维解读结构：aspect.upright.zh / aspect.reversed.zh（需按正逆位取）
function normalizeKitCard(raw: any): DrawnCard {
  const c = raw?.card ?? raw;
  const reversed = (raw?.orientation ?? 'upright') === 'reversed';
  const dir = reversed ? 'reversed' : 'upright';

  const text = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (isLocalized(v)) return v.zh ?? v.en ?? '';
    return '';
  };
  // 正逆位感知的维度读取
  const aspectOf = (key: string): string => {
    const node = c?.readingAspects?.[key]?.[dir];
    return text(node);
  };
  const contextOf = (key: string): string => {
    const node = c?.contextualMeanings?.[key]?.[dir];
    return text(node);
  };
  // 关键词：coreKeyword 单个 + keywords 数组（若有）
  const kws: string[] = [];
  if (c?.coreKeyword) {
    const kw = text(c.coreKeyword);
    if (kw) kws.push(kw);
  }
  if (Array.isArray(c?.keywords)) {
    c.keywords.forEach((k: unknown) => {
      const s = text(k);
      if (s && !kws.includes(s)) kws.push(s);
    });
  }

  const hasAspects = !!c?.readingAspects;
  const hasContexts = !!c?.contextualMeanings;

  return {
    card: {
      name: typeof c?.name === 'string' ? c.name : (c?.name?.en ?? ''),
      id: c?.id,
      arcana: c?.arcana === 'minor' ? 'minor' : 'major',
      suit: c?.suit,
      number: c?.number,
      keywords: kws,
      meanings: {
        upright: text(c?.meaning?.upright),
        reversed: text(c?.meaning?.reversed),
      },
      description: text(c?.description),
      aspects: hasAspects
        ? {
            currentSituation: aspectOf('currentSituation'),
            innerState: aspectOf('innerState'),
            rootCause: aspectOf('rootCause'),
            development: aspectOf('development'),
            advice: aspectOf('advice'),
          }
        : undefined,
      contexts: hasContexts
        ? {
            love: contextOf('love'),
            work: contextOf('work'),
            finance: contextOf('finance'),
          }
        : undefined,
    },
    reversed,
  };
}

// 探测 tarot-kit 并在可用时调用，否则使用 fallback
async function drawCardsAdaptive(count: number): Promise<DrawnCard[]> {
  try {
    const mod: any = await import('@cometpisces/tarot-kit');
    if (typeof mod.drawCards === 'function') {
      const result = mod.drawCards(count);
      if (Array.isArray(result) && result.length > 0) {
        return result.map(normalizeKitCard);
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
  id?: string;
  arcana: 'major' | 'minor';
  suit?: string;
  reversed: boolean;
  position: string;
  keywords: string[];
  meaning: string;
  number: number;
  description?: string;
  aspects?: KitCard['aspects'];
  contexts?: KitCard['contexts'];
  deep?: DeepReading | null;
}

const POSITIONS: Record<Spread, string[]> = {
  single: ['当下'],
  'three-card': ['过去', '现在', '未来'],
};

/* ------------------------------------------------------------------ *
 * 程序化 SVG 牌面图案（赛博几何风）
 * 大阿卡纳：22 个独特符号；小阿卡纳：元素图案 × 数量
 * ------------------------------------------------------------------ */

// 小阿卡纳元素符号（以 (x, y) 为中心绘制）
function SuitGlyph({ suit, x, y, scale = 1 }: { suit: string; x: number; y: number; scale?: number }) {
  const neon = 'var(--color-neon)';
  const s = scale;
  switch (suit) {
    case 'wands':
      return (
        <g stroke={neon} fill="none" strokeWidth="1.4" strokeLinecap="round">
          <line x1={x} y1={y - 12 * s} x2={x} y2={y + 10 * s} />
          <circle cx={x} cy={y - 13 * s} r={3 * s} fill={neon} fillOpacity="0.6" />
          <path d={`M${x} ${y - 4 * s} q${7 * s} ${2 * s} ${10 * s} ${-8 * s}`} />
          <path d={`M${x} ${y + 3 * s} q${-7 * s} ${2 * s} ${-10 * s} ${-8 * s}`} />
          <path d={`M${x} ${y + 10 * s} q${-5 * s} ${5 * s} 0 ${8 * s} q${5 * s} ${-3 * s} 0 ${-8 * s}`} fill={neon} fillOpacity="0.5" />
        </g>
      );
    case 'cups':
      return (
        <g stroke={neon} fill="none" strokeWidth="1.4" strokeLinecap="round">
          <path d={`M${x - 8 * s} ${y - 8 * s} q0 ${10 * s} ${8 * s} ${10 * s} q${8 * s} 0 ${8 * s} ${-10 * s} z`} fill={neon} fillOpacity="0.08" />
          <path d={`M${x - 5 * s} ${y - 2 * s} l${10 * s} 0`} />
          <path d={`M${x - 4 * s} ${y + 2 * s} l${8 * s} 0`} />
          <path d={`M${x - 3 * s} ${y + 6 * s} l${6 * s} 0`} />
          <path d={`M${x - 2 * s} ${y + 12 * s} q${-2 * s} ${5 * s} ${2 * s} ${5 * s} q${4 * s} 0 ${2 * s} ${-5 * s}`} />
          <circle cx={x} cy={y - 3 * s} r={1.6 * s} fill={neon} />
        </g>
      );
    case 'swords':
      return (
        <g stroke={neon} fill="none" strokeWidth="1.4" strokeLinecap="round">
          <line x1={x} y1={y - 14 * s} x2={x} y2={y + 8 * s} />
          <path d={`M${x} ${y - 14 * s} l${-2.5 * s} ${-4 * s} l${2.5 * s} ${-3 * s} l${2.5 * s} ${3 * s} z`} fill={neon} fillOpacity="0.5" />
          <path d={`M${x - 7 * s} ${y - 3 * s} l${14 * s} 0`} />
          <circle cx={x} cy={y - 3 * s} r={2.4 * s} fill={neon} fillOpacity="0.35" />
          <path d={`M${x} ${y + 8 * s} q${-4 * s} ${4 * s} ${-5 * s} ${6 * s}`} />
          <path d={`M${x} ${y + 8 * s} q${4 * s} ${4 * s} ${5 * s} ${6 * s}`} />
        </g>
      );
    case 'pentacles':
    default:
      return (
        <g stroke={neon} fill="none" strokeWidth="1.4" strokeLinecap="round">
          <circle cx={x} cy={y} r={9 * s} fill={neon} fillOpacity="0.08" />
          <path
            d={`M${x} ${y - 8 * s} l${2.4 * s} ${5.2 * s} l${5.6 * s} 0 l${-4.5 * s} ${3.4 * s} l${1.7 * s} ${5.4 * s} l${-5.2 * s} ${-3.2 * s} l${-5.2 * s} ${3.2 * s} l${1.7 * s} ${-5.4 * s} l${-4.5 * s} ${-3.4 * s} l${5.6 * s} 0 z`}
            fill={neon} fillOpacity="0.25"
          />
          <circle cx={x} cy={y} r={1.4 * s} fill={neon} />
        </g>
      );
  }
}

// 小阿卡纳：元素 × 数量（1-10）/ 宫廷牌（11-14）
function MinorArcanaArt({ card }: { card: FinalCard }) {
  const suit = card.suit ?? 'pentacles';
  const n = card.number ?? 0;
  const court = n > 10;
  const count = Math.min(n, 10);
  // 每种数量对应的列数（保证布局舒展）
  const colsMap: Record<number, number> = { 1: 1, 2: 1, 3: 3, 4: 2, 5: 1, 6: 3, 7: 4, 8: 4, 9: 3, 10: 5 };
  const cols = colsMap[count] ?? 3;
  const rows = Math.ceil(count / cols);
  const xs = Array.from({ length: count }, (_, i) => 50 + ((i % cols) - (cols - 1) / 2) * 17);
  const ys = Array.from({ length: count }, (_, i) => 70 + (Math.floor(i / cols) - (rows - 1) / 2) * 22);
  const suitNames: Record<string, string> = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' };
  const courtNames = ['', '侍从', '骑士', '王后', '国王'];

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      {/* 顶部花色名 */}
      <text x="50" y="16" textAnchor="middle" fontSize="8" fill="var(--color-neon)" opacity="0.8" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.2em' }}>
        {suitNames[suit] ?? suit}
      </text>
      {court ? (
        <>
          <SuitGlyph suit={suit} x={50} y={66} scale={1.7} />
          <text x="50" y="104" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.75)" style={{ fontFamily: 'var(--font-serif)' }}>
            {courtNames[n - 10] ?? ''}
          </text>
          <text x="50" y="116" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
            {n <= 12 ? 'PAGE / KNIGHT' : 'QUEEN / KING'}
          </text>
        </>
      ) : (
        <>
          {Array.from({ length: count }, (_, i) => (
            <SuitGlyph key={i} suit={suit} x={xs[i]} y={ys[i]} />
          ))}
        </>
      )}
      {/* 底部数字 */}
      <text x="50" y="130" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)" style={{ fontFamily: 'var(--font-mono)' }}>
        {String(n).padStart(2, '0')}
      </text>
    </svg>
  );
}

// 大阿卡纳：22 个独特符号（极简赛博几何）
function MajorArcanaArt({ card }: { card: FinalCard }) {
  const neon = 'var(--color-neon)';
  const accent = 'var(--color-secondary)';
  const key = card.id ?? card.name.toLowerCase().replace(/[^a-z]+/g, '-');
  const G = ({ children }: { children: ReactNode }) => (
    <g stroke={neon} fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
  const glyphs: Record<string, ReactNode> = {
    'the-fool': (
      <G>
        <circle cx="32" cy="30" r="12" strokeWidth="1" stroke={accent} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={32 + 15 * Math.cos(a)} y1={30 + 15 * Math.sin(a)} x2={32 + 19 * Math.cos(a)} y2={30 + 19 * Math.sin(a)} strokeWidth="0.8" />;
        })}
        <circle cx="58" cy="98" r="4.5" fill={neon} fillOpacity="0.6" />
        <path d="M58 103 q0 14 -6 20" strokeWidth="1.6" />
        <circle cx="46" cy="126" r="4" strokeWidth="1" />
        <path d="M52 92 q12 -4 18 4 q-8 6 -18 2" strokeWidth="1" />
        <path d="M70 96 q6 -10 16 -8" stroke={accent} strokeWidth="0.9" />
      </G>
    ),
    'the-magician': (
      <G>
        <path d="M35 58 q15 -10 30 0 q-15 10 -30 0 z" strokeWidth="1" />
        <line x1="50" y1="28" x2="50" y2="118" strokeWidth="1.4" />
        <line x1="50" y1="26" x2="50" y2="20" strokeWidth="1" />
        <circle cx="50" cy="17" r="2.5" fill={neon} />
        <circle cx="34" cy="82" r="5" stroke={accent} strokeWidth="0.9" />
        <circle cx="66" cy="82" r="5" stroke={accent} strokeWidth="0.9" />
        <path d="M36 112 h28" strokeWidth="0.8" opacity="0.6" />
        {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={28 + i * 11} cy={122} r="1.2" fill={neon} opacity="0.5" />)}
      </G>
    ),
    'the-high-priestess': (
      <G>
        <line x1="34" y1="24" x2="34" y2="118" strokeWidth="0.9" />
        <line x1="66" y1="24" x2="66" y2="118" strokeWidth="0.9" />
        <circle cx="50" cy="40" r="9" strokeWidth="0.9" />
        <path d="M50 31 q4 9 -2 13 q-2 2 -2 4" stroke={accent} strokeWidth="0.9" />
        <path d="M38 62 q12 -10 24 0 q-12 10 -24 0 z" strokeWidth="1" opacity="0.8" />
        <path d="M50 62 v24" strokeWidth="0.8" />
        <circle cx="50" cy="94" r="2" fill={neon} />
        <path d="M36 112 q14 8 28 0" strokeWidth="0.9" />
      </G>
    ),
    'the-empress': (
      <G>
        <circle cx="50" cy="52" r="2.5" fill={neon} />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * 144 - 90) * (Math.PI / 180);
          return <path key={i} d={`M50 52 l${10 * Math.cos(a)} ${10 * Math.sin(a)}`} strokeWidth="0.9" />;
        })}
        <path d="M30 78 q20 -16 40 0 q-20 16 -40 0" strokeWidth="1" opacity="0.7" />
        <path d="M24 92 q26 -20 52 0" strokeWidth="0.9" opacity="0.5" />
        <path d="M50 52 v-18" strokeWidth="1" />
        <circle cx="50" cy="30" r="4" stroke={accent} strokeWidth="0.9" />
        <path d="M42 116 q8 6 16 0 q-8 -6 -16 0 z" strokeWidth="0.8" opacity="0.6" />
      </G>
    ),
    'the-emperor': (
      <G>
        <path d="M32 34 l18 20 l18 -20 z" strokeWidth="1.2" />
        <circle cx="32" cy="31" r="2.4" strokeWidth="0.8" />
        <circle cx="50" cy="29" r="2.4" strokeWidth="0.8" />
        <circle cx="68" cy="31" r="2.4" strokeWidth="0.8" />
        <line x1="50" y1="54" x2="50" y2="108" strokeWidth="1.2" />
        <circle cx="50" cy="112" r="4" strokeWidth="0.9" />
        <line x1="30" y1="92" x2="50" y2="74" strokeWidth="0.9" />
        <line x1="70" y1="92" x2="50" y2="74" strokeWidth="0.9" />
        <path d="M30 94 h40" strokeWidth="0.8" opacity="0.5" />
      </G>
    ),
    'the-hierophant': (
      <G>
        <path d="M38 30 h24 l-12 16 z" strokeWidth="1" />
        <line x1="44" y1="30" x2="44" y2="24" strokeWidth="0.8" />
        <line x1="50" y1="30" x2="50" y2="21" strokeWidth="0.8" />
        <line x1="56" y1="30" x2="56" y2="24" strokeWidth="0.8" />
        <circle cx="44" cy="21" r="1.6" strokeWidth="0.6" />
        <circle cx="50" cy="18" r="1.6" strokeWidth="0.6" />
        <circle cx="56" cy="21" r="1.6" strokeWidth="0.6" />
        <line x1="34" y1="52" x2="66" y2="52" strokeWidth="1" />
        <line x1="50" y1="52" x2="50" y2="112" strokeWidth="1" />
        <path d="M36 80 l0 20 l-8 0 q0 -12 8 -20" strokeWidth="0.9" />
        <path d="M64 80 l0 20 l8 0 q0 -12 -8 -20" strokeWidth="0.9" />
        <circle cx="28" cy="104" r="2" strokeWidth="0.7" />
        <circle cx="72" cy="104" r="2" strokeWidth="0.7" />
      </G>
    ),
    'the-lovers': (
      <G>
        <circle cx="36" cy="52" r="16" strokeWidth="1" opacity="0.8" />
        <circle cx="64" cy="52" r="16" strokeWidth="1" opacity="0.8" />
        <path d="M50 68 q-5 -5 0 -10 q5 5 0 10 z" fill={neon} fillOpacity="0.4" strokeWidth="0.9" />
        <circle cx="50" cy="30" r="3" fill={accent} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60) * (Math.PI / 180);
          return <line key={i} x1={50 + 5 * Math.cos(a)} y1={30 + 5 * Math.sin(a)} x2={50 + 8 * Math.cos(a)} y2={30 + 8 * Math.sin(a)} strokeWidth="0.8" />;
        })}
        <path d="M26 96 q12 10 24 0 q12 10 24 0" strokeWidth="0.9" opacity="0.6" />
      </G>
    ),
    'the-chariot': (
      <G>
        <path d="M32 70 l18 -16 l18 16 z" strokeWidth="1.2" />
        <path d="M32 70 v26 l18 -10 l18 10 v-26 z" strokeWidth="1.2" />
        <circle cx="40" cy="108" r="8" strokeWidth="1" />
        <circle cx="60" cy="108" r="8" strokeWidth="1" />
        {[40, 60].map(cx => (
          <g key={cx}>
            <line x1={cx} y1="100" x2={cx} y2="116" strokeWidth="0.7" />
            <line x1={cx - 8} y1="108" x2={cx + 8} y2="108" strokeWidth="0.7" />
          </g>
        ))}
        <line x1="50" y1="34" x2="50" y2="44" strokeWidth="0.9" />
        <path d="M44 38 q6 -8 12 0" strokeWidth="0.9" />
        <line x1="36" y1="58" x2="64" y2="58" strokeWidth="0.8" opacity="0.6" />
      </G>
    ),
    'strength': (
      <G>
        <path d="M35 62 q15 -12 30 0 q-15 12 -30 0 z" strokeWidth="1.2" />
        <circle cx="50" cy="88" r="16" strokeWidth="1.2" />
        <path d="M50 76 q-5 4 -5 10 a5 5 0 0 0 10 0 q0 -6 -5 -10" stroke={accent} strokeWidth="0.9" />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36) * (Math.PI / 180);
          return <line key={i} x1={50 + 18 * Math.cos(a)} y1={88 + 18 * Math.sin(a)} x2={50 + 22 * Math.cos(a)} y2={88 + 22 * Math.sin(a)} strokeWidth="0.7" opacity="0.6" />;
        })}
        <circle cx="50" cy="88" r="2" fill={neon} />
      </G>
    ),
    'the-hermit': (
      <G>
        <path d="M50 30 v44" strokeWidth="1.4" />
        <path d="M40 34 l10 -8 l10 8 z" strokeWidth="1" />
        <line x1="50" y1="44" x2="38" y2="40" strokeWidth="0.9" />
        <circle cx="50" cy="70" r="10" stroke={accent} strokeWidth="1" />
        <path d="M50 62 l6 8 h-12 z" fill={neon} fillOpacity="0.3" strokeWidth="0.8" />
        <circle cx="50" cy="70" r="1.8" fill={neon} />
        <circle cx="26" cy="50" r="1.6" fill={accent} opacity="0.7" />
        <circle cx="74" cy="46" r="1.4" fill={accent} opacity="0.5" />
        <circle cx="78" cy="64" r="1.2" fill={accent} opacity="0.4" />
      </G>
    ),
    'wheel-of-fortune': (
      <G>
        <circle cx="50" cy="62" r="26" strokeWidth="1.2" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45) * (Math.PI / 180);
          return <line key={i} x1={50 + 8 * Math.cos(a)} y1={62 + 8 * Math.sin(a)} x2={50 + 26 * Math.cos(a)} y2={62 + 26 * Math.sin(a)} strokeWidth="0.8" opacity="0.7" />;
        })}
        <circle cx="50" cy="62" r="8" strokeWidth="0.9" />
        <circle cx="50" cy="62" r="2" fill={neon} />
        <circle cx="50" cy="26" r="2.4" fill={accent} />
        <circle cx="88" cy="62" r="2.4" fill={accent} />
        <circle cx="50" cy="98" r="2.4" fill={accent} />
        <circle cx="12" cy="62" r="2.4" fill={accent} />
      </G>
    ),
    'justice': (
      <G>
        <line x1="50" y1="30" x2="50" y2="114" strokeWidth="1.2" />
        <path d="M24 52 l52 0 l-8 -12 l-36 0 z" strokeWidth="1" />
        <path d="M24 52 q0 14 14 14 q14 0 14 -14" strokeWidth="1" />
        <path d="M48 52 q0 14 14 14 q14 0 14 -14" strokeWidth="1" />
        <circle cx="50" cy="24" r="3" stroke={accent} strokeWidth="0.9" />
        <line x1="50" y1="27" x2="50" y2="30" strokeWidth="0.8" />
        <circle cx="26" cy="80" r="2" fill={neon} opacity="0.6" />
        <circle cx="74" cy="80" r="2" fill={neon} opacity="0.6" />
      </G>
    ),
    'the-hanged-man': (
      <G>
        <line x1="28" y1="28" x2="72" y2="28" strokeWidth="1.2" />
        <line x1="50" y1="28" x2="50" y2="50" strokeWidth="0.9" />
        <path d="M50 52 l-14 26 l28 0 z" strokeWidth="1.2" />
        <path d="M50 52 q-4 6 -4 12 q0 6 4 10" stroke={accent} strokeWidth="0.9" />
        <line x1="36" y1="78" x2="64" y2="78" strokeWidth="0.9" />
        <path d="M40 52 q4 6 10 6 q6 0 10 -6" strokeWidth="0.8" opacity="0.5" />
        <circle cx="50" cy="46" r="2" fill={neon} />
      </G>
    ),
    'death': (
      <G>
        <path d="M30 34 q30 8 44 40 q-18 -6 -22 -22 q-2 14 10 26 q-16 6 -38 -8 q8 18 34 26 q4 10 -8 14 q-20 -22 -30 -52 q4 10 10 8 z" strokeWidth="1.1" />
        <circle cx="62" cy="104" r="7" strokeWidth="1" />
        <circle cx="59" cy="102" r="1.3" fill={neon} />
        <circle cx="65" cy="102" r="1.3" fill={neon} />
        <path d="M62 106 l-3 4 h6 z" fill={neon} fillOpacity="0.3" strokeWidth="0.7" />
        <circle cx="76" cy="96" r="3" strokeWidth="0.8" />
      </G>
    ),
    'temperance': (
      <G>
        <path d="M34 44 q0 16 16 16 q16 0 16 -16 z" strokeWidth="1.1" />
        <line x1="34" y1="60" x2="34" y2="64" strokeWidth="0.9" />
        <line x1="66" y1="60" x2="66" y2="64" strokeWidth="0.9" />
        <path d="M30 68 h8 v28 h8 v-28 h8 v28 h8 v-28 h8 v28 h8" strokeWidth="0.9" opacity="0.8" />
        <path d="M38 40 q12 -8 24 0" strokeWidth="0.9" />
        <path d="M36 32 q14 -8 28 0" strokeWidth="0.8" opacity="0.6" />
        <circle cx="50" cy="70" r="1.8" fill={neon} />
        <circle cx="50" cy="108" r="2.4" strokeWidth="0.8" />
      </G>
    ),
    'the-devil': (
      <G>
        <path d="M50 44 l-20 26 h40 z" strokeWidth="1.1" />
        <path d="M30 70 l-8 -14 q4 -6 10 -2 z" strokeWidth="0.9" />
        <path d="M70 70 l8 -14 q-4 -6 -10 -2 z" strokeWidth="0.9" />
        <circle cx="42" cy="64" r="1.6" fill={accent} />
        <circle cx="58" cy="64" r="1.6" fill={accent} />
        <path d="M50 70 l0 14" strokeWidth="0.8" />
        <path d="M30 104 l0 -8 a12 12 0 0 1 24 0 l0 8" strokeWidth="1" opacity="0.8" />
        <path d="M38 104 l-3 6 M50 104 l0 6 M62 104 l3 6" strokeWidth="0.8" opacity="0.6" />
        <path d="M50 88 l-3 4 h6 z" fill={neon} fillOpacity="0.25" strokeWidth="0.7" />
      </G>
    ),
    'the-tower': (
      <G>
        <path d="M40 36 l10 -14 l10 14 z" strokeWidth="1.2" />
        <rect x="42" y="36" width="16" height="70" strokeWidth="1.1" />
        <line x1="38" y1="46" x2="62" y2="46" strokeWidth="0.7" opacity="0.5" />
        <line x1="40" y1="58" x2="60" y2="58" strokeWidth="0.7" opacity="0.5" />
        <line x1="42" y1="70" x2="58" y2="70" strokeWidth="0.7" opacity="0.5" />
        <path d="M56 32 l14 -18 l-4 10 l8 0 l-14 16" stroke={accent} strokeWidth="1" />
        <path d="M52 38 l-14 -10 l6 8" strokeWidth="0.7" opacity="0.5" />
        <circle cx="34" cy="40" r="2" fill={neon} opacity="0.8" />
        <circle cx="70" cy="34" r="1.6" fill={neon} opacity="0.6" />
        <path d="M30 114 l40 0" strokeWidth="0.8" opacity="0.5" />
      </G>
    ),
    'the-star': (
      <G>
        <path d="M50 26 l6 16 l17 0 l-13 10 l5 17 l-15 -10 l-15 10 l5 -17 l-13 -10 l17 0 z" strokeWidth="1.1" fill={neon} fillOpacity="0.12" />
        <circle cx="50" cy="60" r="2" fill={neon} />
        {[[24, 44], [76, 44], [32, 80], [68, 80], [50, 96]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.2} fill={neon} opacity={0.6 - i * 0.08} />
        ))}
        <path d="M34 108 q16 -8 32 0 q-16 8 -32 0" strokeWidth="0.8" opacity="0.7" />
        <path d="M40 114 q10 -5 20 0" strokeWidth="0.7" opacity="0.5" />
      </G>
    ),
    'the-moon': (
      <G>
        <circle cx="56" cy="34" r="13" strokeWidth="1.1" />
        <path d="M56 21 q-9 13 0 26 q-13 -4 -13 -13 q0 -9 13 -13" fill="#05060a" strokeWidth="0" />
        <circle cx="56" cy="34" r="1.6" fill={neon} />
        {Array.from({ length: 4 }, (_, i) => <circle key={i} cx={24 + i * 18} cy={56} r={1.1} fill={neon} opacity={0.5} />)}
        <line x1="30" y1="74" x2="70" y2="74" strokeWidth="0.8" />
        <line x1="38" y1="86" x2="62" y2="86" strokeWidth="0.8" />
        <line x1="44" y1="98" x2="56" y2="98" strokeWidth="0.8" />
        <path d="M30 74 q8 6 16 0 q8 6 16 0 q8 6 16 0" strokeWidth="0.7" opacity="0.5" />
      </G>
    ),
    'the-sun': (
      <G>
        <circle cx="50" cy="52" r="16" strokeWidth="1.2" fill={neon} fillOpacity="0.08" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30) * (Math.PI / 180);
          return <line key={i} x1={50 + 19 * Math.cos(a)} y1={52 + 19 * Math.sin(a)} x2={50 + 25 * Math.cos(a)} y2={52 + 25 * Math.sin(a)} strokeWidth="0.9" />;
        })}
        <circle cx="50" cy="52" r="6" strokeWidth="0.9" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60) * (Math.PI / 180);
          return <path key={i} d={`M${50 + 6 * Math.cos(a)} ${52 + 6 * Math.sin(a)} l${3 * Math.cos(a + 0.6)} ${3 * Math.sin(a + 0.6)} l${3 * Math.cos(a - 0.6)} ${3 * Math.sin(a - 0.6)} z`} fill={neon} fillOpacity="0.5" strokeWidth="0.5" />;
        })}
        <path d="M32 100 q18 -12 36 0 q-18 12 -36 0" strokeWidth="0.9" opacity="0.7" />
      </G>
    ),
    'judgement': (
      <G>
        <path d="M34 40 l16 -12 l16 12 z" strokeWidth="1.1" />
        <path d="M34 40 q16 22 32 0" strokeWidth="1.1" />
        <path d="M50 52 l-5 -7 l5 2 l5 -2 z" fill={neon} fillOpacity="0.4" strokeWidth="0.7" />
        <path d="M50 66 v30" strokeWidth="0.9" />
        <path d="M34 96 q8 -6 16 0 q8 -6 16 0" strokeWidth="0.9" />
        <circle cx="50" cy="86" r="5" strokeWidth="0.8" />
        <path d="M50 81 q-3 2 -3 5 a3 3 0 0 0 6 0 q0 -3 -3 -5" stroke={accent} strokeWidth="0.7" />
        <circle cx="26" cy="58" r="1.6" fill={accent} opacity="0.7" />
        <circle cx="74" cy="58" r="1.6" fill={accent} opacity="0.7" />
      </G>
    ),
    'the-world': (
      <G>
        <ellipse cx="50" cy="62" rx="26" ry="34" strokeWidth="1.2" />
        <ellipse cx="50" cy="62" rx="19" ry="26" strokeWidth="0.7" opacity="0.6" />
        <circle cx="50" cy="62" r="6" strokeWidth="0.9" />
        <circle cx="50" cy="62" r="1.8" fill={neon} />
        {Array.from({ length: 4 }, (_, i) => {
          const a = (i * 90) * (Math.PI / 180);
          const r = 26;
          return <path key={i} d={`M${50 + r * Math.cos(a)} ${62 + r * Math.sin(a)} l${6 * Math.cos(a)} ${6 * Math.sin(a)}`} strokeWidth="0.8" />;
        })}
        <path d="M32 112 q18 -10 36 0" strokeWidth="0.8" opacity="0.5" />
      </G>
    ),
  };
  const glyph = glyphs[key] ?? (
    <G>
      <circle cx="50" cy="60" r="22" strokeWidth="1.2" />
      <path d="M50 38 l6 16 l17 0 l-13 10 l5 17 l-15 -10 l-15 10 l5 -17 l-13 -10 l17 0 z" strokeWidth="1" fill={neon} fillOpacity="0.12" />
    </G>
  );

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      {glyph}
      {/* 顶部罗马数字 */}
      <text x="50" y="18" textAnchor="middle" fontSize="8" fill="var(--color-neon)" opacity="0.8" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.25em' }}>
        {toRoman(card.number)}
      </text>
      {/* 底部编号 */}
      <text x="50" y="130" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)" style={{ fontFamily: 'var(--font-mono)' }}>
        {String(card.number).padStart(2, '0')}
      </text>
    </svg>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) {
    while (n >= v) { out += s; n -= v; }
  }
  return out;
}

function TarotCardFace({ card }: { card: FinalCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = cardImageUrl(card.id);
  // 优先显示真实韦特牌面，加载失败时回退到程序化 SVG
  if (url && !imgFailed) {
    return (
      <img
        src={url}
        alt={card.nameZh}
        draggable={false}
        loading="eager"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-contain rounded-[3px]"
        style={{ imageRendering: 'auto' }}
      />
    );
  }
  return card.arcana === 'minor' ? <MinorArcanaArt card={card} /> : <MajorArcanaArt card={card} />;
}

// 把整副牌的信息组织成一段连贯的综合解读
function buildReadingSummary(cards: FinalCard[], q: string): string {
  const spreadName = cards.length === 1 ? '单张灵牌' : cards.length === 3 ? '三张时空牌阵' : '五张凯尔特十字牌阵';
  const parts: string[] = [];
  parts.push(`本次为${spreadName}${q ? `,向虚空询问「${q}」` : ''},牌面已然昭示。`);
  cards.forEach(c => {
    const tone = c.reversed ? '发出警示' : '作出昭示';
    const aspectHint = c.aspects?.currentSituation ? `(${c.aspects.currentSituation})` : '';
    parts.push(`· ${c.position}之位,「${c.nameZh}」${tone}:${c.meaning}${aspectHint}`);
  });
  const advices = cards.map(c => c.aspects?.advice).filter((v): v is string => !!v);
  if (advices.length > 0) {
    parts.push(`—— 虚空的整体指引:${advices.join(';')}`);
  }
  // 情境补充
  const loveHints = cards.map(c => c.contexts?.love).filter((v): v is string => !!v);
  if (loveHints.length > 0) {
    parts.push(`〔感情〕${loveHints.join(' / ')}`);
  }
  const workHints = cards.map(c => c.contexts?.work).filter((v): v is string => !!v);
  if (workHints.length > 0) {
    parts.push(`〔事业〕${workHints.join(' / ')}`);
  }
  return parts.join('\n');
}

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
        <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] text-center mb-3">
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
            background: 'hsla(var(--div-card-hsl))',
            borderColor: hover ? 'var(--color-neon)' : 'hsla(var(--div-line-hsl)/0.12)',
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
          <div className="absolute inset-2 border border-[hsla(var(--div-line-hsl)/0.12)] rounded" />
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
          <div className="absolute top-3 right-3 font-mono text-[9px] text-[hsla(var(--div-text-hsl)/0.3)]">
            {String(total - index).padStart(2, '0')}
          </div>
          {/* 底部标签 */}
          <div className="absolute bottom-3 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[hsla(var(--div-text-hsl)/0.25)]">
            ? ? ?
          </div>
        </div>

        {/* 牌正面 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border bg-[hsla(var(--div-card-hsl))]"
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
              <div className="absolute inset-2 border border-[hsla(var(--div-line-hsl)/0.12)] rounded flex flex-col items-center p-2">
                {/* 牌号 */}
                <div className="font-mono text-[10px] text-[hsla(var(--div-text-hsl)/0.4)]">
                  {String(card.number).padStart(2, '0')}
                </div>

                {/* 牌面图案（完整显示，不裁剪） */}
                <div
                  className="flex-1 w-full min-h-0 flex items-center justify-center py-1"
                  style={{ transform: card.reversed ? 'rotate(180deg)' : undefined }}
                >
                  <div className="w-full h-full max-w-[92%] max-h-full flex items-center justify-center">
                    <TarotCardFace card={card} />
                  </div>
                </div>

                {/* 逆位标记（仅逆位） */}
                {card.reversed && (
                  <div className="font-mono text-[8px] px-1.5 py-0.5 rounded border mb-0.5" style={{ color: 'var(--color-secondary)', borderColor: 'hsl(var(--color-secondary-hsl) / 0.4)' }}>
                    逆位 / REVERSED
                  </div>
                )}
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
      // 中文名优先用 zhtw 深度数据的命名，其次 NAME_ZH 映射，最后用原名
      const nameZh = getZhtwName(c.id) ?? NAME_ZH[c.name] ?? c.name;
      const deep = getDeepReading(c.id, d.reversed);
      // 核心牌义：深度解读优先，否则退回 tarot-kit
      const meaning = deep?.meaning
        ?? (d.reversed
          ? (c.meanings?.reversed ?? '逆位含义未知。')
          : (c.meanings?.upright ?? '正位含义未知。'));
      return {
        name: c.name,
        nameZh,
        id: c.id,
        arcana: c.arcana ?? 'major',
        suit: c.suit,
        reversed: d.reversed,
        position: positions[i] ?? `第${i + 1}张`,
        keywords: c.keywords ?? [],
        meaning,
        number: c.number ?? i,
        description: c.description,
        aspects: c.aspects,
        contexts: c.contexts,
        deep,
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
    <div className="relative min-h-screen" style={{ background: 'hsla(var(--div-bg-hsl))' }}>
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-12 md:py-16 max-w-4xl mx-auto">
        {/* 顶部：返回 + 标题 */}
        <div className="w-full mb-12">
          <button
            onClick={() => navigate('/divination')}
            className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] hover:text-neon transition-colors mb-6 flex items-center gap-2"
          >
            <span>←</span> 返回占卜屋
          </button>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon mb-3">
              / TAROT READING
            </div>
            <h1 className="font-serif font-black text-3xl md:text-5xl text-[hsl(var(--div-text-hsl))] tracking-tight mb-2">
              塔罗占卜
            </h1>
            <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-sm tracking-wide">
              凝视牌面，聆听来自虚空的低语
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="h-px w-12 bg-[hsla(var(--div-line-hsl)/0.2)]" />
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-slow" />
              <div className="h-px w-12 bg-[hsla(var(--div-line-hsl)/0.2)]" />
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
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] block mb-2">
                  你的疑问（可选）
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  maxLength={100}
                  placeholder="想问什么？留空则进行开放式占卜…"
                  className="w-full bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 font-serif text-[hsla(var(--div-text-hsl)/0.8)] text-sm placeholder:text-[hsla(var(--div-text-hsl)/0.2)] focus:border-neon/50 focus:outline-none transition-colors"
                />
              </div>

              {/* 牌阵选项 */}
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] mb-4">
                选择牌阵
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPREADS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSpread(s.id)}
                    className="group relative bg-[hsla(var(--div-card-hsl)/0.8)] backdrop-blur-sm border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-6 md:p-8 text-left transition-all duration-500 hover:-translate-y-2 hover:border-neon/50 overflow-hidden"
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
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                        {s.subtitle}
                      </div>
                      <h3 className="font-serif font-black text-2xl text-[hsl(var(--div-text-hsl))] mb-3">
                        {s.title}
                      </h3>
                      <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-sm mb-4">
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
                    className="absolute inset-0 rounded-lg border border-[hsla(var(--div-line-hsl)/0.12)]"
                    style={{
                      background: 'hsla(var(--div-card-hsl))',
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
              <p className="font-serif text-[hsla(var(--div-text-hsl)/0.3)] text-xs mt-3">
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
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] mb-2">
                DRAW YOUR {count === 1 ? 'CARD' : 'CARDS'}
              </div>
              <p className="font-serif text-[hsla(var(--div-text-hsl)/0.5)] text-sm mb-10">
                {count === 1 ? '点击牌背，翻开你的牌' : '依次点击牌背，翻开三张牌'}
              </p>

              {/* 牌堆 + 抽出的牌 */}
              <div className="flex items-end justify-center gap-6 md:gap-10 w-full">
                {/* 牌堆（剩余） */}
                <div className="relative w-24 h-36 md:w-28 md:h-40 flex-shrink-0">
                  {Array.from({ length: Math.max(1, 8 - flipped.filter(Boolean).length) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-md border border-[hsla(var(--div-line-hsl)/0.12)] bg-[hsla(var(--div-card-hsl))]"
                      style={{
                        transform: `translate(${i * 1.5}px, ${-i * 1}px)`,
                        opacity: 1 - i * 0.08,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--color-neon)' }} />
                    </div>
                  ))}
                  <div className="absolute -bottom-6 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.25)]">
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
                  className="mt-16 font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] hover:text-neon border border-[hsla(var(--div-line-hsl)/0.12)] hover:border-neon/40 rounded px-4 py-2 transition-colors"
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
                {finalCards.map((c, i) => {
                  // 完整五维解读：现状 / 内心 / 根源 / 发展 / 指引
                  const ALL_DIMS = ['currentSituation', 'innerState', 'rootCause', 'development', 'advice'] as const;
                  const dimLabels: Record<string, string> = {
                    currentSituation: '现状',
                    innerState: '内心',
                    rootCause: '根源',
                    development: '发展',
                    advice: '指引',
                  };
                  const dimIcons: Record<string, string> = {
                    currentSituation: '◈',
                    innerState: '◈',
                    rootCause: '◈',
                    development: '◈',
                    advice: '✧',
                  };
                  return (
                    <div
                      key={i}
                      className="bg-[hsla(var(--div-card-hsl)/0.8)] backdrop-blur-sm border border-[hsla(var(--div-line-hsl)/0.12)] rounded-xl p-5"
                      style={{ boxShadow: `0 0 24px hsl(var(--color-neon-hsl) / 0.05)` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-neon/60 px-2 py-0.5 rounded border border-neon/20">
                            {c.position}
                          </span>
                          <span className="font-serif text-[hsl(var(--div-text-hsl))] font-bold">
                            {c.nameZh}
                          </span>
                          {c.reversed && (
                            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: 'var(--color-secondary)', background: 'hsl(var(--color-secondary-hsl) / 0.1)' }}>
                              逆位
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-[hsla(var(--div-text-hsl)/0.25)]">
                          {c.name}
                        </span>
                      </div>

                      {/* 关键词 */}
                      {c.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {c.keywords.map(k => (
                            <span key={k} className="font-mono text-[9px] text-neon/70 px-2 py-0.5 rounded-full bg-neon/5 border border-neon/15">
                              {k}
                            </span>
                          ))}
                          {c.deep?.star && (
                            <span className="font-mono text-[9px] text-secondary/70 px-2 py-0.5 rounded-full bg-secondary/5 border border-secondary/15">
                              ★ {c.deep.star}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 核心牌义（深度解读优先） */}
                      <p className="font-serif text-[hsla(var(--div-text-hsl)/0.65)] text-sm leading-relaxed mb-3">
                        {c.meaning}
                      </p>

                      {/* 牌面详解（深度解读特有，几百字的牌面象征解析） */}
                      {c.deep?.explain && (
                        <div className="mb-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-2">
                            ◇ 牌面详解
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.45)] text-xs leading-relaxed">
                            {c.deep.explain}
                          </p>
                        </div>
                      )}

                      {/* 行为特质（深度解读） */}
                      {c.deep?.behavior && (
                        <div className="mb-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-2">
                            ◇ 行为特质
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                            {c.deep.behavior}
                          </p>
                        </div>
                      )}

                      {/* 感情婚姻（深度解读） */}
                      {c.deep?.marriage && (
                        <div className="mb-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-2">
                            ♥ 感情指引
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                            {c.deep.marriage}
                          </p>
                        </div>
                      )}

                      {/* 两性关系（深度解读） */}
                      {c.deep?.sexuality && c.deep.sexuality !== c.deep.marriage && (
                        <div className="mb-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-2">
                            ⚥ 两性关系
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                            {c.deep.sexuality}
                          </p>
                        </div>
                      )}

                      {/* tarot-kit 五维解读（补充） */}
                      {c.aspects && (
                        <div className="grid gap-3 mt-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          {ALL_DIMS.map(d => c.aspects?.[d] && (
                            <div key={d} className="flex gap-2.5">
                              <span className="font-mono text-[9px] tracking-widest text-neon/50 shrink-0 w-9 pt-0.5">
                                {dimIcons[d]} {dimLabels[d]}
                              </span>
                              <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                                {c.aspects[d]}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 情境解读：爱情 / 事业 / 财运（tarot-kit） */}
                      {c.contexts && (c.contexts.love || c.contexts.work || c.contexts.finance) && (
                        <div className="grid gap-3 mt-3 pt-3 border-t border-[hsla(var(--div-line-hsl)/0.06)]">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
                            ◇ 情境指引
                          </div>
                          {([
                            ['love', '感情', '♥'],
                            ['work', '事业', '◆'],
                            ['finance', '财运', '◎'],
                          ] as [keyof typeof c.contexts, string, string][]).map(([k, label, icon]) => {
                            const v = c.contexts?.[k];
                            if (!v) return null;
                            return (
                              <div key={k} className="flex gap-2.5">
                                <span className="font-mono text-[9px] tracking-widest text-secondary/50 shrink-0 w-9 pt-0.5">
                                  {icon} {label}
                                </span>
                                <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                                  {v}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 综合解读 */}
              <div className="bg-neon/[0.03] border border-neon/20 rounded-2xl p-6 mb-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-4">/ 综合解读</div>
                <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] text-sm leading-relaxed whitespace-pre-line">
                  {buildReadingSummary(finalCards, question)}
                </p>
              </div>

              {/* AI 深度解读（用户主动选择才调用） */}
              <DivinationAI
                kind="tarot"
                spread={finalCards
                  .map(c => `${c.position}：${c.nameZh}（${c.reversed ? '逆位' : '正位'}）`)
                  .join('\n')}
                question={question.trim() || undefined}
              />

              {/* 保存状态 */}
              {createMutation.isPending && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-6">
                  正在记录占卜结果…
                </div>
              )}
              {createMutation.isSuccess && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-neon mb-6">
                  ✓ 已记录
                </div>
              )}
              {createMutation.isError && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-6">
                  记录失败，但不影响你的占卜
                </div>
              )}

              {/* 提问回显 */}
              {question.trim() && (
                <div className="text-center mb-8">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-1">
                    你的问题
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.6)] text-sm italic">
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
              className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.6)] hover:text-neon border border-[hsla(var(--div-line-hsl)/0.25)] hover:border-neon/50 rounded-lg px-6 py-3 transition-all duration-300 hover:-translate-y-1"
            >
              ↻ 重新占卜
            </button>
          </div>
        )}

        {/* 最底部装饰 */}
        <div className="mt-auto pt-16">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
            <span className="font-serif text-[hsla(var(--div-text-hsl)/0.2)] text-xs italic">牌之所言，心之所映</span>
            <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
