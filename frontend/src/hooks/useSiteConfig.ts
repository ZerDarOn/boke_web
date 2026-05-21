import { useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSiteSettings } from './queries/settings';
import { queryKeys } from './api/query-keys';
import type { SiteConfig as ApiSiteConfig } from '../lib/api';

export type SiteConfig = ApiSiteConfig;

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
  primaryColor: '#10b981',
  secondaryColor: '#8b5cf6',
  defaultTheme: 'dark',
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

function readLocalConfig(): Partial<SiteConfig> {
  try {
    const saved = localStorage.getItem('site_config');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function mergeConfigs(
  apiConfig?: Partial<SiteConfig> | null,
  localConfig?: Partial<SiteConfig>
): SiteConfig {
  return {
    ...defaultConfig,
    ...apiConfig,
    ...localConfig,
    pageCopy: {
      ...defaultConfig.pageCopy,
      ...apiConfig?.pageCopy,
      ...localConfig?.pageCopy,
    },
    heroBackgrounds:
      localConfig?.heroBackgrounds ??
      apiConfig?.heroBackgrounds ??
      defaultConfig.heroBackgrounds,
  };
}

export function useSiteConfig(): SiteConfig {
  const queryClient = useQueryClient();
  const { data: apiData } = useSiteSettings();

  useEffect(() => {
    if (apiData) {
      localStorage.setItem('site_config', JSON.stringify(apiData));
    }
  }, [apiData]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'site_config') {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.site() });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  return useMemo(
    () => mergeConfigs(apiData, readLocalConfig()),
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
