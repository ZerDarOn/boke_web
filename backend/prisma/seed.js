"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Initializing INK.SPIRIT Blog Database...\n');
    // 清空现有数据
    console.log('🧹 Cleaning existing data...');
    await prisma.comment.deleteMany();
    await prisma.photoComment.deleteMany();
    await prisma.galleryImage.deleteMany();
    await prisma.album.deleteMany();
    await prisma.diary.deleteMany();
    await prisma.anime.deleteMany();
    await prisma.timelineEvent.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.networkNode.deleteMany();
    await prisma.project.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.post.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.siteStats.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Data cleaned.\n');
    // 创建用户
    console.log('👤 Creating users...');
    const adminUser = await prisma.user.create({
        data: {
            username: 'cyber.ronin',
            email: 'ronin@cyber.ink',
            password: '$2a$10$rXqZzZzZzZzZzZzZzZzO.1', // bcrypt hash for "admin123"
            displayName: 'Cyber.Ronin',
            bio: 'Full-stack developer exploring the boundaries of code and consciousness.',
            location: 'Tokyo, Japan',
            website: 'https://cyber.ink',
            github: 'https://github.com/cyber-ronin',
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log(`✅ Created admin user: ${adminUser.username}\n`);
    // 创建文章
    console.log('📝 Creating posts...');
    const posts = await Promise.all([
        prisma.post.create({
            data: {
                id: 'post-01',
                title: '重构现实：赛博空间的虚无与存在',
                slug: 'reconstruct-reality-cyberspace',
                content: `当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？这是一个值得深思的问题。

## 虚拟与现实

柏拉图的洞穴寓言描述了一群被囚禁在洞穴中的人，他们只能看到洞穴壁上的影子，而这些影子其实是背后火光照射下的物体投射而成。他们认为这些影子就是现实。

在数字时代，我们是否也生活在这样的"洞穴"中？

虚拟DOM（Virtual DOM）的概念与这个寓言有着惊人的相似性。我们在代码中创建了一个虚拟的世界，通过diff算法计算差异，最终批量更新到真实的DOM。这个过程就像是我们先在脑海中构想一个世界，然后通过某种机制让它"降维"到物理世界。

## 编程的炼金术

古代炼金术士相信，通过特定的仪式和符号，可以改变物质的结构。编程，尤其是现代Web开发，本质上也是一种炼金术。

我们用React、Vue这些"法器"，通过声明式的"咒语"（JSX），将思想转化为可以运行的"能量"（JavaScript代码）。每次git commit，都是一次炼金术的完整流程：意图→符号→转化→验证。

## 赛博空间的存在论

赛博空间中的存在与物理世界有着本质的区别：

1. **可复制性**：数字信息可以无限复制而不损失质量
2. **瞬时传播**：数据可以以光速传输，突破物理限制
3. **可编程性**：虚拟世界的规则可以随时修改

这些特性让赛博空间成为了一个新的存在维度。在这个维度中，传统的"真实性"概念需要重新定义。

## 结语

当我们在读这篇文章的每一行字时，都是在参与一场关于现实的重构。代码不仅仅是工具，更是一种思考世界的哲学。

正如庄子所言："天地与我并生，而万物与我为一。"在赛博空间中，这种"并生"与"为一"获得了新的诠释。`,
                excerpt: '当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？探讨虚拟DOM与柏拉图洞穴寓言的奇妙联系。',
                date: new Date('2024-05-21'),
                category: 'PHILOSOPHY',
                tags: ['哲学', '虚拟现实', 'React', '柏拉图'],
                readingTime: '8 min',
                viewCount: 1250,
                likeCount: 89,
                isPublished: true,
                isFeatured: true,
                authorId: adminUser.id,
            },
        }),
        prisma.post.create({
            data: {
                id: 'post-02',
                title: '水墨组件库开发实录',
                slug: 'ink-component-library',
                content: `如何在 CSS 中复刻宣纸的渗透感？这是一个看似简单，实则充满挑战的问题。

## 最初的尝试：WebGL

最开始，我试图使用WebGL来渲染水墨效果。通过计算流体力学模拟墨水在宣纸上的扩散过程。

### 技术方案

使用 Three.js 和自定义 shader 来实现：

\`\`\`glsl
// 水墨扩散 fragment shader
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uInkTexture;

void main() {
  vec2 uv = vUv;
  
  // 模拟墨水扩散
  float diffusion = sin(uTime * 0.5 + uv.x * 10.0) * 0.1;
  float alpha = texture2D(uInkTexture, uv + vec2(diffusion)).r;
  
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * 0.7);
}
\`\`\`

### 遇到的问题

1. **性能开销**：每个组件都需要独立的 WebGL context，内存占用巨大
2. **兼容性**：部分低端设备无法流畅运行
3. **维护成本**：shader 代码难以调试和优化

## 转折点：SVG 滤镜

在一次偶然的机会中，我发现了 SVG 滤镜的强大功能。

### 技术原理

SVG 滤镜提供了 \`feTurbulence\` 和 \`feDisplacementMap\` 两个滤镜，可以模拟流体效果：

\`\`\`html
<svg style="display: none">
  <defs>
    <filter id="ink-effect">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>
\`\`\`

### CSS 应用

\`\`\`css
.ink-button {
  filter: url(#ink-effect);
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  transition: filter 0.3s ease;
}

.ink-button:hover {
  filter: url(#ink-effect) brightness(1.2);
}
\`\`\`

## 性能对比

| 方案 | 初始渲染 | 内存占用 | 兼容性 |
|------|---------|---------|--------|
| WebGL | 200ms | 50MB | 85% |
| SVG | 5ms | 2MB | 98% |

## 最终效果

通过 SVG 滤镜实现的按钮效果，既有水墨的渗透感，又保持了良好的性能。悬停时，墨水会轻轻"晕开"，如同真实的宣纸效果。

## 收获与思考

这次开发经历让我明白：

1. **不要过度设计**：选择最简单有效的方案，而不是最新最炫的技术
2. **性能优先**：在移动端时代，性能永远是第一考量
3. **美学与技术平衡**：好的设计应该是美的，同时也要是高效的

水墨组件库现在已经开源，欢迎大家在 GitHub 上提 issue 和 PR。`,
                excerpt: '如何在 CSS 中复刻宣纸的渗透感？记一次从 WebGL 到 SVG 滤镜的技术迁移过程，寻找性能与美学的平衡点。',
                date: new Date('2024-04-10'),
                category: 'ENGINEERING',
                tags: ['前端开发', 'WebGL', 'SVG', '性能优化'],
                readingTime: '12 min',
                viewCount: 890,
                likeCount: 56,
                isPublished: true,
                authorId: adminUser.id,
            },
        }),
        prisma.post.create({
            data: {
                id: 'post-03',
                title: '数字游民的修仙指南',
                slug: 'digital-nomad-cultivation-guide',
                content: `在这个永远在线的时代，如何像古代隐士一样保持内心的宁静？这是我一直思考的问题。

## 断网实验

为了寻找答案，我进行了一次为期24小时的断网实验。

### 实验规则

1. 完全断开所有网络连接
2. 不使用智能手机
3. 只保留纸笔和书籍

### 第一小时

焦虑。手指习惯性地去摸手机，大脑渴望新的刺激。就像糖瘾发作一样。

### 第六小时

平静。开始意识到时间的流逝，能听到窗外的鸟叫、邻居的谈话。世界变得更加"真实"。

### 第十二小时

创造力爆发。在没有干扰的状态下，大脑开始进行深度思考。我写下了三千字的读书笔记。

### 第二十四小时

回归网络时，发现错过了多少重要信息？答案是：几乎没有。

## 精力管理

古代修仙者讲究"精、气、神"的修炼。数字游民也需要类似的精力管理。

### 精（物理精力）

- **睡眠**：规律的作息是基础，晚上11点前入睡
- **运动**：每天30分钟有氧运动，提升心肺功能
- **饮食**：减少糖分摄入，保持血糖稳定

### 气（精神精力）

- **冥想**：每天10分钟正念冥想，训练专注力
- **断网**：每周一天"数字排毒日"
- **环境**：创造无干扰的工作环境

### 神（创造力）

- **深度工作**：每天安排2-3小时的深度工作时间
- **输入**：保持阅读习惯，为创造力提供养料
- **输出**：及时记录灵感，不要依赖记忆

## 实用工具

推荐一些我常用的工具：

- **番茄工作法**：保持工作节奏
- **Forest**：强制断网，种树保持专注
- **Notion**：知识管理，第二大脑
- **Obsidian**：双向链接笔记，知识图谱

## 结语

在这个信息过载的时代，保持内心的宁静是一种超能力。

就像道家所说："大道至简，衍化至繁。"真正的自由不是拥有更多选择，而是有能力说"不"。

愿我们都能在数字世界中找到属于自己的道场。`,
                excerpt: '在这个永远在线的时代，如何像古代隐士一样保持内心的宁静？我的断网实验与精力管理心得。',
                date: new Date('2024-03-15'),
                category: 'LIFESTYLE',
                tags: ['生活方式', '精力管理', '冥想', '数字游民'],
                readingTime: '10 min',
                viewCount: 1520,
                likeCount: 112,
                isPublished: true,
                authorId: adminUser.id,
            },
        }),
    ]);
    console.log(`✅ Created ${posts.length} posts\n`);
    // 创建公告
    console.log('📢 Creating announcements...');
    const announcements = await prisma.announcement.createMany({
        data: [
            {
                title: '网站全新改版上线',
                content: '经过数月的开发与打磨，全新的 INK.SPIRIT 博客正式上线！本次改版采用了赛博武侠风格设计，包含暗黑模式、技能矩阵、项目展示等全新功能。',
                type: 'SUCCESS',
                date: new Date('2024-05-20'),
            },
            {
                title: '系统维护通知',
                content: '计划于本周日凌晨 3:00-5:00 进行服务器维护，期间网站可能无法访问，敬请谅解。',
                type: 'WARNING',
                date: new Date('2024-05-15'),
            },
            {
                title: '新文章发布',
                content: '《重构现实：赛博空间的虚无与存在》已发布，欢迎阅读讨论。',
                type: 'INFO',
                date: new Date('2024-05-10'),
            },
        ],
    });
    console.log(`✅ Created ${announcements.count} announcements\n`);
    // 创建项目
    console.log('🚀 Creating projects...');
    const projects = await Promise.all([
        prisma.project.create({
            data: {
                id: 'proj-01',
                name: 'INK.ENGINE',
                slug: 'ink-engine',
                description: '即便在数字时代，文字也应有水墨的重量。一套专为长文阅读设计的深色模式主题。集成 WebGL 水墨渲染引擎与 React Server Components。',
                type: 'BLOG THEME',
                tech: ['Next.js', 'Tailwind', 'Framer', 'WebGL'],
                status: 'ACTIVE',
                featured: true,
                githubUrl: 'https://github.com/cyber-ronin/ink-engine',
                demoUrl: 'https://ink.engine.demo',
                startDate: new Date('2024-01-01'),
                readme: `## INK.ENGINE

### 项目简介

即便在数字时代，文字也应有水墨的重量。

### 技术栈

- Next.js
- Tailwind CSS
- Framer Motion
- WebGL

### 功能特性

- 深色模式主题
- 水墨渲染引擎
- React Server Components
- 优雅的阅读体验`,
            },
        }),
        prisma.project.create({
            data: {
                id: 'proj-02',
                name: 'ZEN.TIMER',
                slug: 'zen-timer',
                description: '结合番茄工作法与冥想白噪音的极简计时器，帮助开发者进入心流状态。获得 App Store 编辑推荐。',
                type: 'PRODUCTIVITY',
                tech: ['React Native', 'Swift'],
                status: 'DEPLOYED',
                featured: true,
                githubUrl: 'https://github.com/cyber-ronin/zen-timer',
                demoUrl: 'https://apps.apple.com/zen-timer',
                startDate: new Date('2023-12-01'),
                endDate: new Date('2024-01-15'),
                readme: `## ZEN.TIMER

结合番茄工作法与冥想白噪音的极简计时器。

### 功能

- 番茄工作法计时
- 白噪音音效
- 心流状态提示
- 数据统计

### 技术栈

- React Native
- Swift
- TypeScript`,
            },
        }),
        prisma.project.create({
            data: {
                id: 'proj-03',
                name: 'VOID.CLI',
                slug: 'void-cli',
                description: '用于快速脚手架生成和 Markdown 管理的命令行工具，专为博客写作优化。',
                type: 'DEV TOOL',
                tech: ['Rust', 'Clap'],
                status: 'ARCHIVED',
                featured: false,
                githubUrl: 'https://github.com/cyber-ronin/void-cli',
                startDate: new Date('2023-06-01'),
                endDate: new Date('2023-11-30'),
                readme: `## VOID.CLI

用于快速脚手架生成和 Markdown 管理的命令行工具。

### 命令

\`\`\`
void new <project-name>
void build <project-name>
void publish <project-name>
\`\`\`

### 技术栈

- Rust
- Clap
- Command Line Interface`,
            },
        }),
        prisma.project.create({
            data: {
                id: 'proj-04',
                name: 'NEON.DB',
                slug: 'neon-db',
                description: 'A lightweight distributed key-value store designed for edge computing scenarios.',
                type: 'DATABASE',
                tech: ['Go', 'Raft'],
                status: 'ACTIVE',
                featured: false,
                githubUrl: 'https://github.com/cyber-ronin/neon-db',
                demoUrl: 'https://neon.db.demo',
                startDate: new Date('2024-02-01'),
                readme: `## NEON.DB

A lightweight distributed key-value store designed for edge computing scenarios.

### 特性

- 轻量级设计
- 分布式架构
- 边缘计算优化
- Raft 共识算法

### 性能

- 高吞吐量
- 低延迟
- 弹性扩展`,
            },
        }),
        prisma.project.create({
            data: {
                id: 'proj-05',
                name: 'PIXEL.ARTS',
                slug: 'pixel-arts',
                description: 'Browser-based pixel art editor with real-time collaboration features.',
                type: 'CANVAS',
                tech: ['HTML5', 'JavaScript', 'WebSocket'],
                status: 'DEPLOYED',
                featured: false,
                demoUrl: 'https://pixel.arts.demo',
                startDate: new Date('2023-09-01'),
                readme: `## PIXEL.ARTS

Browser-based pixel art editor with real-time collaboration features.

### 功能

- 像素级编辑
- 实时协作
- 图层管理
- 导出功能

### 技术栈

- HTML5 Canvas
- JavaScript
- WebSocket（实时协作）`,
            },
        }),
    ]);
    console.log(`✅ Created ${projects.length} projects\n`);
    // 创建技能
    console.log('⚔️ Creating skills...');
    const skills = await prisma.skill.createMany({
        data: [
            // FRONTEND.CORE
            { name: 'React / Next.js', category: 'FRONTEND.CORE', level: 95, projectCount: 15, rank: 'Master', nodeType: 'major', connections: [] },
            { name: 'TypeScript', category: 'FRONTEND.CORE', level: 90, projectCount: 12, rank: 'Expert', nodeType: 'major', connections: [] },
            { name: 'Tailwind CSS', category: 'FRONTEND.CORE', level: 92, projectCount: 20, rank: 'Master', nodeType: 'minor', connections: [] },
            { name: 'WebGL / Three.js', category: 'FRONTEND.CORE', level: 75, projectCount: 4, rank: 'Adept', nodeType: 'minor', connections: [] },
            // BACKEND.OPS
            { name: 'Node.js', category: 'BACKEND.OPS', level: 85, projectCount: 8, rank: 'Expert', nodeType: 'major', connections: [] },
            { name: 'Rust', category: 'BACKEND.OPS', level: 60, projectCount: 2, rank: 'Novice', nodeType: 'minor', connections: [] },
            { name: 'PostgreSQL', category: 'BACKEND.OPS', level: 80, projectCount: 6, rank: 'Expert', nodeType: 'minor', connections: [] },
            { name: 'Docker / K8s', category: 'BACKEND.OPS', level: 70, projectCount: 5, rank: 'Adept', nodeType: 'minor', connections: [] },
            // DESIGN.ARTS
            { name: 'Figma', category: 'DESIGN.ARTS', level: 88, projectCount: 25, rank: 'Master', nodeType: 'major', connections: [] },
            { name: 'UI / UX', category: 'DESIGN.ARTS', level: 85, projectCount: 10, rank: 'Expert', nodeType: 'major', connections: [] },
            { name: 'Motion Design', category: 'DESIGN.ARTS', level: 72, projectCount: 3, rank: 'Adept', nodeType: 'minor', connections: [] },
        ],
    });
    console.log(`✅ Created ${skills.count} skills\n`);
    // 创建时间线事件
    console.log('📅 Creating timeline events...');
    const timelineEvents = await prisma.timelineEvent.createMany({
        data: [
            { year: '2024', date: '05.20', title: 'INK.SPIRIT Launch', description: 'Official release of Cyber-Wuxia portfolio theme.', type: 'MILESTONE' },
            { year: '2024', date: '01.15', title: 'Joined Tech Giant', description: 'Started new role as Senior Frontend Engineer.', type: 'JOB' },
            { year: '2023', date: '11.08', title: 'Rust Journey Begins', description: 'First "Hello World" in Rust. The strict compiler became my mentor.', type: 'MILESTONE' },
            { year: '2023', date: '06.21', title: 'Graduation', description: 'Master of Computer Science from Cyber University.', type: 'LIFE' },
            { year: '2022', date: '09.01', title: 'Open Source Contributor', description: 'Merged first PR to a major React library.', type: 'MILESTONE' },
        ],
    });
    console.log(`✅ Created ${timelineEvents.count} timeline events\n`);
    // 创建动漫
    console.log('🎬 Creating anime...');
    const anime = await prisma.anime.createMany({
        data: [
            {
                title: 'Ghost in the Shell: SAC_2045',
                cover: '#1a1b26',
                bannerImage: '#0f1014',
                type: 'TV',
                episodes: 26,
                currentEp: 24,
                status: 'WATCHING',
                score: 9.5,
                favorite: true,
                studios: ['Production I.G', 'Sola Digital Arts'],
                genres: ['Sci-Fi', 'Action', 'Cyberpunk', 'Psychological'],
                synopsis: 'In year 2045, after two world wars have left the world in ruins, the world is run by the "Global Sync", a network that connects everything.',
                startDate: new Date('2024-01-15'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230768',
                tags: ['赛博朋克', '经典', '深度'],
            },
            {
                title: 'Cyberpunk: Edgerunners',
                cover: '#10b981',
                bannerImage: '#064e3b',
                type: 'TV',
                episodes: 10,
                currentEp: 10,
                status: 'COMPLETED',
                score: 9.0,
                favorite: true,
                studios: ['Studio Trigger'],
                genres: ['Sci-Fi', 'Action', 'Cyberpunk', 'Tragedy'],
                synopsis: 'In Night City, a metropolis obsessed with power and modification, David Martinez, a street kid struggling to survive, decides to become an edgerunner.',
                startDate: new Date('2022-09-13'),
                finishDate: new Date('2022-09-20'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230769',
                tags: ['视觉盛宴', '悲剧', '夜之城'],
            },
            {
                title: 'Serial Experiments Lain',
                cover: '#525252',
                bannerImage: '#292524',
                type: 'TV',
                episodes: 13,
                currentEp: 13,
                status: 'COMPLETED',
                score: 10.0,
                favorite: false,
                studios: ['Triangle Staff'],
                genres: ['Sci-Fi', 'Psychological', 'Mystery', 'Horror'],
                synopsis: 'Lain Iwakura appears to be an ordinary, shy middle school girl. But when her classmates begin receiving strange emails from Chisa Yomoda...',
                startDate: new Date('2023-03-10'),
                finishDate: new Date('2023-03-23'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230770',
                tags: ['神作', '意识流', '赛博恐怖'],
            },
            {
                title: 'Ergo Proxy',
                cover: '#262626',
                bannerImage: '#18181b',
                type: 'TV',
                episodes: 23,
                currentEp: 5,
                status: 'ON_HOLD',
                studios: ['Manglobe'],
                genres: ['Sci-Fi', 'Mystery', 'Psychological', 'Dystopian'],
                synopsis: 'In a post-apocalyptic future, the city of Romdo is a utopian paradise created by AutoReivs.',
                startDate: new Date('2024-02-01'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230771',
                tags: ['悬疑', '末世', '待续'],
            },
            {
                title: 'Psycho-Pass',
                cover: '#059669',
                bannerImage: '#065f46',
                type: 'TV',
                episodes: 22,
                currentEp: 12,
                status: 'WATCHING',
                studios: ['Production I.G'],
                genres: ['Sci-Fi', 'Psychological', 'Action', 'Police'],
                synopsis: 'In the 22nd century, Japan is governed by the Sibyl System—an AI that can measure the mental state of every citizen.',
                startDate: new Date('2024-01-05'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230772',
                tags: ['反乌托邦', '道德困境', '心理'],
            },
            {
                title: 'Steins;Gate',
                cover: '#404040',
                bannerImage: '#27272a',
                type: 'TV',
                episodes: 24,
                currentEp: 24,
                status: 'COMPLETED',
                score: 9.8,
                favorite: true,
                studios: ['White Fox'],
                genres: ['Sci-Fi', 'Thriller', 'Psychological', 'Romance'],
                synopsis: 'Rintarou Okabe is an eccentric self-proclaimed "mad scientist" who runs a laboratory with his friends Mayuri and Daru.',
                startDate: new Date('2023-05-20'),
                finishDate: new Date('2023-06-12'),
                bilibiliUrl: 'https://www.bilibili.com/bangumi/media/md28230774',
                tags: ['神作', '时间旅行', '催泪'],
            },
        ],
    });
    console.log(`✅ Created ${anime.count} anime\n`);
    // 创建日记
    console.log('📔 Creating diaries...');
    const diaries = await prisma.diary.createMany({
        data: [
            {
                type: 'SHORT',
                content: '今日大雨。键盘敲击声与雨声共鸣，代码如同溪流般自然流淌。无Bug，大吉。',
                stamp: 'FLOW',
                date: new Date('2024-05-24'),
                tags: ['心情', '编码'],
            },
            {
                type: 'SHORT',
                content: '阅读《黑客与画家》，意识到编程本质上是一种现代的炼金术。我们将思想转化为现实。',
                stamp: 'READ',
                date: new Date('2024-05-22'),
                tags: ['阅读', '思考'],
            },
            {
                type: 'SHORT',
                content: '深夜调试，发现系统崩溃的原因竟是一个多余的分号。大道至简，衍化至繁。',
                stamp: 'BUG',
                date: new Date('2024-05-18'),
                tags: ['调试', '感悟'],
            },
            {
                type: 'SHORT',
                content: '在咖啡馆坐了一下午，观察人群。每个人都是一个独立的线程，偶尔发生死锁。',
                stamp: 'OBSERVE',
                date: new Date('2024-05-15'),
                tags: ['观察', '生活'],
            },
            {
                type: 'SHORT',
                content: '尝试断网一天。世界并没有因此停止运转，但我内心的CPU占用率显著下降了。',
                stamp: 'OFFLINE',
                date: new Date('2024-05-10'),
                tags: ['断网', '冥想'],
            },
            {
                type: 'LONG',
                title: '这是我的第一篇日记',
                subtitle: '随时随地分享生活',
                content: `今天是在东京的第二天，天气格外的好。早晨的阳光透过窗帘洒进来，整个房间都被温暖的光线包裹。

## 早晨的咖啡

在附近的小巷里找到了一家手冲咖啡店。店主是一位年迈的先生，他告诉我这家店已经开了三十年。每一杯咖啡都是用心冲泡的，我能感受到那份坚持。

"咖啡是时间的艺术。"他这样说道。

## 涩谷的黄昏

傍晚时分去了涩谷。人潮涌动，霓虹灯开始闪烁。站在十字路口，我看着来来往往的人群，每个人都像是在自己的轨道上运行的线程。

有时候我会想，在这个数字化的世界里，我们是否还能保留一些真实的连接？

## 晚餐时间

在居酒屋吃了一顿温暖的晚餐。旁边坐着一群上班族，他们在谈论工作，但我能从他们的笑声中感受到纯粹的快乐。

这一天过得很充实。记录下来，是为了不让这些美好的瞬间流失。`,
                location: '东京',
                mood: '😊',
                weather: '☀️',
                coverImage: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
                date: new Date('2024-05-20'),
                tags: ['生活', '旅行', '记录'],
                readingTime: '3 min',
            },
        ],
    });
    console.log(`✅ Created ${diaries.count} diaries\n`);
    // 创建相册和照片
    console.log('📷 Creating gallery...');
    const album1 = await prisma.album.create({
        data: {
            title: '东京赛博之旅',
            cover: '#27272a',
            location: 'TOKYO',
            thoughts: '这次东京之旅，让我对赛博与现实的界限有了新的理解。涩谷的霓虹仿佛是另一个世界的入口，那些闪烁的招牌、匆匆的人群，每个人都在自己的轨道上运行。我开始思考，在这个数字化高度发达的时代，我们是否正生活在某种"赛博空间"中？代码、数据、算法，这些无形的东西正在重塑我们的生活方式。',
            photoCount: 4,
        },
    });
    const album2 = await prisma.album.create({
        data: {
            title: '自然代码',
            cover: '#047857',
            location: 'VARIOUS',
            thoughts: '大自然是最好的程序员。森林中的每一片叶子、每一条河流，都是经过数亿年"算法"优化的产物。走在林间，我会不自觉地用编程的视角去理解这个世界——光合作用是太阳能的能量转换算法，生态系统是分布式系统的完美范例。也许我们可以从大自然中学习更多"设计模式"。',
            photoCount: 2,
        },
    });
    const galleryImages = await prisma.galleryImage.createMany({
        data: [
            {
                title: 'NEON RAIN',
                src: '#27272a',
                date: new Date('2024-05-20'),
                location: 'SHIBUYA',
                aspect: 'landscape',
                description: '深夜的涩谷街头，霓虹灯光与雨水交织，仿佛现实与虚拟的边界被模糊。这是一个赛博朋克夜晚的缩影。',
                camera: 'SONY A7M4',
                settings: 'ISO 800, f/2.8, 1/60s',
                tags: ['东京', '霓虹', '夜景', '赛博'],
                albumId: album1.id,
            },
            {
                title: 'SERVER ROOM',
                src: '#18181b',
                date: new Date('2024-04-15'),
                location: 'DATA CENTER',
                aspect: 'portrait',
                description: '服务器机房如同数字时代的圣殿，成排的机柜像是沉默的巨人，承载着海量数据。',
                camera: 'SONY A7M4',
                settings: 'ISO 400, f/4.0, 1/30s',
                tags: ['数据', '服务器', '科技'],
                albumId: album1.id,
            },
            {
                title: 'QUIET ALLEY',
                src: '#52525b',
                date: new Date('2024-03-10'),
                location: 'KYOTO',
                aspect: 'portrait',
                description: '京都的静巷，古老与现代交织。传统建筑在夜色中显得格外宁静。',
                camera: 'SONY A7M4',
                settings: 'ISO 200, f/2.8, 1/125s',
                tags: ['京都', '静巷', '传统'],
                albumId: album1.id,
            },
            {
                title: 'TERMINAL',
                src: '#09090b',
                date: new Date('2024-02-28'),
                location: 'HOME',
                aspect: 'square',
                description: '深夜编码时的工作台，终端窗口的光芒是唯一的照明。代码如同诗行，在黑暗中流淌。',
                camera: 'iPhone 15 Pro',
                settings: 'ISO 64, f/1.78, 1/30s',
                tags: ['代码', '终端', '工作台'],
                albumId: album1.id,
            },
            {
                title: 'NATURE CODE',
                src: '#047857',
                date: new Date('2024-01-12'),
                location: 'FOREST',
                aspect: 'landscape',
                description: '森林中的光线透过树叶洒下，如同大自然编写的代码。每一道光线都是一个字符。',
                camera: 'SONY A7M4',
                settings: 'ISO 100, f/8.0, 1/250s',
                tags: ['森林', '自然', '光线'],
                albumId: album2.id,
            },
            {
                title: 'ABSTRACT',
                src: '#3f3f46',
                date: new Date('2023-12-25'),
                location: 'MIND',
                aspect: 'portrait',
                description: '意识深处的抽象影像，如同梦境中的片段。无法用语言描述，只能在直觉中感受。',
                camera: 'SONY A7M4',
                settings: 'ISO 1600, f/1.4, 1/15s',
                tags: ['抽象', '梦境', '意识'],
                albumId: album2.id,
            },
        ],
    });
    console.log(`✅ Created ${galleryImages.count} gallery images in 2 albums\n`);
    // 创建关系网络节点
    console.log('🕸️ Creating network nodes...');
    const networkNodes = await prisma.networkNode.createMany({
        data: [
            {
                name: 'Cyber.Ronin',
                role: 'Construct',
                description: 'The Architect of this digital realm.',
                type: 'core',
                x: 50,
                y: 50,
                connections: ['mentor', 'neon-fox', 'data-ghost', 'open-source'],
            },
            {
                name: 'Master.Void',
                role: 'Mentor',
                description: 'Taught me the way of Rust and low-level alchemy.',
                type: 'major',
                x: 20,
                y: 20,
                connections: [],
            },
            {
                name: 'Neon.Fox',
                role: 'Collaborator',
                description: 'UI/UX Sorceress. Co-author of Ink Engine.',
                type: 'major',
                x: 80,
                y: 30,
                connections: [],
            },
            {
                name: 'Data.Ghost',
                role: 'Backend',
                description: 'Guardian of databases. Never sleeps.',
                type: 'major',
                x: 70,
                y: 70,
                connections: [],
            },
            {
                name: 'Open Source',
                role: 'Community',
                description: 'The vast ocean of knowledge we all draw from.',
                type: 'minor',
                x: 30,
                y: 80,
                connections: [],
            },
        ],
    });
    console.log(`✅ Created ${networkNodes.count} network nodes\n`);
    // 创建最新活动
    console.log('⚡ Creating activities...');
    const activities = await prisma.activity.createMany({
        data: [
            {
                project: 'ink-spirit-blog',
                title: '博客系统重构完成',
                tags: ['React', 'TypeScript', 'Vite'],
                status: 'DONE',
                date: new Date('2024-05-10'),
            },
            {
                project: 'pixel-cabin-theme',
                title: 'Pixel Cabin 主题上线',
                tags: ['Design', 'CSS'],
                status: 'DONE',
                date: new Date('2024-04-28'),
            },
            {
                project: 'performance-optimization',
                title: '性能优化与代码分割',
                tags: ['Vite', 'Webpack'],
                status: 'IN_PROGRESS',
                date: new Date('2024-04-20'),
            },
            {
                project: 'rss-integration',
                title: 'RSS 订阅功能集成',
                tags: ['XML', 'Vite'],
                status: 'DONE',
                date: new Date('2024-04-15'),
            },
            {
                project: 'giscus-comments',
                title: 'Giscus 评论系统部署',
                tags: ['GitHub', 'Comments'],
                status: 'DONE',
                date: new Date('2024-04-10'),
            },
        ],
    });
    console.log(`✅ Created ${activities.count} activities\n`);
    // 创建网站统计
    console.log('📊 Creating site stats...');
    await prisma.siteStats.create({
        data: {
            date: new Date(),
            pageViews: 15420,
            uniqueVisitors: 3855,
            postViews: {
                'post-01': 1250,
                'post-02': 890,
                'post-03': 1520,
            },
        },
    });
    console.log('✅ Created site stats\n');
    console.log('═══════════════════════════════════════');
    console.log('✨ Database initialization completed!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Users: 1`);
    console.log(`   - Posts: ${posts.length}`);
    console.log(`   - Announcements: ${announcements.count}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Skills: ${skills.count}`);
    console.log(`   - Anime: ${anime.count}`);
    console.log(`   - Diaries: ${diaries.count}`);
    console.log(`   - Gallery Images: ${galleryImages.count}`);
    console.log(`   - Albums: 2`);
    console.log(`   - Network Nodes: ${networkNodes.count}`);
    console.log(`   - Activities: ${activities.count}`);
    console.log('');
    console.log('🚀 You can now start the server with: npm run dev');
    console.log('');
    console.log('💡 Default admin credentials:');
    console.log('   Username: cyber.ronin');
    console.log('   Password: admin123');
    console.log('');
}
//# sourceMappingURL=seed.js.map