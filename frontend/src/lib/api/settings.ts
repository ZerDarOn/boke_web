import { apiRequest, getAuthHeaders, getAuthToken } from './request';

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
  heroBackgrounds: any[];
  fontSettings?: {
    sans: string;
    serif: string;
    mono: string;
    imports: string[];
  };
}

export const settingsApi = {
  // GET /api/settings - 获取所有站点配置
  getAll: async () => {
    return apiRequest<SiteConfig>(`/api/settings`);
  },

  // GET /api/settings/:key - 获取单个配置
  getByKey: async (key: string) => {
    return apiRequest<{ key: string; value: any }>(`/api/settings/${key}`);
  },

  // PUT /api/settings - 更新单个配置（需要认证）
  update: async (key: string, value: any) => {
    return apiRequest<any>(`/api/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });
  },

  // PUT /api/settings/bulk - 批量更新配置（需要认证）
  bulkUpdate: async (settings: Record<string, any>) => {
    return apiRequest<{ message: string; count: number }>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
  },

  // 保存完整站点配置（前端使用，需要认证）
  saveSiteConfig: async (config: Partial<SiteConfig>) => {
    // Remove undefined values and ensure clean JSON
    const cleanConfig = JSON.parse(JSON.stringify(config));
    
    return apiRequest<any>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings: cleanConfig }),
    });
  },
};
