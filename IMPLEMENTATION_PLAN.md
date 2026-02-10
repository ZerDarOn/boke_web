# INK.SPIRIT 博客功能实现计划

> 创建时间：2025-02-10
> 当前状态：基础功能已完成，进入高优先级功能实现阶段

---

## 📋 目录

- [一、已完成功能回顾](#一已完成功能回顾)
- [二、高优先级功能实现](#二高优先级功能实现)
- [三、中优先级功能规划](#三中优先级功能规划)
- [四、技术债务与优化](#四技术债务与优化)
- [五、项目结构说明](#五项目结构说明)

---

## 一、已完成功能回顾

### ✅ 核心页面
| 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 首页 | `/` | ✅ | Hero + 文章列表 + 其他板块 |
| 文章列表 | `/posts` | ✅ | 支持列表/网格视图切换 |
| 文章详情 | `/posts/:id` | ✅ | Markdown渲染 + 代码高亮 |
| 公告列表 | `/announcement` | ✅ | 公告展示 |
| 公告详情 | `/announcement/:id` | ✅ | 公告详情 |
| 项目展示 | `/projects` | ✅ | 项目卡片 |
| 技能矩阵 | `/skills` | ✅ | 技能展示 |
| 时间线 | `/timeline` | ✅ | 个人时间线 |
| 关于 | `/about` | ✅ | 文件系统风格的关于页 |
| 关系网络 | `/network` | ✅ | 社交关系可视化 |
| 仪表盘 | `/dashboard` | ✅ | 系统状态展示 |
| 动漫 | `/anime` | ✅ | 追番列表 |
| 日记 | `/diary` | ✅ | 个人日记 |
| 相册 | `/gallery` | ✅ | 图片展示 |
| 归档 | `/archives` | ✅ | 文章归档 |

### ✅ 核心功能
- **主题切换**：浅色/深色模式 + 自定义主题色
- **语言切换**：中文/英文
- **搜索功能**：文章/项目搜索（模态框）
- **导航系统**：顶部导航 + 下拉菜单 + 侧边栏
- **文章系统**：列表展示、详情页、Markdown渲染、代码高亮
- **自定义光标**：赛博风格光标效果
- **滚动动画**：页面进入动画、悬停效果

### ✅ 设计风格
- **赛博武侠**：墨色（ink）+ 霓虹绿（neon）
- **动画效果**：扫描线、光晕、悬停动画
- **响应式设计**：移动端适配
- **字体系统**：Orbitron（sans）+ Noto Serif SC（serif）+ JetBrains Mono（mono）

---

## 二、高优先级功能实现

### 🔴 1. 文章阅读进度条

**优先级：** ⭐⭐⭐
**难度：** ⭐
**预估时间：** 10分钟

#### 实现思路
在 `PostDetail.tsx` 页面顶部添加一个固定进度条，显示文章阅读进度。

#### 技术方案
```typescript
// 1. 添加状态
const [scrollProgress, setScrollProgress] = useState(0);

// 2. 监听滚动事件
useEffect(() => {
  const handleScroll = () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    setScrollProgress(scrolled);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// 3. 渲染进度条
<div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
  <div
    className="h-full bg-gradient-to-r from-neon to-neon-dark transition-all duration-150"
    style={{ width: `${scrollProgress}%` }}
  />
</div>
```

#### 涉及文件
- `pages/PostDetail.tsx`

#### 验证要点
- [ ] 进度条在页面顶部固定显示
- [ ] 滚动时进度正确更新
- [ ] 使用 neon 颜色，渐变效果
- [ ] 不影响其他元素布局

---

### 🔴 2. 社交分享

**优先级：** ⭐⭐⭐
**难度：** ⭐⭐
**预估时间：** 20分钟

#### 实现思路
在 PostDetail 页面的元信息区域下方添加分享按钮组，支持多种分享方式。

#### 技术方案
```typescript
// 1. 分享函数
const handleShare = async () => {
  const shareData = {
    title: post.title,
    text: post.excerpt,
    url: window.location.href
  };

  // 移动端优先使用 Web Share API
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      console.log('Share canceled');
    }
  }

  // 降级方案：复制链接
  navigator.clipboard.writeText(window.location.href);
  alert('链接已复制到剪贴板');
};

// 2. 社交平台分享链接
const shareLinks = {
  twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`,
  weibo: `http://service.weibo.com/share/share.php?title=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`
};

// 3. 渲染分享按钮
<div className="flex items-center gap-3 mt-4">
  <button onClick={handleShare} className="...">
    <Share2 size={16} /> 分享
  </button>
  <a href={shareLinks.twitter} target="_blank" className="...">
    Twitter
  </a>
  <a href={shareLinks.weibo} target="_blank" className="...">
    微博
  </a>
</div>
```

#### 涉及文件
- `pages/PostDetail.tsx`

#### 需要的图标
- `Share2`, `Twitter`, `Link2`（复制链接）

#### 验证要点
- [ ] 移动端支持原生分享
- [ ] 桌面端显示社交平台链接
- [ ] 复制链接功能正常
- [ ] 样式符合赛博武侠风格

---

### 🔴 3. 联系方式

**优先级：** ⭐⭐⭐
**难度：** ⭐⭐
**预估时间：** 30分钟

#### 实现思路
在 About 页面底部添加「联系方式」区域，卡片式设计展示个人社交账号。

#### 技术方案
```typescript
// 联系方式数据
const contactInfo = [
  {
    type: 'email',
    label: 'Email',
    value: 'ronin@cyber.ink',
    icon: Mail,
    action: () => navigator.clipboard.writeText('ronin@cyber.ink')
  },
  {
    type: 'github',
    label: 'GitHub',
    value: 'github.com/yourname',
    icon: Github,
    action: () => window.open('https://github.com/yourname', '_blank')
  },
  {
    type: 'bilibili',
    label: 'Bilibili',
    value: 'bilibili.com/yourid',
    icon: Video,
    action: () => window.open('https://bilibili.com/yourid', '_blank')
  },
  {
    type: 'wechat',
    label: 'WeChat',
    value: '点击查看二维码',
    icon: MessageCircle,
    action: () => setQrModalOpen(true) // 打开二维码模态框
  }
];

// 渲染卡片
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
  {contactInfo.map((item, index) => (
    <button
      key={index}
      onClick={item.action}
      className="group relative p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl hover:border-neon hover:shadow-lg transition-all"
    >
      <item.icon size={24} className="text-neon mb-3" />
      <p className="text-xs text-gray-500 font-mono mb-1">{item.label}</p>
      <p className="text-sm text-ink dark:text-white">{item.value}</p>
    </button>
  ))}
</div>
```

#### 涉及文件
- `pages/About.tsx` 或 `components/AboutFileExplorer.tsx`
- 可能需要创建 `components/ContactCards.tsx`

#### 验证要点
- [ ] 卡片样式统一，符合赛博风格
- [ ] 点击邮箱自动复制
- [ ] 社交平台链接正确
- [ ] 微信二维码显示正常
- [ ] 悬停效果流畅

---

### 🔴 4. RSS 订阅

**优先级：** ⭐⭐
**难度：** ⭐⭐
**预估时间：** 30分钟

#### 实现思路
创建 `/rss.xml` 路由，动态生成 RSS 2.0 格式的 XML 文件。

#### 技术方案

**方案一：静态文件（简单）**
创建 `public/rss.xml`，手动维护（不推荐，需要手动更新）

**方案二：Vite 插件动态生成（推荐）**
创建 Vite 插件在构建时生成 RSS 文件

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { BLOG_POSTS } from './src/constants';

const generateRSS = () => {
  return {
    name: 'generate-rss',
    generateBundle() {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>INK.SPIRIT</title>
    <link>https://yourdomain.com</link>
    <description>Cyber-Wuxia Personal Blog</description>
    ${BLOG_POSTS.map(post => `
    <item>
      <title>${post.title}</title>
      <link>https://yourdomain.com/posts/${post.id}</link>
      <description>${post.excerpt}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
    </item>`).join('')}
  </channel>
</rss>`;

      this.emitFile({
        type: 'asset',
        fileName: 'rss.xml',
        source: rssXml
      });
    }
  };
};

export default defineConfig({
  plugins: [generateRSS()]
});
```

#### 涉及文件
- `vite.config.ts`（新建或修改）
- `index.html`（添加 RSS 链接 head）

#### 验证要点
- [ ] RSS 文件正确生成
- [ ] XML 格式验证通过
- [ ] 包含所有文章
- [ ] 可以被 RSS 阅读器订阅
- [ ] 更新文章后重新构建能生成最新 RSS

---

### 🔴 5. 评论系统（Giscus）

**优先级：** ⭐⭐
**难度：** ⭐⭐⭐
**预估时间：** 40分钟

#### 实现思路
使用 Giscus 组件（基于 GitHub Discussions）为文章添加评论功能。

#### 前置条件
1. GitHub 公开仓库
2. 仓库启用 Discussions
3. 安装 Giscus App: https://github.com/apps/giscus
4. 获取配置参数：
   - `data-repo`: 仓库路径（`owner/repo`）
   - `data-repo-id`: 仓库 ID
   - `data-category`: Discussions 分类
   - `data-category-id`: 分类 ID
   - `data-mapping`: 映射方式（`pathname` 使用 URL 路径）
   - `data-strict`: 严格模式（`1`）
   - `data-reactions-enabled`: 启用反应（`1`）
   - `data-emit-metadata`: 发送元数据（`1`）
   - `data-input-position`: 输入框位置（`top` 或 `bottom`）
   - `data-theme`: 主题（`dark` 或 `light` 或根据系统自动）
   - `data-lang`: 语言（`zh-CN`）

#### 技术方案

**步骤一：创建 Giscus 组件**
```typescript
// components/GiscusComments.tsx
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface GiscusCommentsProps {
  theme?: 'light' | 'dark' | 'preferred_color_scheme';
}

const GiscusComments: React.FC<GiscusCommentsProps> = ({ theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // 加载 Giscus 脚本
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    // 配置参数
    const attributes = {
      'data-repo': 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME',
      'data-repo-id': 'YOUR_REPO_ID',
      'data-category': 'Announcements',
      'data-category-id': 'YOUR_CATEGORY_ID',
      'data-mapping': 'pathname',
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '1',
      'data-input-position': 'bottom',
      'data-theme': theme,
      'data-lang': 'zh-CN',
    };

    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = ''; // 清空容器
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [location.pathname, theme]);

  return <div ref={containerRef} className="w-full mt-12" />;
};

export default GiscusComments;
```

**步骤二：集成到 PostDetail**
```typescript
// pages/PostDetail.tsx
import GiscusComments from '../components/GiscusComments';

// 在页面底部添加
<div className="mt-12">
  <h3 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-white/10">
    评论
  </h3>
  <GiscusComments theme={theme === 'dark' ? 'dark' : 'light'} />
</div>
```

#### 涉及文件
- 新建：`components/GiscusComments.tsx`
- 修改：`pages/PostDetail.tsx`

#### 验证要点
- [ ] Giscus 加载正常
- [ ] 评论能正确显示
- [ ] 发布评论功能正常
- [ ] 不同文章评论隔离正确
- [ ] 主题切换同步 Giscus 主题
- [ ] 深色/浅色模式适配

#### 配置说明
访问 https://giscus.app 获取完整配置，替换代码中的 `YOUR_` 占位符。

---

## 三、中优先级功能规划

### 🟡 文章目录生成
**描述：** Markdown 文章自动生成目录（TOC），点击滚动到对应位置

**技术方案：**
- 使用 `react-markdown` 的 `rehype-slug` 插件生成 heading id
- 使用 `rehype-toc` 插件或自定义解析生成目录
- 侧边栏或顶部悬浮显示

**优先级：** 🟡
**难度：** ⭐⭐⭐
**预估时间：** 1小时

---

### 🟡 相关文章推荐
**描述：** 基于标签推荐其他文章，在文章详情页底部显示

**技术方案：**
```typescript
// 根据当前文章标签找相关文章
const getRelatedPosts = (currentPost: BlogPost, allPosts: BlogPost[]) => {
  return allPosts
    .filter(post => post.id !== currentPost.id)
    .map(post => ({
      ...post,
      relevanceScore: post.tags.filter(tag => currentPost.tags.includes(tag)).length
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3); // 取前3篇
};
```

**优先级：** 🟡
**难度：** ⭐
**预估时间：** 30分钟

---

### 🟡 搜索功能优化
**描述：** 搜索功能支持更多内容类型（日记、相册、公告等）

**技术方案：**
- 统一数据结构
- 扩展搜索范围
- 添加搜索结果分类展示

**优先级：** 🟡
**难度：** ⭐⭐
**预估时间：** 1小时

---

### 🟡 文章分类/标签筛选
**描述：** Posts.tsx 页面添加按分类和标签筛选功能

**技术方案：**
- 添加分类/标签筛选器 UI
- 筛选逻辑复用
- URL 参数同步（`?category=TECH&tag=React`）

**优先级：** 🟡
**难度：** ⭐
**预估时间：** 40分钟

---

### 🟡 打印样式优化
**描述：** 优化文章打印输出样式

**技术方案：**
```css
@media print {
  /* 隐藏导航、侧边栏等 */
  nav, .sidebar, .right-sidebar, footer { display: none; }
  /* 优化文章排版 */
  .article-content { width: 100%; }
  /* 移除背景色 */
  body { background: white; color: black; }
}
```

**优先级：** 🟡
**难度：** ⭐
**预估时间：** 20分钟

---

## 四、技术债务与优化

### ⚠️ SEO 优化
**当前状态：** 只有基础 title
**改进方向：**
- 添加 meta description
- 添加 keywords
- 添加 Open Graph（社交媒体分享预览）
- 添加 Twitter Card

**涉及文件：**
- `index.html`（head 部分）
- 可能需要使用 `react-helmet-async` 动态设置

---

### ⚠️ 性能优化
**当前状态：** 单包 1.38MB
**改进方向：**
- 代码分割（Code Splitting）
- 懒加载路由组件（`React.lazy`）
- 懒加载图片（`loading="lazy"`）
- 减小第三方库体积

**涉及文件：**
- `App.tsx`（路由懒加载）
- `vite.config.ts`（打包配置）

---

### ⚠️ 404 页面
**当前状态：** 简单文本
**改进方向：**
- 添加 404 动画
- 添加返回首页按钮
- 添加有趣的设计元素

**涉及文件：**
- `App.tsx`（NotFound 组件）

---

### ⚠️ 可访问性
**当前状态：** 基本支持
**改进方向：**
- 检查颜色对比度
- 添加 ARIA 标签
- 优化键盘导航
- 添加跳转到主内容链接

---

### ⚠️ 国际化补充
**当前状态：** 部分页面有英文翻译
**改进方向：**
- 补全所有页面的英文翻译
- 使用 i18n 库统一管理（如 `i18next`）

---

## 五、项目结构说明

```
ink-spirit-blog/
├── index.html                 # HTML 入口（包含 Tailwind CDN、字体、光标样式）
├── index.css                  # 自定义 CSS 动画
├── index.tsx                  # React 入口
├── vite.config.ts             # Vite 配置（待添加 RSS 插件）
├── package.json               # 依赖管理
├── types.ts                   # TypeScript 类型定义
├── constants.ts               # 静态数据（文章、项目、技能等）
├── App.tsx                    # 路由配置
├── pages/                     # 页面组件
│   ├── Home.tsx               # 首页
│   ├── Posts.tsx              # 文章列表
│   ├── PostDetail.tsx         # 文章详情 ⭐ 需要修改
│   ├── About.tsx              # 关于页 ⭐ 需要修改
│   ├── Projects.tsx           # 项目展示
│   ├── Skills.tsx             # 技能矩阵
│   ├── Timeline.tsx           # 时间线
│   ├── Dashboard.tsx          # 仪表盘
│   ├── Network.tsx            # 关系网络
│   ├── Anime.tsx              # 追番
│   ├── Diary.tsx              # 日记
│   ├── Gallery.tsx            # 相册
│   ├── Archives.tsx           # 归档
│   ├── Announcement.tsx       # 公告列表
│   └── AnnouncementDetail.tsx # 公告详情
├── components/                # 组件
│   ├── Layout.tsx             # 布局组件（包含搜索、主题切换等）
│   ├── Navigation.tsx         # 顶部导航
│   ├── Sidebar.tsx            # 左侧边栏
│   ├── RightSidebar.tsx       # 右侧边栏
│   ├── Hero.tsx               # Hero 区域
│   ├── Archives.tsx           # 主页文章列表
│   ├── Arsenal.tsx            # 项目展示
│   ├── Profile.tsx            # 个人资料
│   ├── ShadowFragments.tsx    # 日记板块
│   ├── AboutFileExplorer.tsx  # 文件系统风格关于页
│   ├── SystemDashboard.tsx    # 系统仪表盘
│   ├── RelationshipNetwork.tsx # 关系网络可视化
│   ├── TimelineArchives.tsx   # 时间线归档
│   ├── PageTimeline.tsx       # 时间线页面
│   ├── PageSkills.tsx         # 技能页面
│   ├── PageProjects.tsx       # 项目页面
│   ├── MineGallery.tsx        # 相册页面
│   ├── MineDiary.tsx          # 日记页面
│   └── MineAnime.tsx          # 迨番页面
└── public/                    # 静态资源
    ├── favicon.ico            # 网站图标
    └── rss.xml               # RSS 文件（待生成）
```

---

## 六、实现时间线

| 阶段 | 功能 | 状态 | 预估时间 |
|------|------|------|---------|
| 阶段1 | 阅读进度条 | ⏳ 待开始 | 10分钟 |
| 阶段1 | 社交分享 | ⏳ 待开始 | 20分钟 |
| 阶段1 | 联系方式 | ⏳ 待开始 | 30分钟 |
| 阶段1 | RSS 订阅 | ⏳ 待开始 | 30分钟 |
| 阶段1 | 评论系统 | ⏳ 待开始 | 40分钟 |
| 阶段2 | 文章目录 | ⏳ 待规划 | 1小时 |
| 阶段2 | 相关文章推荐 | ⏳ 待规划 | 30分钟 |
| 阶段2 | 搜索优化 | ⏳ 待规划 | 1小时 |
| 阶段2 | 分类/标签筛选 | ⏳ 待规划 | 40分钟 |
| 阶段2 | 打印样式 | ⏳ 待规划 | 20分钟 |

**总计预估：** 4.5小时（高优先级） + 3.5小时（中优先级） = 8小时

---

## 七、注意事项

### 设计原则
1. **赛博武侠风格**：所有新功能保持一致的设计语言
2. **响应式设计**：确保移动端体验良好
3. **性能优先**：避免过大的包体积
4. **可访问性**：保证基本的无障碍访问

### 开发规范
1. **组件化**：可复用的功能提取为组件
2. **类型安全**：使用 TypeScript
3. **代码风格**：保持一致的代码格式
4. **注释清晰**：复杂逻辑添加注释

### 测试检查清单
- [ ] 构建成功（`npm run build`）
- [ ] 深色/浅色模式都正常
- [ ] 移动端适配正常
- [ ] 无 TypeScript 错误
- [ ] 控制台无错误

---

## 八、联系方式

如有问题，请参考：
- 项目路径：`D:/Code/ink-spirit-blog/ink-spirit-blog`
- 文档：本文档

---

**最后更新：** 2025-02-10
**维护者：** AI Assistant
