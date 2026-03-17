import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding INK.SPIRIT Blog project data...\n');

  // 1. 创建公告
  console.log('📢 Creating announcements...');
  const announcement = await prisma.announcement.create({
    data: {
      title: 'INK.SPIRIT Blog 正式上线',
      content: `欢迎来到 INK.SPIRIT Blog —— 一个融合赛博朋克与水墨美学的个人博客系统。

**核心特性：**
- 🎨 赛博武侠风格 UI，暗黑模式优先
- 📝 支持 Markdown 写作与代码高亮
- 🤖 AI 驱动的内容摘要与标签生成
- 🔐 JWT 认证 + 密码保护文章
- 📊 完整的后台管理系统

**技术栈：** React 19 + Node.js + PostgreSQL + FastAPI + LangChain

这是我的第一个项目展示，后续将持续更新与优化。感谢访问！`,
      type: 'IMPORTANT',
      date: new Date(),
    },
  });
  console.log(`✅ Created announcement: ${announcement.title}\n`);

  // 2. 创建项目
  console.log('🚀 Creating project...');
  const project = await prisma.project.create({
    data: {
      name: 'INK.SPIRIT Blog',
      slug: 'ink-spirit-blog',
      description: `一个融合赛博朋克与水墨美学的个人博客系统。支持文章发布、项目展示、技能矩阵、追番记录、日记、相册等功能。集成 AI 服务实现智能摘要与标签生成。`,
      type: 'BLOG SYSTEM',
      tech: [
        'React 19',
        'TypeScript',
        'Vite',
        'Tailwind CSS',
        'Node.js',
        'Express',
        'Prisma ORM',
        'PostgreSQL',
        'FastAPI',
        'LangChain',
        'Redis',
        'MinIO',
        'Docker',
      ],
      status: 'ACTIVE',
      featured: true,
      startDate: new Date('2024-01-01'),
      readme: `# INK.SPIRIT Blog

> 即便在数字时代，文字也应有水墨的重量。

## 项目简介

INK.SPIRIT Blog 是一个融合赛博朋克与水墨美学的个人博客系统，采用前后端分离架构，支持多种内容类型管理。

## 核心功能

### 内容管理
- 📝 **文章系统** - 支持 Markdown、代码高亮、访问控制
- 🚀 **项目展示** - 项目状态管理、技术栈展示
- ⚔️ **技能矩阵** - 可视化技能图谱与关联
- 📺 **追番记录** - 动漫追踪与评分
- 📖 **日记系统** - 短篇/长篇日记
- 🖼️ **相册管理** - 图片上传与相册组织

### 技术特性
- 🎨 赛博武侠风格 UI
- 🔐 JWT 认证 + 角色权限
- 🤖 AI 智能摘要与标签
- 📊 完整后台管理
- 🐳 Docker 一键部署

## 系统架构

\`\`\`
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Frontend  │   │   Backend   │   │  AI Service │
│  React+Vite │   │Node+Express │   │FastAPI+LLM  │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
  ┌─────────┐      ┌─────────┐      ┌─────────┐
  │PostgreSQL│      │  Redis  │      │  MinIO  │
  └─────────┘      └─────────┘      └─────────┘
\`\`\`

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 (可选) |
| 存储 | MinIO (可选) |
| AI服务 | Python FastAPI + LangChain |
| 认证 | JWT + bcryptjs |

## 开发历程

- **2024.01** - 项目启动，初始化前端架构
- **2024.03** - 后端 API 开发，数据库设计
- **2024.05** - AI 服务集成，内容管理完善
- **2024.06** - 安全加固，性能优化
- **2024.07** - MVP 版本发布

## 快速开始

\`\`\`bash
# 克隆项目
git clone https://github.com/your-username/ink-spirit-blog.git

# 配置环境变量
cp .env.example .env

# 启动服务
docker-compose up -d

# 初始化数据库
cd backend && npm run db:init
\`\`\`

## License

MIT`,
    },
  });
  console.log(`✅ Created project: ${project.name}\n`);

  // 3. 创建介绍文章
  console.log('📝 Creating article...');
  const post = await prisma.post.create({
    data: {
      title: 'INK.SPIRIT Blog：赛博与水墨的数字交汇',
      slug: 'ink-spirit-blog-introduction',
      content: `# INK.SPIRIT Blog：赛博与水墨的数字交汇

> 即便在数字时代，文字也应有水墨的重量。

## 缘起

这个博客系统的诞生，源于一个简单的想法：在这个信息爆炸的时代，如何让阅读回归本质？

我不想要花哨的动效，不想要臃肿的功能。我想要的是一个安静的角落，像古人铺开宣纸，研墨执笔，让思绪流淌。

同时，作为开发者，我又无法抗拒技术的魅力。于是，**赛博朋克**与**水墨美学**的碰撞就此产生。

## 技术选型

### 前端：React 19 + Vite

选择 React 19 是因为它的 Concurrent Mode 和 Server Components 支持。Vite 则提供了极致的开发体验。

\`\`\`typescript
// 技术栈概览
const frontend = {
  framework: 'React 19',
  bundler: 'Vite 6',
  styling: 'Tailwind CSS',
  state: 'React Query + Context',
  types: 'TypeScript 5.8',
};
\`\`\`

### 后端：Node.js + Express + Prisma

后端采用经典的 Express 架构，配合 Prisma ORM 实现类型安全的数据库操作。

\`\`\`typescript
// Prisma Schema 示例
model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String
  accessLevel AccessLevel @default(PUBLIC)
  // ...
}
\`\`\`

### AI 服务：FastAPI + LangChain

这是整个系统最有意思的部分。通过 LangChain 集成多种 LLM，实现：

- 自动文章摘要
- 智能标签生成
- 内容情感分析
- 个性化推荐

\`\`\`python
# AI 服务架构
class AIService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4")
        self.chain = load_summarize_chain(self.llm)
    
    async def summarize(self, content: str) -> str:
        return await self.chain.arun(content)
\`\`\`

## 设计理念

### 赛博武侠

设计灵感来自《攻壳机动队》与《神经漫游者》，但加入了东方武侠元素。

- **配色**：深邃的黑 + 霓虹的紫/青
- **字体**：等宽代码字体 + 衬线正文
- **动效**：克制的动画，如同水墨晕染

### 功能极简

只保留必要功能：

1. **写** - Markdown 编辑，专注内容
2. **读** - 优雅排版，沉浸阅读
3. **管** - 简洁后台，高效管理

## 开源

项目已在 GitHub 开源，欢迎 Star 和贡献！

\`\`\`bash
git clone https://github.com/your-username/ink-spirit-blog.git
\`\`\`

## 致谢

感谢所有开源项目的贡献者，是这个社区让这个项目成为可能。

---

*愿你在数字世界中，找到属于自己的那片水墨。*`,
      excerpt: '一个融合赛博朋克与水墨美学的个人博客系统。本文介绍项目的技术选型、设计理念和核心功能。',
      date: new Date(),
      category: 'PROJECT',
      tags: ['项目介绍', 'React', 'Node.js', '开源'],
      readingTime: '8 min',
      viewCount: 0,
      likeCount: 0,
      isPublished: true,
      isFeatured: true,
      accessLevel: 'PUBLIC',
    },
  });
  console.log(`✅ Created post: ${post.title}\n`);

  // 4. 创建当前状态
  console.log('📊 Creating current status...');
  const status = await prisma.currentStatus.create({
    data: {
      title: 'BUILDING THE FUTURE',
      currentFocus: 'INK.SPIRIT Blog 持续迭代中',
      location: 'Digital Realm, Cyberspace',
      vibe: '💻 Coding / ☕ Coffee / 📖 Reading',
      emoji: '⚡',
      isActive: true,
    },
  });
  console.log(`✅ Created current status\n`);

  // 5. 创建历史记录
  console.log('📜 Creating history item...');
  const historyItem = await prisma.historyItem.create({
    data: {
      date: '2024年1月 - 至今',
      title: 'INK.SPIRIT Blog',
      role: '全栈开发 / 架构设计',
      description: `设计并开发一个融合赛博朋克与水墨美学的个人博客系统。采用前后端分离架构，集成 AI 服务实现智能内容处理。

主要职责：
- 前端架构设计与 React 组件开发
- 后端 RESTful API 设计与实现
- PostgreSQL 数据库建模与优化
- FastAPI AI 微服务开发
- Docker 容器化部署方案`,
      duration: '持续迭代中',
      location: '远程',
      tags: ['个人项目', 'React', 'Node.js', 'PostgreSQL', 'AI', '开源'],
      color: '#a855f7',
      icon: 'Code',
      order: 1,
      isActive: true,
    },
  });
  console.log(`✅ Created history item: ${historyItem.title}\n`);

  // 6. 创建时间线事件
  console.log('📅 Creating timeline events...');
  const timelineEvents = await Promise.all([
    prisma.timelineEvent.create({
      data: {
        year: '2024',
        date: '2024-01',
        title: 'INK.SPIRIT Blog 项目启动',
        description: '开始设计博客系统架构，确定技术栈选型',
        type: 'MILESTONE',
        projectId: project.id,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        year: '2024',
        date: '2024-03',
        title: '后端 API 开发完成',
        description: '完成核心 API 开发，实现文章、项目、技能等模块',
        type: 'MILESTONE',
        projectId: project.id,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        year: '2024',
        date: '2024-05',
        title: 'AI 服务集成',
        description: '集成 FastAPI + LangChain，实现智能摘要与标签生成',
        type: 'MILESTONE',
        projectId: project.id,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        year: '2024',
        date: '2024-06',
        title: '安全加固与性能优化',
        description: 'JWT 认证、CSRF 防护、API 缓存、N+1 查询优化',
        type: 'MILESTONE',
        projectId: project.id,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        year: '2024',
        date: '2024-07',
        title: 'MVP 版本发布',
        description: '博客系统正式上线，开启持续迭代',
        type: 'MILESTONE',
        projectId: project.id,
      },
    }),
  ]);
  console.log(`✅ Created ${timelineEvents.length} timeline events\n`);

  // 7. 创建核心技能
  console.log('⚔️ Creating skills...');
  const skills = await prisma.skill.createMany({
    data: [
      {
        name: 'React / Next.js',
        category: 'FRONTEND.CORE',
        level: 95,
        projectCount: 1,
        rank: 'Master',
        nodeType: 'major',
        connections: [],
      },
      {
        name: 'TypeScript',
        category: 'FRONTEND.CORE',
        level: 90,
        projectCount: 1,
        rank: 'Expert',
        nodeType: 'major',
        connections: [],
      },
      {
        name: 'Tailwind CSS',
        category: 'FRONTEND.CORE',
        level: 92,
        projectCount: 1,
        rank: 'Master',
        nodeType: 'minor',
        connections: [],
      },
      {
        name: 'Node.js / Express',
        category: 'BACKEND.OPS',
        level: 85,
        projectCount: 1,
        rank: 'Expert',
        nodeType: 'major',
        connections: [],
      },
      {
        name: 'Prisma ORM',
        category: 'BACKEND.OPS',
        level: 88,
        projectCount: 1,
        rank: 'Expert',
        nodeType: 'major',
        connections: [],
      },
      {
        name: 'PostgreSQL',
        category: 'BACKEND.OPS',
        level: 80,
        projectCount: 1,
        rank: 'Expert',
        nodeType: 'minor',
        connections: [],
      },
      {
        name: 'Python / FastAPI',
        category: 'BACKEND.OPS',
        level: 75,
        projectCount: 1,
        rank: 'Adept',
        nodeType: 'minor',
        connections: [],
      },
      {
        name: 'LangChain',
        category: 'AI.ML',
        level: 70,
        projectCount: 1,
        rank: 'Adept',
        nodeType: 'minor',
        connections: [],
      },
      {
        name: 'Docker',
        category: 'DEVOPS',
        level: 75,
        projectCount: 1,
        rank: 'Adept',
        nodeType: 'minor',
        connections: [],
      },
    ],
  });
  console.log(`✅ Created ${skills.count} skills\n`);

  console.log('✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 1 公告');
  console.log('   - 1 项目');
  console.log('   - 1 文章');
  console.log('   - 1 当前状态');
  console.log('   - 1 历史记录');
  console.log('   - 5 时间线事件');
  console.log('   - 9 技能');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
