import { apiRequest, getAuthHeaders } from './request';
import type { CursorConfig } from '../../config/cursor-config';

export interface HeroBackground {
  id: string;
  name: string;
  enabled: boolean;
  backgroundImage?: string;
  contentZH: {
    tag: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    quote: string;
  };
  contentEN: {
    tag: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    quote: string;
  };
}

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
  cursorConfig?: CursorConfig;
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
  heroBackgrounds: HeroBackground[];
  siteDescription?: string;
  siteKeywords?: string;
  favicon?: string;
  fontSettings?: {
    sans: string;
    serif: string;
    mono: string;
    imports: string[];
  };
  aiConfig?: {
    provider: 'openai' | 'anthropic' | 'local';
    apiKey: string;
    model: string;
    baseUrl: string;
    maxTokens: number;
    temperature: number;
  };
}

export type PublicSiteConfig = Omit<SiteConfig, 'aiConfig'>;

export const settingsApi = {
  // GET /api/settings - 管理员配置（登录后可包含敏感项，仅供后台内存态使用）
  getAll: async () => {
    return apiRequest<SiteConfig>(`/api/settings`);
  },

  // 公共页面始终使用无凭据请求，避免与管理员查询缓存共享敏感数据。
  getPublic: async () => {
    return apiRequest<PublicSiteConfig>(`/api/settings`, { auth: false });
  },

  // GET /api/settings/:key - 获取单个配置
  getByKey: async <T = unknown>(key: string) => {
    return apiRequest<{ key: string; value: T }>(`/api/settings/${key}`);
  },

  // PUT /api/settings - 更新单个配置（需要认证）
  update: async (key: string, value: unknown) => {
    return apiRequest<{ key: string; value: string }>(`/api/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });
  },

  // PUT /api/settings/bulk - 批量更新配置（需要认证）
  bulkUpdate: async (settings: Record<string, unknown>) => {
    return apiRequest<{ message: string; count: number }>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
  },

  // 保存完整站点配置（前端使用，需要认证）
  saveSiteConfig: async (config: Partial<SiteConfig>) => {
    // Remove undefined values and ensure clean JSON
    const cleanConfig = JSON.parse(JSON.stringify(config)) as Partial<SiteConfig>;
    
    return apiRequest<{ message: string; count: number }>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings: cleanConfig }),
    });
  },
};
