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
  
  // 字体配置
  fontSettings: {
    sans: string;
    serif: string;
    mono: string;
    imports: string[];
  };

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
      name: 'Stories',
      enabled: true,
      backgroundImage: '/uploads/hero/hero1.jpg',
      contentZH: {
        tag: '记录 · 创作 · 折腾',
        titleStart: '把经历写成',
        titleHighlight: '故事',
        titleEnd: '',
        quote: '"这里有项目复盘、技术笔记，和偶尔走神写下的东西。"'
      },
      contentEN: {
        tag: 'STORIES & NOTES',
        titleStart: 'TURNING EXPERIENCE INTO',
        titleHighlight: 'STORIES',
        titleEnd: '',
        quote: '"Project deep-dives, technical notes, and the occasional wandering thought."'
      }
    },
    {
      id: 'grid',
      name: 'Projects',
      enabled: true,
      backgroundImage: '/uploads/hero/hero2.jpg',
      contentZH: {
        tag: '做过的东西',
        titleStart: '想法落地成',
        titleHighlight: '作品',
        titleEnd: '',
        quote: '"每一个项目背后，都是一段从零到一的旅程。"'
      },
      contentEN: {
        tag: 'WHAT I\'VE BUILT',
        titleStart: 'IDEAS BECOME',
        titleHighlight: 'PROJECTS',
        titleEnd: '',
        quote: '"Every project tells a story of going from zero to one."'
      }
    },
    {
      id: 'nebula',
      name: 'Life',
      enabled: true,
      backgroundImage: '/uploads/hero/hero3.jpg',
      contentZH: {
        tag: '还有一些喜欢的东西',
        titleStart: '分享让生活有光的',
        titleHighlight: '热爱',
        titleEnd: '',
        quote: '"追过的番、通关的游戏、单曲循环的歌，都在这里。"'
      },
      contentEN: {
        tag: 'THINGS I LOVE',
        titleStart: 'THE',
        titleHighlight: 'JOY',
        titleEnd: 'THAT FILLS THE GAPS',
        quote: '"Anime marathons, game completions, and songs on repeat — all here."'
      }
    }
  ],
  
  fontSettings: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Noto Serif SC", "SimSun", "STSong", serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    imports: [],
  },

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
