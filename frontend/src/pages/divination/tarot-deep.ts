// 繁体中文深度解读数据（开源 Gist by penut85420，公有领域塔罗牌意）
// 78 张牌完整解读：每张牌有牌面详解 + 正逆位各 6 维度（行为/感情/牌意/关联词/两性/星象）
import zhtwRaw from './tarot-zhtw.json';

interface ZhtwSide {
  behavior: string;
  marriage: string;
  meaning: string;
  related: string;
  sexuality: string;
  star: string;
}
interface ZhtwCard {
  explain: string;
  name: string;
  positive: ZhtwSide;
  reversed: ZhtwSide;
}

const zhtw = zhtwRaw as unknown as Record<string, ZhtwCard>;

// tarot-kit 的 78 张牌 ID（按 deck 顺序：22 大阿卡纳 + 14 权杖 + 14 圣杯 + 14 宝剑 + 14 星币）
const CARD_IDS = [
  // 大阿卡纳 00-21
  'the-fool', 'the-magician', 'the-high-priestess', 'the-empress', 'the-emperor',
  'the-hierophant', 'the-lovers', 'the-chariot', 'strength', 'the-hermit',
  'wheel-of-fortune', 'justice', 'the-hanged-man', 'death', 'temperance',
  'the-devil', 'the-tower', 'the-star', 'the-moon', 'the-sun', 'judgement', 'the-world',
  // 权杖 22-35
  'ace-of-wands', 'two-of-wands', 'three-of-wands', 'four-of-wands', 'five-of-wands',
  'six-of-wands', 'seven-of-wands', 'eight-of-wands', 'nine-of-wands', 'ten-of-wands',
  'page-of-wands', 'knight-of-wands', 'queen-of-wands', 'king-of-wands',
  // 圣杯 36-49
  'ace-of-cups', 'two-of-cups', 'three-of-cups', 'four-of-cups', 'five-of-cups',
  'six-of-cups', 'seven-of-cups', 'eight-of-cups', 'nine-of-cups', 'ten-of-cups',
  'page-of-cups', 'knight-of-cups', 'queen-of-cups', 'king-of-cups',
  // 宝剑 50-63
  'ace-of-swords', 'two-of-swords', 'three-of-swords', 'four-of-swords', 'five-of-swords',
  'six-of-swords', 'seven-of-swords', 'eight-of-swords', 'nine-of-swords', 'ten-of-swords',
  'page-of-swords', 'knight-of-swords', 'queen-of-swords', 'king-of-swords',
  // 星币 64-77
  'ace-of-pentacles', 'two-of-pentacles', 'three-of-pentacles', 'four-of-pentacles', 'five-of-pentacles',
  'six-of-pentacles', 'seven-of-pentacles', 'eight-of-pentacles', 'nine-of-pentacles', 'ten-of-pentacles',
  'page-of-pentacles', 'knight-of-pentacles', 'queen-of-pentacles', 'king-of-pentacles',
];

// 建立 cardId → 索引(00-77)的映射
const idToKey: Record<string, string> = {};
CARD_IDS.forEach((id, i) => {
  const key = String(i).padStart(2, '0');
  if (zhtw[key]) idToKey[id] = key;
});

export interface DeepReading {
  explain: string;       // 牌面详解（几百字）
  meaning: string;       // 核心牌意（正位或逆位）
  behavior: string;      // 行为特质
  marriage: string;      // 感情婚姻
  sexuality: string;     // 两性关系
  related: string;       // 关联词
  star: string;          // 对应星象
}

/** 按卡牌 ID + 正逆位取得深度解读 */
export function getDeepReading(cardId: string | undefined, reversed: boolean): DeepReading | null {
  if (!cardId) return null;
  const key = idToKey[cardId];
  if (!key) return null;
  const card = zhtw[key];
  if (!card) return null;
  const side = reversed ? card.reversed : card.positive;
  return {
    explain: card.explain,
    meaning: side.meaning,
    behavior: side.behavior,
    marriage: side.marriage,
    sexuality: side.sexuality,
    related: side.related,
    star: side.star,
  };
}

/** 取牌面对应的繁体中文名（作为 nameZh 的补充/校验） */
export function getZhtwName(cardId: string | undefined): string | undefined {
  if (!cardId) return undefined;
  const key = idToKey[cardId];
  return key ? zhtw[key]?.name : undefined;
}
