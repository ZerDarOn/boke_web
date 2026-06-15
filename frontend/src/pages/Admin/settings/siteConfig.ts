export interface SiteConfig {
  // 博客基本信息
  blogName: string;
  blogSubtitle: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  authorBio: string;
  
  // 联系方式
  email: string;
  github: string;
  twitter: string;
  bilibili: string;
  wechat: string;
  
  // Hero 背景配置
  heroBackgrounds: {
    id: string;
    name: string;
    enabled: boolean;
    /** 自定义背景图链接；留空则使用内置特效 */
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
  }[];
  
  // 主题配置
  defaultTheme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  
  // SEO 配置
  siteDescription: string;
  siteKeywords: string;
  favicon: string;
  
  // 页面文案配置
  pageCopy: {
    // 日记页面
    diaryTitle: string;
    diarySubtitle: string;
    diaryQuote: string;
    diaryStartLabel: string;
    
    // 想法流（首页）
    thoughtsTitle: string;
    thoughtsLabel: string;
    thoughtsBgText: string;
    
    // Footer
    footerQuote: string;
    
    // 公告
    announcementTitle: string;
    announcementContent: string;
    announcementLink: string;
    announcementLinkText: string;
    
    // 关于页面
    aboutContactTitle: string;
    aboutContactCopyTip: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
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
  
  heroBackgrounds: [
    {
      id: 'ink',
      name: 'Ink Slash',
      enabled: true,
      contentZH: {
        tag: '数字编年史(2025)',
        titleStart: '以',
        titleHighlight: '代码',
        titleEnd: '书写',
        quote: '"在数字虚空中记录灵魂的回响。"'
      },
      contentEN: {
        tag: 'DIGITAL.CHRONICLES(2025)',
        titleStart: 'WRITTEN IN',
        titleHighlight: 'CODE',
        titleEnd: '',
        quote: '"Documenting the ghost in the shell, one line at a time."'
      }
    },
    {
      id: 'grid',
      name: 'Cyber Grid',
      enabled: true,
      contentZH: {
        tag: '系统重构中...',
        titleStart: '矩阵',
        titleHighlight: '重载',
        titleEnd: '',
        quote: '"系统即是现实，逻辑构建真理。"'
      },
      contentEN: {
        tag: 'SYSTEM.REFACTORING...',
        titleStart: 'MATRIX',
        titleHighlight: 'RELOADED',
        titleEnd: '',
        quote: '"The system is the reality. Logic builds truth."'
      }
    },
    {
      id: 'nebula',
      name: 'Void Nebula',
      enabled: true,
      contentZH: {
        tag: '星海漫游指南',
        titleStart: '凝视',
        titleHighlight: '深渊',
        titleEnd: '',
        quote: '"在数据洪流中寻找秩序的星光。"'
      },
      contentEN: {
        tag: 'GUIDE.TO.GALAXY',
        titleStart: 'VOID',
        titleHighlight: 'GAZING',
        titleEnd: '',
        quote: '"Staring into the abyss of data, finding order in chaos."'
      }
    }
  ],
  
  defaultTheme: 'dark',
  primaryColor: '#10b981',
  secondaryColor: '#8b5cf6',
  
  siteDescription: 'INK.SPIRIT - 一个赛博风格的个人博客',
  siteKeywords: '博客,技术,编程,生活,动漫',
  favicon: '/favicon.ico',
  
  pageCopy: {
    // 日记页面
    diaryTitle: 'DIARY.STREAM',
    diarySubtitle: 'Private Thoughts',
    diaryQuote: 'Writing is defragmentation of the soul.',
    diaryStartLabel: '记录开始',
    
    // 想法流（首页）
    thoughtsTitle: 'THOUGHT STREAM',
    thoughtsLabel: 'MICRO-BLOG',
    thoughtsBgText: '念',
    
    // Footer
    footerQuote: 'The code flows like wind, invisible yet mighty.',
    
    // 公告
    announcementTitle: '公告',
    announcementContent: '本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 已上线，包含全新的夜间模式和水墨渲染引擎。',
    announcementLink: '/announcement',
    announcementLinkText: '了解更多',
    
    // 关于页面
    aboutContactTitle: '联系方式',
    aboutContactCopyTip: '点击卡片复制链接或访问'
  }
};
