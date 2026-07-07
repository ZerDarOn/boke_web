/**
 * Blog Content Seed Script
 * Inserts blog posts and projects directly into the database
 * Usage: npx tsx prisma/seed-content.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding blog content...');

  // ============================================
  // POSTS
  // ============================================

  const posts = [
    {
      title: 'INK.SPIRIT 是怎么长出来的',
      slug: 'ink-spirit-blog-intro',
      excerpt: '从“想有个地方放东西”开始，到后来长出博客、项目馆、音乐馆、游戏馆和一堆小彩蛋，INK.SPIRIT 更像是在持续对话中慢慢成形的数字居所。',
      category: '项目',
      tags: ['React', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'TailwindCSS'],
      readingTime: '8 min',
      isFeatured: true,
      content: `# INK.SPIRIT 是怎么长出来的

最初只是想给自己做一个能写东西、放作品的地方。看了市面上现成的方案，总觉得哪里不太对：有的太像 CMS，有的太像文档站，有的好看但没法改。后来我干脆决定，从零搭一个自己完全能控制的站点。

这就是 INK.SPIRIT 的起点。

## 第一阶段：先有骨架

最早 commit 里只有最简单的东西——博客该有的基本页面：首页、文章列表、文章详情、公告、相册、追番、日记。那时候后端还没进场，很多数据都是写死在前端里的假数据。但先把页面跑起来很重要，因为它让我第一次看清了这个站会长成什么形状。

第一版的关键词是“多路由”和“侧边栏”。左栏导航、右栏 RSS 和最新动态，这种三栏结构一直延续到了现在。后来回头看，它其实早早就定下了 INK.SPIRIT 的某种气质：信息中心化，内容模块化。

## 第二阶段：后端接上来

前端跑顺之后，我开始补后端。选了 Express + Prisma + PostgreSQL，原因很简单：轻量、熟悉、类型舒服。加上 JWT 鉴权、bcrypt 哈希、请求限流这些基础安全之后，后台管理页面才正式有意义。

这一步最大的变化是，内容不再写死在代码里，而是可以真的新建、编辑、发布。文章、项目、相册、时间线、技能、关系网络，一个个模块开始进数据库。

## 第三阶段：把自己填进去

站点能用了之后，开始往里面搬东西。项目页放了三个在做或已经部署的东西：INK.SPIRIT 本身、ArkHeart、FrameForge。技能矩阵、时间线、关系网络也陆续有了内容。

但也正是在这个阶段，我第一次感到“数据”和“内容”的差别。动漫和游戏可以通过 Steam、B 站同步进来一百多条，但它们只是数据，不是内容。真正让读者能看懂的，是短评、进度、观点。这部分后来成了需要持续维护的功课。

## 第四阶段：长出更多房间

后来站点开始增加一些更“生活化”的模块：音乐馆接入了网易云歌单，游戏馆接入了 Steam，想法流 / 日记让首页能放一些零散的记录。还有一个 Konami Code 彩蛋——上上下下左右左右 BABA，会解锁隐藏的 Settings 入口。没什么实际用途，但每次自己玩都觉得开心。

视觉上也慢慢收敛。一开始只是深色主题，后来加入了 HSL 色相滑块，可以自定义主题色；Tailwind 配置从硬编码色值改成了 CSS 变量；Hero 区域加了 SVG 波浪和 Canvas 特效。墨绿、紫色、霓虹感，这些元素一点点组合成了现在看到的风格。

## 它现在是什么

INK.SPIRIT 对我来说已经不只是一个“博客系统”。它更像是一个数字居所：

- 文章区放长一点的思考和项目复盘
- 项目馆展示做过的东西
- 音乐馆和游戏馆放一些偏个人的喜好
- 日记和想法流记录更碎的日常
- 关于页和时间线用来回答“你是谁”

它当然还没填满。很多模块只是开了房间，里面还空着。但框架已经稳定，风格也已经清晰，接下来只需要持续往里面放东西。

## 接下来想做的事

- 继续写项目背后的过程，而不是只写项目介绍
- 把动漫和游戏列表里真正看完/玩过的部分，改成短评或推荐
- 相册和日记先各填一组真实内容
- 让评论区活起来

> 一个站点最终会变成它主人的样子。INK.SPIRIT 现在还在生长中。`,
    },
    {
      title: 'ArkHeart 方舟之心 — AI 桌面宠物的认知架构设计',
      slug: 'arkheart-ai-companion-design',
      excerpt: '一个事件驱动的、高度模块化的 AI 桌面宠物核心系统，探索可持续进化的认知架构。',
      category: '项目',
      tags: ['AI', 'FastAPI', 'Python', 'WebSocket', 'LLM', '情感计算'],
      readingTime: '12 min',
      isFeatured: false,
      content: `# ArkHeart 方舟之心 — AI 桌面宠物的认知架构

## 这是什么？

**方舟之心 (ArkHeart)** 是 AI 桌面宠物"方舟"项目的核心智能中枢。它是一个运行在本地的、事件驱动的、高度模块化的服务，负责驱动宠物的所有行为、记忆、情感和进化。

这不是一个传统的 CRUD 应用，而是一个**可持续进化的认知架构**。

## 核心架构哲学

### 大脑/身体/启动器分离

通过物理或逻辑进程分离，实现了智能、表现和管理的极致解耦：

- **ArkHeart（大脑）** — Python + FastAPI，负责决策、记忆、情感
- **ArkBody（身体）** — Godot Engine，负责视觉表现和动画
- **ArkLauncher（启动器）** — Tauri 桌面应用，负责生命周期管理

### 事件驱动

所有内部模块均通过一个中央"事件总线"进行异步通信，杜绝了模块间的硬编码依赖。这意味着你可以替换任何一个模块而不影响其他部分。

### 高内聚低耦合

每个模块都像一个独立的"微服务"，只专注于单一职责：

- **IO 层** — LLM 对话、TTS 语音、视觉感知
- **状态管理** — 情感状态、生理状态、关系状态
- **决策引擎** — 基于 PAD 情感模型 + 驱动力系统

## 认知系统

### 生物引擎 (Bio Engine)

模拟生物节律系统，包括：

- 昼夜节律（Circadian Rhythm）— 影响活跃度
- 新陈代谢（Metabolism）— 能量消耗与恢复
- 疲劳系统（Fatigue）— 长时间运行后需要休息

### 心理动力学 (Psychodynamics)

基于 PAD 情感模型（Pleasure-Arousal-Dominance），实现：

- **情感追踪** — 实时监测情感状态变化
- **情感记忆** — 将情感与记忆绑定，影响未来行为
- **心智免疫系统** — 防止极端情感状态，维持心理平衡

### 记忆系统

三级记忆架构：

1. **工作记忆 (Working Memory)** — 当前对话上下文，短期保持
2. **暂存区 (Scratchpad)** — 中期记忆，可能被巩固或遗忘
3. **长期记忆 (Long-term Memory)** — 通过 RAG 检索的持久化记忆

记忆会经历压缩、遗忘、巩固等过程，模拟人类记忆机制。

### 驱动力系统 (Drives)

类似 Maslow 需求层次：

- 生存驱动力（能量、安全）
- 社交驱动力（陪伴、认同）
- 成长驱动力（学习、探索）

驱动力会影响宠物的行为优先级和情感状态。

## 技能插件系统

采用可插拔架构，每个技能都是独立模块：

- **Web 搜索** — 实时信息获取
- **文件管理** — 本地文件操作
- **截图** — 视觉感知能力
- **日程管理** — 时间规划
- **天气查询** — 环境感知
- **日记** — 自主记录

社区开发者可以轻松编写新技能扩展功能。

## 角色创世系统

支持多种角色创建方式：

- **自动创世** — 从角色卡解析自动生成
- **手动创世** — 逐步配置性格、背景、灵魂脚本
- **多智能体创世** — 多个 AI 协作生成复杂角色
- **导入创世** — 从外部格式导入

## 技术栈

- **后端**: Python 3.10+ / FastAPI / SQLAlchemy / Alembic
- **前端**: Vue 3 / TypeScript / TailwindCSS / Vite
- **桌面**: Tauri (Rust)
- **3D 身体**: Godot Engine
- **LLM**: OpenAI API / 本地模型 (ONNX)
- **TTS**: Edge TTS / 自定义语音
- **向量检索**: MemU / 自建 RAG

## 项目意义

ArkHeart 探索了一个问题：**AI 能否拥有持续的情感和记忆？**

这不是关于 AGI 的宏大叙事，而是关于在日常交互中，AI 能否真正"记住"你、"在乎"你。通过模拟生物节律、情感演化和记忆巩固，我们试图让数字伴侣拥有真实的存在感。

> 在代码的方舟中，种下一颗会成长的心。`,
    },
    {
      title: 'FrameForge — AI 动画帧审查与对齐工具',
      slug: 'frameforge-ai-animation-tool',
      excerpt: '专为 AI 生成动画设计的桌面工具，提供帧级审查、基准点对齐和 AI 辅助分析功能。',
      category: '项目',
      tags: ['Tauri', 'React', 'Rust', 'PixiJS', 'AI', '动画'],
      readingTime: '10 min',
      isFeatured: false,
      content: `# FrameForge — AI 动画帧审查与对齐工具

## 为什么需要 FrameForge？

AI 动画工具（Runway、Kling、Midjourney、Stable Diffusion 等）生成的是独立的片段或帧，但缺乏专门的审查和校正工具。

创作者目前只能依赖传统非线性编辑器（After Effects、Premiere Pro、DaVinci Resolve）来拼接和检查帧序列——这些工具并非为 AI 生成的素材而设计。

**FrameForge 填补了这一空白。**

## 核心功能

### 基于时间线的工作流

- 多轨道时间线，支持拖拽排列资产
- 支持图片序列帧（PNG/JPG/WebP）和视频片段（MP4/WebM）
- 可调帧率（12/24/30fps）
- 精确到帧的播放控制

### 基准点对齐

这是 FrameForge 最核心的功能：

1. 在任意帧上设定参考点（角色位置、地平线等）
2. 系统自动追踪这些基准点跨帧序列
3. 一键自动对齐所有帧到基准点
4. 支持手动微调，对齐前后对比

基准点类型包括：点、线、区域，适应不同对齐需求。

### AI 辅助分析

四大分析维度：

- **位移检测** — 基于光流法的帧间位移测量，精确到像素级
- **闪烁检测** — SSIM + 直方图分析检测亮度不一致
- **角色一致性** — AI 驱动的跨帧视觉一致性检查
- **AI 建议** — 针对检测到的问题生成自然语言修复建议

### 帧检查器

- **洋葱皮**（幽灵叠加）对比相邻帧
- 像素级放大镜工具
- AI 问题叠加在画面上（位移箭头、闪烁高亮、不一致标记）

### 展示与导出

- 全屏干净播放预览
- 导出为 GIF、MP4、WebP 或 PNG 序列帧
- 对齐前后分屏对比

## 技术架构

### 桌面框架

选择 **Tauri v2** 而非 Electron：

- 更小的打包体积（~10MB vs ~100MB）
- 更低的内存占用
- Rust 后端提供原生性能

### 渲染引擎

**PixiJS v8** (WebGL) 用于 2D 渲染：

- 海量帧序列的流畅渲染
- GPU 加速的图像变换
- 洋葱皮混合模式

预留 Three.js 接口为未来 3D 功能准备。

### AI 分析引擎

混合架构：

- **本地 AI** — ONNX Runtime，隐私优先的离线分析
- **云端 AI** — OpenAI API / 自部署模型，高级分析

分析算法：

- **光流法** — Farneback 密集光流计算位移
- **结构相似性** — SSIM 检测帧间结构差异
- **KLT 特征追踪** — Kanade-Lucas-Tomasi 追踪基准点

### 状态管理

使用 **Zustand** 而非 Redux：

- 更简洁的 API
- 更好的 TypeScript 支持
- 中间件机制满足持久化需求

## 技术栈一览

- **桌面框架**: Tauri v2
- **前端**: React 18 + TypeScript
- **2D 渲染**: PixiJS v8 (WebGL)
- **状态管理**: Zustand
- **样式**: TailwindCSS
- **后端**: Rust
- **本地 AI**: ONNX Runtime
- **云端 AI**: OpenAI API
- **图像处理**: image crate + opencv-rust
- **视频处理**: ffmpeg-next
- **存储**: SQLite (rusqlite)

## 项目意义

AI 生成内容正在爆发式增长，但工具链远未成熟。FrameForge 是对 AI 动画工作流的一次探索——**让创作者专注于创意，而非技术细节**。

> 每一帧都值得被认真对待。`,
    },
  ];

  for (const post of posts) {
    const existing = await prisma.post.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log('Post already exists, updating:', post.slug);
      await prisma.post.update({ where: { slug: post.slug }, data: post });
    } else {
      console.log('Creating post:', post.slug);
      await prisma.post.create({ data: post });
    }
  }

  // ============================================
  // PROJECTS
  // ============================================

  const projects = [
    {
      name: 'INK.SPIRIT Blog',
      slug: 'ink-spirit-blog',
      description: '赛博朋克风格的全栈博客系统，基于 React 19 + Express + Prisma + PostgreSQL。支持文章管理、项目展示、技能矩阵、时间线、相册、动漫追踪等丰富功能。',
      type: 'Web Application',
      tech: ['React', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'TailwindCSS', 'Vite'],
      status: 'DEPLOYED',
      link: '',
      githubUrl: '',
      featured: true,
      startDate: new Date('2025-01-01'),
      readme: `# INK.SPIRIT Blog

赛博朋克风格的全栈博客系统。

## 核心功能

- 文章管理（Markdown 编辑、分类标签、访问控制）
- 项目展示（状态追踪、技术栈展示）
- 技能矩阵可视化
- 时间线事件
- 相册系统（EXIF 支持）
- 动漫追踪
- 日记系统
- 主题色自定义
- 中英双语
- RSS 订阅
- Konami Code 彩蛋`,
    },
    {
      name: 'ArkHeart 方舟之心',
      slug: 'arkheart-ai-companion',
      description: 'AI 桌面宠物的核心智能中枢。事件驱动的认知架构，包含生物引擎、心理动力学、三级记忆系统、驱动力模型和可插拔技能系统。',
      type: 'AI System',
      tech: ['Python', 'FastAPI', 'Vue', 'TypeScript', 'Tauri', 'Godot', 'LLM', 'RAG'],
      status: 'ACTIVE',
      link: '',
      githubUrl: '',
      featured: true,
      startDate: new Date('2025-06-01'),
      readme: `# ArkHeart 方舟之心

AI 桌面宠物核心智能中枢。

## 核心系统

- **生物引擎** — 昼夜节律、新陈代谢、疲劳系统
- **心理动力学** — PAD 情感模型、心智免疫系统
- **记忆系统** — 工作记忆、暂存区、长期记忆（RAG）
- **驱动力系统** — 生存、社交、成长驱动力
- **技能插件** — Web 搜索、文件管理、截图等
- **角色创世** — 自动/手动/多智能体/导入创世
- **事件总线** — 模块间异步通信`,
    },
    {
      name: 'FrameForge',
      slug: 'frameforge-animation-tool',
      description: 'AI 动画帧审查与对齐工具。基于 Tauri + React + Rust 构建，提供时间线工作流、基准点对齐、AI 辅助分析（位移/闪烁/一致性检测）。',
      type: 'Desktop Application',
      tech: ['Tauri', 'React', 'TypeScript', 'Rust', 'PixiJS', 'ONNX', 'SQLite'],
      status: 'ACTIVE',
      link: '',
      githubUrl: '',
      featured: true,
      startDate: new Date('2025-06-01'),
      readme: `# FrameForge

AI 动画帧审查与对齐工具。

## 核心功能

- **时间线工作流** — 多轨道、拖拽排列、精确帧控制
- **基准点对齐** — 点/线/区域参考点，自动跨帧追踪
- **AI 辅助分析**:
  - 位移检测（光流法）
  - 闪烁检测（SSIM + 直方图）
  - 角色一致性（AI 视觉检查）
  - 自然语言修复建议
- **帧检查器** — 洋葱皮、放大镜、问题叠加
- **导出** — GIF/MP4/WebP/PNG 序列`,
    },
  ];

  for (const project of projects) {
    const existing = await prisma.project.findUnique({ where: { slug: project.slug } });
    if (existing) {
      console.log('Project already exists, updating:', project.slug);
      await prisma.project.update({ where: { slug: project.slug }, data: project });
    } else {
      console.log('Creating project:', project.slug);
      await prisma.project.create({ data: project });
    }
  }

  console.log('Seed completed successfully!');
  console.log('Posts created:', posts.length);
  console.log('Projects created:', projects.length);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
