import prisma from '../lib/prisma';

// Raw SQL helper type
interface SiteConfigRow {
  key: string;
  value: string;
}

export class SettingsService {
  // 获取所有配置
  static async getAll(): Promise<Record<string, any>> {
    const configs = await prisma.$queryRaw<SiteConfigRow[]>`
      SELECT key, value FROM site_config
    `;
    
    // 转换为对象格式
    const result: Record<string, any> = {};
    for (const config of configs) {
      try {
        // 尝试解析 JSON
        result[config.key] = JSON.parse(config.value);
      } catch {
        // 如果不是 JSON，存储为字符串
        result[config.key] = config.value;
      }
    }
    
    return result;
  }

  // 获取单个配置
  static async getByKey(key: string): Promise<any | null> {
    const configs = await prisma.$queryRaw<SiteConfigRow[]>`
      SELECT key, value FROM site_config WHERE key = ${key}
    `;
    
    // 如果没有找到配置，返回默认配置
    if (!configs || configs.length === 0) {
      return this.getDefaultValue(key);
    }
    
    const config = configs[0];
    try {
      return JSON.parse(config.value);
    } catch {
      return config.value;
    }
  }

  // 获取默认配置值
  private static getDefaultValue(key: string): any {
    const defaults: Record<string, any> = {
      activities: [
        { id: '1', content: '完成了水墨组件库的开发', date: '2024.05.20', icon: '🎨', link: '/posts/01' },
        { id: '2', content: '发布了新的博客主题 VOID', date: '2024.04.15', icon: '✨', link: '/posts/02' },
        { id: '3', content: '开始在 Bilibili 分享技术视频', date: '2024.03.01', icon: '📹', link: '' },
      ],
    };
    return defaults[key] || null;
  }

  // 设置单个配置
  static async set(key: string, value: any) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await prisma.siteConfig.upsert({
      where: { key },
      create: { key, value: stringValue },
      update: { value: stringValue },
    });
    return { key, value: stringValue };
  }

  // 批量设置配置
  static async bulkSet(settings: Record<string, any>) {
    const entries = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));

    await prisma.$transaction(
      entries.map(({ key, value }) =>
        prisma.siteConfig.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    );

    return entries;
  }

  // 删除配置
  static async delete(key: string) {
    await prisma.$executeRaw`
      DELETE FROM site_config WHERE key = ${key}
    `;
    return { key };
  }

  // 获取站点配置（前端使用的完整配置）
  static async getSiteConfig() {
    const allSettings = await this.getAll();
    
    // 构建前端需要的配置结构
    return {
      blogName: allSettings.blogName || 'INK.SPIRIT',
      blogSubtitle: allSettings.blogSubtitle || '数字编年史',
      authorName: allSettings.authorName || 'CYBER.RONIN',
      authorTitle: allSettings.authorTitle || 'Fullstack Alchemist',
      authorAvatar: allSettings.authorAvatar || '',
      authorBio: allSettings.authorBio || '在数字虚空中记录灵魂的回响',
      email: allSettings.email || 'ronin@cyber.ink',
      github: allSettings.github || 'github.com/cyber-ronin',
      twitter: allSettings.twitter || 'twitter.com/cyber_ronin',
      bilibili: allSettings.bilibili || 'bilibili.com/user/123456',
      wechat: allSettings.wechat || '',
      primaryColor: allSettings.primaryColor || '#10b981',
      secondaryColor: allSettings.secondaryColor || '#8b5cf6',
      defaultTheme: allSettings.defaultTheme || 'dark',
      pageCopy: allSettings.pageCopy || {
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
      heroBackgrounds: allSettings.heroBackgrounds || [],
    };
  }

  // 保存站点配置（前端使用的完整配置）
  static async saveSiteConfig(config: any) {
    const settings: Record<string, any> = {};
    
    // 提取所有配置项
    if (config.blogName !== undefined) settings.blogName = config.blogName;
    if (config.blogSubtitle !== undefined) settings.blogSubtitle = config.blogSubtitle;
    if (config.authorName !== undefined) settings.authorName = config.authorName;
    if (config.authorTitle !== undefined) settings.authorTitle = config.authorTitle;
    if (config.authorAvatar !== undefined) settings.authorAvatar = config.authorAvatar;
    if (config.authorBio !== undefined) settings.authorBio = config.authorBio;
    if (config.email !== undefined) settings.email = config.email;
    if (config.github !== undefined) settings.github = config.github;
    if (config.twitter !== undefined) settings.twitter = config.twitter;
    if (config.bilibili !== undefined) settings.bilibili = config.bilibili;
    if (config.wechat !== undefined) settings.wechat = config.wechat;
    if (config.primaryColor !== undefined) settings.primaryColor = config.primaryColor;
    if (config.secondaryColor !== undefined) settings.secondaryColor = config.secondaryColor;
    if (config.defaultTheme !== undefined) settings.defaultTheme = config.defaultTheme;
    if (config.pageCopy !== undefined) settings.pageCopy = config.pageCopy;
    if (config.heroBackgrounds !== undefined) settings.heroBackgrounds = config.heroBackgrounds;
    
    return this.bulkSet(settings);
  }
}
