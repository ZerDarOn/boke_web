import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface SiteConfig {
  blogName: string;
  blogSubtitle: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  authorBio: string;
  email: string;
  github: string;
  twitter: string;
  bilibili: string;
  wechat: string;
  primaryColor: string;
  secondaryColor: string;
  defaultTheme: 'light' | 'dark';
  pageCopy: {
    diaryTitle: string;
    diarySubtitle: string;
    diaryQuote: string;
    diaryStartLabel: string;
    thoughtsTitle: string;
    thoughtsLabel: string;
    thoughtsBgText: string;
    footerQuote: string;
    announcementTitle: string;
    announcementContent: string;
    announcementLink: string;
    announcementLinkText: string;
    aboutContactTitle: string;
    aboutContactCopyTip: string;
  };
}

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
    announcementContent: '本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 已上线，包含全新的夜间模式和水墨渲染引擎。',
    announcementLink: '/announcement',
    announcementLinkText: '了解更多',
    aboutContactTitle: '联系方式',
    aboutContactCopyTip: '点击卡片复制链接或访问',
  },
};

// 合并 localStorage 和 API 配置
function mergeConfigs(apiConfig: any, localConfig: any): SiteConfig {
  return {
    ...defaultConfig,
    ...apiConfig,
    ...localConfig,
    pageCopy: {
      ...defaultConfig.pageCopy,
      ...apiConfig?.pageCopy,
      ...localConfig?.pageCopy,
    },
  };
}

export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  const loadConfig = useCallback(async () => {
    // 先加载 localStorage 缓存（快速显示）
    const saved = localStorage.getItem('site_config');
    let localData = {};
    if (saved) {
      try {
        localData = JSON.parse(saved);
        setConfig(prev => mergeConfigs({}, localData));
      } catch (e) {
        console.error('Failed to parse local config:', e);
      }
    }

    // 再从 API 加载最新配置
    try {
      const result = await api.settings.getAll();
      if (result.success && result.data) {
        const merged = mergeConfigs(result.data, localData);
        setConfig(merged);
        // 更新本地缓存
        localStorage.setItem('site_config', JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Failed to load config from API:', error);
      // API 失败时继续使用本地配置
    }
  }, []);

  useEffect(() => {
    loadConfig();

    // 监听 storage 事件（其他标签页修改时）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site_config') {
        loadConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadConfig]);

  return config;
}

// 获取特定配置项的 hook
export function useSiteConfigValue<K extends keyof SiteConfig>(key: K): SiteConfig[K] {
  const config = useSiteConfig();
  return config[key];
}

// 获取 pageCopy 的 hook
export function usePageCopy(): SiteConfig['pageCopy'] {
  const config = useSiteConfig();
  return config.pageCopy;
}
