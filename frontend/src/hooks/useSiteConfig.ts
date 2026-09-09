import { useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePublicSiteSettings } from './queries/settings';
import { queryKeys } from './api/query-keys';
import { defaultCursorConfig } from '../config/cursor-config';
import {
  readPublicSiteConfig,
  toPublicSiteConfig,
  writePublicSiteConfig,
  type PublicSiteConfig,
} from '../lib/siteConfigStorage';

export type SiteConfig = PublicSiteConfig;

const defaultConfig: SiteConfig = {
  blogName: 'INK.SPIRIT',
  blogSubtitle: '数字编年史',
  authorName: 'CYBER.RONIN',
  authorTitle: 'Fullstack Alchemist',
  authorAvatar: '',
  authorBio: '在数字虚空中记录灵魂的回响',
  email: 'ronin@cyber.ink',
  github: 'github.com/cyber-ronin',
  twitter: 'twitter.com/cyber_ronin',
  bilibili: 'bilibili.com/user/123456',
  wechat: '',
  primaryColor: '#00cc73',
  secondaryColor: '#f2675a',
  defaultTheme: 'dark',
  cursorConfig: defaultCursorConfig,
  siteDescription: '个人博客 — 记录、创作、分享。',
  siteKeywords: '博客,技术,编程,生活',
  fontSettings: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Noto Serif SC", "SimSun", "STSong", serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    imports: [],
  },
  pageCopy: {
    diaryTitle: 'DIARY.STREAM',
    diarySubtitle: 'Private Thoughts',
    diaryQuote: 'Writing is defragmentation of the soul.',
    diaryStartLabel: '记录开始',
    thoughtsTitle: 'THOUGHT STREAM',
    thoughtsLabel: 'MICRO-BLOG',
    thoughtsBgText: '念',
    footerQuote: 'The code flows like wind, invisible yet mighty.',
    announcementTitle: '公告',
    announcementContent:
      '本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 已上线，包含全新的夜间模式和水墨渲染引擎。',
    announcementLink: '/announcement',
    announcementLinkText: '了解更多',
    aboutContactTitle: '联系方式',
    aboutContactCopyTip: '点击卡片复制链接或访问',
  },
  heroBackgrounds: [],
};

function mergeConfigs(
  apiConfig?: Partial<SiteConfig> | null,
  localConfig?: Partial<SiteConfig>
): SiteConfig {
  return {
    ...defaultConfig,
    ...localConfig,
    ...apiConfig,
    pageCopy: {
      ...defaultConfig.pageCopy,
      ...localConfig?.pageCopy,
      ...apiConfig?.pageCopy,
    },
    heroBackgrounds:
      apiConfig?.heroBackgrounds ??
      localConfig?.heroBackgrounds ??
      defaultConfig.heroBackgrounds,
    fontSettings:
      apiConfig?.fontSettings ??
      localConfig?.fontSettings ??
      defaultConfig.fontSettings,
    cursorConfig: {
      ...defaultCursorConfig,
      ...localConfig?.cursorConfig,
      ...apiConfig?.cursorConfig,
    },
  };
}

export function useSiteConfig(): SiteConfig {
  const queryClient = useQueryClient();
  const { data: apiData } = usePublicSiteSettings();

  useEffect(() => {
    if (apiData) {
      writePublicSiteConfig(apiData);
    }
  }, [apiData]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'site_config') {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.publicSite() });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  return useMemo(
    () => mergeConfigs(toPublicSiteConfig(apiData ?? {}), readPublicSiteConfig()),
    [apiData]
  );
}

export function useSiteConfigValue<K extends keyof SiteConfig>(key: K): SiteConfig[K] {
  const config = useSiteConfig();
  return config[key];
}

export function usePageCopy(): SiteConfig['pageCopy'] {
  const config = useSiteConfig();
  return config.pageCopy;
}
