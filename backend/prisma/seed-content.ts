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
      title: 'INK.SPIRIT — 一个赛博朋克风的个人博客系统',
      slug: 'ink-spirit-blog-intro',
      excerpt: '基于 React 19 + Express + Prisma + PostgreSQL 构建的全栈博客系统，融合赛博朋克美学与现代化工程实践。',
      category: '项目',
      tags: ['React', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'TailwindCSS'],
      readingTime: '8 min',
      isFeatured: true,
      content: `# INK.SPIRIT — 赛博朋克个人博客系统

## 项目背景

作为一名开发者，我一直在寻找一个既能展示技术作品、又能表达个人风格的博客平台。市面上的方案要么太臃肿（WordPress），要么太简单（Hexo），要么缺乏定制性（Medium）。

于是 **INK.SPIRIT** 诞生了——一个融合赛博朋克美学与现代化工程实践的全栈博客系统。

## 技术架构

### 前端

- **React 19** — UI 框架
- **TypeScript** — 类型安全
- **Vite 6** — 构建工具
- **TailwindCSS** — 原子化样式
- **React Router 7** — 路由管理
- **TanStack Query** — 数据请求与缓存

### 后端

- **Node.js + Express** — API 服务
- **Prisma ORM** — 数据库操作
- **PostgreSQL** — 主数据库
- **JWT** — 身份认证
- **Multer + MinIO** — 文件存储

### 安全措施

- **Helmet CSP** — 完整的内容安全策略
- **Rate Limiting** — 多层级请求限流
- **bcryptjs** — 密码哈希
- **CSRF 保护** — 跨站请求伪造防护
- **HSTS** — 严格传输安全

## 核心功能

### 内容管理

- Markdown 富文本编辑
- 文章分类与标签系统
- 草稿/发布状态管理
- 访问控制（公开/密码保护/私密）

### 多媒体展示

- 项目展示页（活跃/已部署/已归档状态）
- 技能矩阵可视化
- 时间线事件追踪
- 相册系统（EXIF 元数据支持）
- 动漫追踪系统
- 日记系统

### 交互体验

- 主题色自定义（HSL 色相滑块）
- 暗色/亮色模式切换
- 中英文双语支持
- 搜索功能
- RSS 订阅

### 隐藏彩蛋

输入经典的 Konami Code（上上下下左右左右 BABA），会解锁隐藏的 Settings 按钮。这是对经典游戏文化的致敬，也为博客增添了一份趣味。

## 工程亮点

### 统一数据源

通过自定义 useActivities Hook 实现三级 fallback 机制，确保"最新动态"在前台侧边栏、后台仪表盘、移动端导航栏三处显示一致。

### 性能优化

- React.lazy 懒加载
- 图片懒加载与缓存
- API 响应缓存
- 代码分割

### 可观测性

- 结构化日志
- 健康检查端点
- 数据库状态监控

## 未来规划

- SSR/SSG 支持（SEO 优化）
- AI 辅助写作
- 评论系统增强
- PWA 离线支持

## 结语

INK.SPIRIT 不仅仅是一个博客，它是我的数字身份载体，是我对技术与美学结合的一次探索。

> 在霓虹与代码之间，找到属于自己的声音。`,
    },
    {
      title: 'ArkHeart 方舟之心 — AI 桌面宠物的认知架构设计',
      slug: 'arkheart-ai-companion-design',
      excerpt: '一个事件驱动的、高度模块化的 AI 桌面宠物核心系统，探索可持续进化的认知架构。',
      category: '项目',
      tags: ['AI', 'FastAPI', 'Python', 'WebSocket', 'LLM', '情感计算'],
      readingTime: '12 min',
      isFeatured: true,
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
      isFeatured: true,
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
