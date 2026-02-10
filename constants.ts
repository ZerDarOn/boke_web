import { BlogPost, DiaryEntry, Project, SkillNode, Activity, FileNode, RelationNode, AnimeItem, GalleryItem, TimelineEvent, SkillGroup } from './types';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '01',
    title: '重构现实：赛博空间的虚无与存在',
    date: '2024.05.21',
    category: 'PHILOSOPHY',
    excerpt: '当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？探讨虚拟DOM与柏拉图洞穴寓言的奇妙联系。',
  },
  {
    id: '02',
    title: '水墨组件库开发实录',
    date: '2024.04.10',
    category: 'ENGINEERING',
    excerpt: '如何在 CSS 中复刻宣纸的渗透感？记一次从 WebGL 到 SVG 滤镜的技术迁移过程，寻找性能与美学的平衡点。',
  },
  {
    id: '03',
    title: '数字游民的修仙指南',
    date: '2024.03.15',
    category: 'LIFESTYLE',
    excerpt: '在这个永远在线的时代，如何像古代隐士一样保持内心的宁静？我的断网实验与精力管理心得。',
  },
  {
    id: '04',
    title: 'React Server Components 深度解析',
    date: '2024.02.28',
    category: 'TECH',
    excerpt: '服务器组件不仅是性能优化，更是一种架构范式的回归。从 PHP 时代到 Next.js 的轮回。',
  },
  {
    id: '05',
    title: '2023 年度总结：破碎与重组',
    date: '2023.12.31',
    category: 'LIFE',
    excerpt: '这一年，我尝试打破原有的知识体系，像重构老旧代码一样重构了自己的生活习惯。',
  },
  {
    id: '06',
    title: 'Rust 所有权机制图解',
    date: '2023.10.15',
    category: 'TECH',
    excerpt: '用一种可视化的方式理解 Rust 最难啃的骨头。',
  }
];

export const DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'd1',
    date: 'MAY 24',
    content: '今日大雨。键盘敲击声与雨声共鸣，代码如同溪流般自然流淌。无Bug，大吉。',
    stamp: 'FLOW',
  },
  {
    id: 'd2',
    date: 'MAY 22',
    content: '阅读《黑客与画家》，意识到编程本质上是一种现代的炼金术。我们将思想转化为现实。',
    stamp: 'READ',
  },
  {
    id: 'd3',
    date: 'MAY 18',
    content: '深夜调试，发现系统崩溃的原因竟是一个多余的分号。大道至简，衍化至繁。',
    stamp: 'BUG',
  },
  {
    id: 'd4',
    date: 'MAY 15',
    content: '在咖啡馆坐了一下午，观察人群。每个人都是一个独立的线程，偶尔发生死锁。',
    stamp: 'OBSERVE',
  },
  {
    id: 'd5',
    date: 'MAY 10',
    content: '尝试断网一天。世界并没有因此停止运转，但我内心的CPU占用率显著下降了。',
    stamp: 'OFFLINE',
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'P-01',
    name: 'INK.ENGINE',
    type: 'BLOG THEME',
    tech: ['Next.js', 'Tailwind', 'Framer'],
    status: 'ACTIVE',
    description: '即便在数字时代，文字也应有水墨的重量。一套专为长文阅读设计的深色模式主题。集成 WebGL 水墨渲染引擎与 React Server Components。',
    featured: true,
  },
  {
    id: 'P-02',
    name: 'ZEN.TIMER',
    type: 'PRODUCTIVITY',
    tech: ['React Native', 'Swift'],
    status: 'DEPLOYED',
    description: '结合番茄工作法与冥想白噪音的极简计时器，帮助开发者进入心流状态。获得 App Store 编辑推荐。',
    featured: true,
  },
  {
    id: 'P-03',
    name: 'VOID.CLI',
    type: 'DEV TOOL',
    tech: ['Rust', 'Clap'],
    status: 'ARCHIVED',
    description: '用于快速脚手架生成和Markdown管理的命令行工具，专为博客写作优化。',
    featured: false,
  },
  {
    id: 'P-04',
    name: 'NEON.DB',
    type: 'DATABASE',
    tech: ['Go', 'Raft'],
    status: 'ACTIVE',
    description: 'A lightweight distributed key-value store designed for edge computing scenarios.',
    featured: false,
  },
  {
    id: 'P-05',
    name: 'PIXEL.ARTS',
    type: 'CANVAS',
    tech: ['HTML5', 'JS'],
    status: 'DEPLOYED',
    description: 'Browser-based pixel art editor with real-time collaboration features.',
    featured: false,
  }
];

export const SKILL_NODES: SkillNode[] = [
  { id: 'core', label: 'CREATOR', x: 50, y: 50, connections: ['writing', 'coding', 'design'], type: 'core' },
  { id: 'writing', label: 'WRITING', x: 20, y: 30, connections: ['tech-blog', 'essay', 'notes'], type: 'major' },
  { id: 'coding', label: 'CODING', x: 80, y: 30, connections: ['react', 'node', 'rust'], type: 'major' },
  { id: 'design', label: 'DESIGN', x: 50, y: 80, connections: ['ui', 'ux'], type: 'major' },
  { id: 'tech-blog', label: 'TECH', x: 10, y: 15, connections: [], type: 'minor' },
  { id: 'essay', label: 'ESSAY', x: 30, y: 10, connections: [], type: 'minor' },
  { id: 'notes', label: 'NOTES', x: 5, y: 40, connections: [], type: 'minor' },
  { id: 'react', label: 'REACT', x: 70, y: 10, connections: [], type: 'minor' },
  { id: 'node', label: 'NODE', x: 90, y: 15, connections: [], type: 'minor' },
  { id: 'rust', label: 'RUST', x: 95, y: 40, connections: [], type: 'minor' },
  { id: 'ui', label: 'Figma', x: 40, y: 90, connections: [], type: 'minor' },
  { id: 'ux', label: 'Research', x: 60, y: 90, connections: [], type: 'minor' },
];

export const CATEGORIES = [
  { name: 'ALL', count: 6, icon: '🌐' },
  { name: 'PHILOSOPHY', count: 1, icon: '☯️' },
  { name: 'ENGINEERING', count: 1, icon: '⚙️' },
  { name: 'LIFESTYLE', count: 1, icon: '🍵' },
  { name: 'LIFE', count: 1, icon: '🏠' },
  { name: 'TECH', count: 2, icon: '⚡' },
];

export const TAGS = [
  'React', 'Next.js', 'Rust', 'Design', 'Cyberpunk', 'Ink', 'Wuxia', 'Meditation', 'Vim', 'Linux'
];

export const LATEST_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    project: 'pixel-cabin-project',
    title: 'Pixel Cabin Theme',
    tags: ['TypeScript', 'HTML'],
    status: 'PLANNING',
    date: '2024.06'
  },
  {
    id: 'a2',
    project: 'Fullstack Dev',
    title: '全栈架构升级',
    tags: [],
    status: 'DONE',
    date: '2024.01'
  }
];

export const ABOUT_FILES: FileNode[] = [
  {
    id: 'readme',
    name: 'README.md',
    type: 'markdown',
    size: '2KB',
    date: '2024-05-20',
    content: `# INK.SPIRIT Protocol

Welcome to my digital soul. This system is built upon the principles of **Cyber-Wuxia** aesthetics.

## Core Philosophy
1.  **Minimalism**: Less is more. Code is poetry.
2.  **Performance**: Speed is the ultimate martial art.
3.  **Aesthetics**: Ink flows like data streams.

## Contact
- Email: ronin@cyber.ink
- Encrypted Channel: 0x92...F2A
`
  },
  {
    id: 'resume',
    name: 'RESUME_2024.pdf',
    type: 'binary',
    size: '4.5MB',
    date: '2024-05-01'
  },
  {
    id: 'manifesto',
    name: 'MANIFESTO.md',
    type: 'markdown',
    size: '8KB',
    date: '2023-12-12',
    content: `# The Digital Ronin Manifesto

In an age of algorithmic overload, we choose to curate.
We choose **intentionality** over engagement.
We choose **depth** over width.

This space is a sanctuary for deep work and raw thoughts.
`
  },
  {
    id: 'config',
    name: 'system_config.json',
    type: 'binary',
    size: '12KB',
    date: '2024-01-15'
  }
];

export const RELATIONSHIP_NODES: RelationNode[] = [
  { id: 'me', name: 'Cyber.Ronin', role: 'Construct', type: 'core', x: 50, y: 50, description: 'The Architect of this digital realm.', connections: ['mentor', 'partner1', 'partner2', 'community'] },
  { id: 'mentor', name: 'Master.Void', role: 'Mentor', type: 'major', x: 20, y: 20, description: 'Taught me the way of Rust and low-level alchemy.', connections: ['me'] },
  { id: 'partner1', name: 'Neon.Fox', role: 'Collaborator', type: 'major', x: 80, y: 30, description: 'UI/UX Sorceress. Co-author of the Ink Engine.', connections: ['me', 'partner2'] },
  { id: 'partner2', name: 'Data.Ghost', role: 'Backend', type: 'major', x: 70, y: 70, description: 'Guardian of the databases. Never sleeps.', connections: ['me', 'partner1'] },
  { id: 'community', name: 'Open Source', role: 'Community', type: 'minor', x: 30, y: 80, description: 'The vast ocean of knowledge we all draw from.', connections: ['me'] },
];

export const ANIME_LIST: AnimeItem[] = [
  { id: '1', title: 'Ghost in the Shell', cover: '#1a1b26', totalEps: 26, currentEp: 24, status: 'WATCHING', score: 9.5 },
  { id: '2', title: 'Cyberpunk: Edgerunners', cover: '#10b981', totalEps: 10, currentEp: 10, status: 'COMPLETED', score: 9.0 },
  { id: '3', title: 'Serial Experiments Lain', cover: '#525252', totalEps: 13, currentEp: 13, status: 'COMPLETED', score: 10.0 },
  { id: '4', title: 'Ergo Proxy', cover: '#262626', totalEps: 23, currentEp: 5, status: 'ON_HOLD' },
  { id: '5', title: 'Psycho-Pass', cover: '#059669', totalEps: 22, currentEp: 12, status: 'WATCHING' },
  { id: '6', title: 'Sword Art Online', cover: '#d1d5db', totalEps: 24, currentEp: 3, status: 'DROPPED' },
  { id: '7', title: 'Steins;Gate', cover: '#404040', totalEps: 24, currentEp: 24, status: 'COMPLETED', score: 9.8 },
];

export const GALLERY_IMAGES: GalleryItem[] = [
  { id: 'g1', src: '#27272a', title: 'NEON RAIN', date: '2024.05.20', location: 'SHIBUYA', aspect: 'landscape' },
  { id: 'g2', src: '#18181b', title: 'SERVER ROOM', date: '2024.04.15', location: 'DATA CENTER', aspect: 'portrait' },
  { id: 'g3', src: '#52525b', title: 'QUIET ALLEY', date: '2024.03.10', location: 'KYOTO', aspect: 'portrait' },
  { id: 'g4', src: '#09090b', title: 'TERMINAL', date: '2024.02.28', location: 'HOME', aspect: 'square' },
  { id: 'g5', src: '#047857', title: 'NATURE CODE', date: '2024.01.12', location: 'FOREST', aspect: 'landscape' },
  { id: 'g6', src: '#3f3f46', title: 'ABSTRACT', date: '2023.12.25', location: 'MIND', aspect: 'portrait' },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 't1', year: '2024', date: '05.20', title: 'INK.SPIRIT Launch', description: 'Official release of the Cyber-Wuxia portfolio theme.', type: 'MILESTONE' },
  { id: 't2', year: '2024', date: '01.15', title: 'Joined Tech Giant', description: 'Started new role as Senior Frontend Engineer.', type: 'JOB' },
  { id: 't3', year: '2023', date: '11.08', title: 'Rust Journey Begins', description: 'First "Hello World" in Rust. The strict compiler became my mentor.', type: 'MILESTONE' },
  { id: 't4', year: '2023', date: '06.21', title: 'Graduation', description: 'Master of Computer Science from Cyber University.', type: 'LIFE' },
  { id: 't5', year: '2022', date: '09.01', title: 'Open Source Contributor', description: 'Merged first PR to a major React library.', type: 'MILESTONE' },
];

export const SKILLS_DATA: SkillGroup[] = [
  {
    category: 'FRONTEND.CORE',
    items: [
      { name: 'React / Next.js', level: 95, projectCount: 15, rank: 'MASTER' },
      { name: 'TypeScript', level: 90, projectCount: 12, rank: 'EXPERT' },
      { name: 'Tailwind CSS', level: 92, projectCount: 20, rank: 'MASTER' },
      { name: 'WebGL / Three.js', level: 75, projectCount: 4, rank: 'ADEPT' },
    ]
  },
  {
    category: 'BACKEND.OPS',
    items: [
      { name: 'Node.js', level: 85, projectCount: 8, rank: 'EXPERT' },
      { name: 'Rust', level: 60, projectCount: 2, rank: 'NOVICE' },
      { name: 'PostgreSQL', level: 80, projectCount: 6, rank: 'EXPERT' },
      { name: 'Docker / K8s', level: 70, projectCount: 5, rank: 'ADEPT' },
    ]
  },
  {
    category: 'DESIGN.ARTS',
    items: [
      { name: 'Figma', level: 88, projectCount: 25, rank: 'MASTER' },
      { name: 'UI / UX', level: 85, projectCount: 10, rank: 'EXPERT' },
      { name: 'Motion Design', level: 72, projectCount: 3, rank: 'ADEPT' },
    ]
  }
];

export const ANNOUNCEMENTS: import('./types').Announcement[] = [
  {
    id: '1',
    title: '网站全新改版上线',
    content: '经过数月的开发与打磨，全新的 INK.SPIRIT 博客正式上线！本次改版采用了赛博武侠风格设计，包含暗黑模式、技能矩阵、项目展示等全新功能。',
    date: '2024-05-20',
    type: 'SUCCESS'
  },
  {
    id: '2',
    title: '系统维护通知',
    content: '计划于本周日凌晨 3:00-5:00 进行服务器维护，期间网站可能无法访问，敬请谅解。',
    date: '2024-05-15',
    type: 'WARNING'
  },
  {
    id: '3',
    title: '新文章发布',
    content: '《重构现实：赛博空间的虚无与存在》已发布，欢迎阅读讨论。',
    date: '2024-05-10',
    type: 'INFO'
  }
];

export const TRANSLATIONS = {
    EN: {
        HOME: 'HOME',
        POSTS: 'POSTS',
        ARCHIVES: 'ARCHIVES',
        LINKS: 'LINKS',
        MINE: 'MINE',
        ABOUT: 'ABOUT',
        DASHBOARD: 'DASHBOARD',
        OTHERS: 'OTHERS',
        SEARCH_PLACEHOLDER: 'Search protocols, archives, and system files...',
        TOTAL_EXP: 'TOTAL_EXP',
        SKILLS_COUNT: 'SKILLS_COUNT',
        GLOBAL_RANK: 'GLOBAL_RANK',
        SKILL_MATRIX: 'SKILL.MATRIX',
        PROJECT_ARSENAL: 'PROJECT.ARSENAL',
        TOTAL_PROJECTS: 'TOTAL_PROJECTS',
        COMPLETED: 'COMPLETED',
        IN_PROGRESS: 'IN_PROGRESS',
        LANG: 'EN'
    },
    ZH: {
        HOME: '主页',
        POSTS: '文章',
        ARCHIVES: '归档',
        LINKS: '链接',
        MINE: '我的',
        ABOUT: '关于',
        DASHBOARD: '仪表盘',
        OTHERS: '其他',
        SEARCH_PLACEHOLDER: '检索协议、归档与系统文件...',
        TOTAL_EXP: '总经验值',
        SKILLS_COUNT: '技能数量',
        GLOBAL_RANK: '综合评级',
        SKILL_MATRIX: '技能矩阵',
        PROJECT_ARSENAL: '项目军火库',
        TOTAL_PROJECTS: '项目总数',
        COMPLETED: '已完成',
        IN_PROGRESS: '进行中',
        LANG: '中文'
    }
};
