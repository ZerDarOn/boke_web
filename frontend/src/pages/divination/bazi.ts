// ============================================================
// 四柱八字 / 农历转换 / 梅花易数起卦 工具模块
// 农历数据表为公开标准数据（1900-2100）
// ============================================================

// 农历数据：每年 16 位（闰月 + 大小月 + 闰月大小），公开标准数据
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const GAN_WUXING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
const ZHI_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 六十甲子纳音（每两个干支一纳音）
const NAYIN = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '砂中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];

export interface LunarDate {
  year: number;
  month: number; // 1-12，负数表示闰月
  day: number;
  isLeap: boolean;
}

export interface Pillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
  nayin: string;
}

export interface Bazi {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;
  lunar: LunarDate;
  shengxiao: string;
  lunarText: string; // 农历日期文本
}

// ---------- 农历基础 ----------
function lYearDays(y: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  }
  return sum;
}
function leapMonth(y: number): number {
  return LUNAR_INFO[y - 1900] & 0xf;
}
function leapDays(y: number): number {
  return leapMonth(y) ? (LUNAR_INFO[y - 1900] & 0x10000 ? 30 : 29) : 0;
}
function monthDays(y: number, m: number): number {
  return LUNAR_INFO[y - 1900] & (0x10000 >> m) ? 30 : 29;
}

const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const DAY_CN = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

// 公历 → 农历
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  const base = Date.UTC(1900, 0, 31); // 1900-01-31 = 农历1900年正月初一
  let offset = Math.floor((Date.UTC(year, month - 1, day) - base) / 86400000);
  let lYear = 1900;
  while (lYear < 2101 && offset >= (lYearDays(lYear) + leapDays(lYear))) {
    offset -= lYearDays(lYear) + leapDays(lYear);
    lYear++;
  }
  if (lYear > 2100) lYear = 2100;

  let lMonth = 1;
  let isLeap = false;
  const leap = leapMonth(lYear);
  let daysInMonth = 0;

  while (true) {
    daysInMonth = monthDays(lYear, lMonth);
    if (isLeap && lMonth === leap) daysInMonth = leapDays(lYear);
    if (offset < daysInMonth) break;
    offset -= daysInMonth;
    if (leap > 0 && lMonth === leap && !isLeap) {
      isLeap = true;
    } else {
      lMonth++;
      isLeap = false;
    }
  }

  return { year: lYear, month: isLeap ? -lMonth : lMonth, day: offset + 1, isLeap };
}

// 六十甲子序列（用于查纳音）
const JIAZI: [string, string][] = Array.from({ length: 60 }, (_, i) => [
  TIAN_GAN[i % 10],
  DI_ZHI[i % 12],
]);

function pillarOf(ganIdx: number, zhiIdx: number): Pillar {
  const g = ((ganIdx % 10) + 10) % 10;
  const z = ((zhiIdx % 12) + 12) % 12;
  const s = JIAZI.findIndex(([gg, zz]) => gg === TIAN_GAN[g] && zz === DI_ZHI[z]);
  const n = Math.max(0, Math.floor(s / 2));
  return {
    gan: TIAN_GAN[g],
    zhi: DI_ZHI[z],
    ganWuxing: GAN_WUXING[g],
    zhiWuxing: ZHI_WUXING[z],
    nayin: NAYIN[n % 30],
  };
}

// 地支序（子=0...亥=11）—— 用公历"节令近似日"推断八字月柱
const JIE_DAYS: [number, number][] = [[2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7], [8, 8], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6]];

function dayOfYear(y: number, m: number, d: number): number {
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000);
}

// 返回节月序号 1-12（1=寅月[立春起] ... 12=丑月）
function solarMonthIndex(y: number, m: number, d: number): number {
  const cur = dayOfYear(y, m, d);
  const nodes = JIE_DAYS.map(([mm, dd]) => dayOfYear(y, mm, dd));
  let idx = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (cur < nodes[i]) break;
    idx = i + 1;
  }
  if (idx === 0) return 12; // 立春前 → 上一年丑月
  return idx;
}

// ---------- 四柱八字 ----------
export function getBazi(year: number, month: number, day: number, hour: number): Bazi {
  // 年柱：以立春(约2/4)为界
  let y = year;
  if (month === 1 || (month === 2 && day < 4)) y = year - 1;
  const yearIdx = ((y - 4) % 60 + 60) % 60;
  const yearPillar = pillarOf(yearIdx % 10, yearIdx % 12);

  // 月柱：节令分月，五虎遁起月干
  const mIndex = solarMonthIndex(year, month, day);
  const monthZhi = (mIndex + 1) % 12; // 寅=2 → 节月1 → (1+1)=2 ✓；丑=1 → 节月12 → 13%12=1 ✓
  const firstMonthGan = ((yearIdx % 10) * 2 + 2) % 10; // 甲己丙作首
  const monthGan = (firstMonthGan + mIndex - 1) % 10;
  const monthPillar = pillarOf(monthGan, monthZhi);

  // 日柱：1900-01-01 = 甲戌(干支序 10)
  const days = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 1)) / 86400000);
  const dayIdx = (((10 + days) % 60) + 60) % 60;
  const dayPillar = pillarOf(dayIdx % 10, dayIdx % 12);

  // 时柱：五鼠遁
  const hourZhi = Math.floor(((hour + 1) % 24) / 2);
  const ziGan = (dayPillar.gan ? TIAN_GAN.indexOf(dayPillar.gan) % 5 * 2 : 0) % 10;
  const hourGan = (ziGan + hourZhi) % 10;
  const hourPillar = pillarOf(hourGan, hourZhi);

  const lunar = solarToLunar(year, month, day);
  const lunarText = `${lunar.year}年${lunar.isLeap ? '闰' : ''}${MONTH_CN[Math.abs(lunar.month) - 1]}月${DAY_CN[lunar.day - 1]}`;

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    lunar,
    shengxiao: SHENG_XIAO[yearIdx % 12],
    lunarText,
  };
}

// 干支序号（梅花易数用）：子1...亥12
const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 先天八卦：数 → 三爻（从下到上），1=阳 0=阴
const XIAN_TIAN: Record<number, number[]> = {
  1: [1, 1, 1], // 乾
  2: [1, 1, 0], // 兑
  3: [1, 0, 1], // 离
  4: [1, 0, 0], // 震
  5: [0, 1, 1], // 巽
  6: [0, 1, 0], // 坎
  7: [0, 0, 1], // 艮
  8: [0, 0, 0], // 坤
};

/**
 * 梅花易数时间起卦（年支数 + 农历月 + 农历日 + 时辰数）
 * 返回六爻（从下到上）与动爻位置（0-5，-1 表示无动爻）
 */
export function meihuaCast(year: number, month: number, day: number, hour: number): {
  symbol: number[];
  movingLine: number; // 0-5（从初爻起），-1 无
} {
  // 年支以立春为界（与八字年柱一致）
  let y = year;
  if (month === 1 || (month === 2 && day < 4)) y = year - 1;
  const yearNum = ((((y - 4) % 12) + 12) % 12) + 1; // 年支数：子=1 ... 亥=12

  const lunar = solarToLunar(year, month, day);
  const monthNum = Math.abs(lunar.month);
  const dayNum = lunar.day;
  const hourNum = Math.floor(((hour + 1) % 24) / 2) + 1; // 子=1 ... 亥=12

  const upper = (yearNum + monthNum + dayNum) % 8 || 8;
  const lower = (yearNum + monthNum + dayNum + hourNum) % 8 || 8;
  const moving = (yearNum + monthNum + dayNum + hourNum) % 6 || 6;

  const lowerTrigram = XIAN_TIAN[lower];
  const upperTrigram = XIAN_TIAN[upper];
  return {
    symbol: [...lowerTrigram, ...upperTrigram],
    movingLine: moving - 1, // 第 1 爻 = index 0
  };
}

export { TIAN_GAN, DI_ZHI, ZHI_ORDER, GAN_WUXING, ZHI_WUXING, SHENG_XIAO };
