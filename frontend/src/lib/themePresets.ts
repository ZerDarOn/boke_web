/**
 * 主题栏预设配色。每套只定义主/辅色相(hue)，
 * 饱和度/明度沿用全站统一公式(neon 100%/40%，secondary 90%/65%)，保证风格一致。
 */
export interface ThemePreset {
  id: string;
  name: string;
  primaryHue: number;
  secondaryHue: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'jade', name: '墨翠朱砂', primaryHue: 154, secondaryHue: 8 },
  { id: 'cyan', name: '霓青', primaryHue: 182, secondaryHue: 210 },
  { id: 'azure', name: '苍蓝', primaryHue: 212, secondaryHue: 280 },
  { id: 'violet', name: '暮紫', primaryHue: 275, secondaryHue: 322 },
  { id: 'crimson', name: '赤血', primaryHue: 350, secondaryHue: 25 },
  { id: 'amber', name: '鎏金', primaryHue: 40, secondaryHue: 165 },
];

export const DEFAULT_PRESET = THEME_PRESETS[0];

/** 供预览/小色块用：把 hue 转成完整颜色字符串 */
export const presetPrimaryColor = (p: ThemePreset) => `hsl(${p.primaryHue} 100% 45%)`;
export const presetSecondaryColor = (p: ThemePreset) => `hsl(${p.secondaryHue} 90% 65%)`;
