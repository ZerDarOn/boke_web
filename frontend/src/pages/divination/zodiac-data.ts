// 12 星座深度解读数据
import zodiacRaw from './zodiac-deep.json';

export interface ZodiacDeep {
  name: string;
  nameEn: string;
  symbol: string;
  dateRange: string;
  element: string;
  quality: string;
  ruler: string;
  keyword: string;
  coreTraits: string[];
  personality: string;
  innerWorld: string;
  love: string;
  career: string;
  finance: string;
  health: string;
  growth: string;
  compatibility: {
    best: string[];
    good: string[];
    challenge: string[];
  };
}

const zodiac = zodiacRaw as unknown as Record<string, ZodiacDeep>;

export function getZodiacDeep(key: string): ZodiacDeep | null {
  return zodiac[key] ?? null;
}

export default zodiac;
