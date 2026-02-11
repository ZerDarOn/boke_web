# INK.SPIRIT 博客后端 API 规范

> 由前端代码整理，供后端开发参考
> 生成日期: 2026-02-11

---

## 1. 数据模型定义

### 1.1 文章 (BlogPost)
```typescript
interface BlogPost {
  id: string;              // 唯一标识，如 "01", "02"
  title: string;           // 文章标题
  date: string;            // 发布日期，格式 "YYYY.MM.DD"
  category: string;        // 分类，如 "PHILOSOPHY", "TECH"
  excerpt: string;         // 文章摘要/简介
  content: string;         // Markdown 格式的完整内容
  tags: string[];          // 标签数组
  readingTime: string;     // 阅读时长，如 "8 min"
  // 建议后端扩展字段:
  // - viewCount: number       // 阅读次数
  // - likeCount: number       // 点赞数
  // - isPublished: boolean    // 发布状态
  // - createdAt: DateTime     // 创建时间
  // - updatedAt: DateTime     // 更新时间
}
```

### 1.2 公告 (Announcement)
```typescript
interface Announcement {
  id: string;              // 唯一标识
  title: string;           // 公告标题
  content: string;         // 公告内容
  date: string;            // 发布日期
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'IMPORTANT';  // 公告类型
  attachments?: {          // 附件（可选）
    name: string;
    size: string;
    url: string;
  }[];
}
```

### 1.3 项目 (Project)
```typescript
interface Project {
  id: string;              // 唯一标识
  name: string;            // 项目名称
  type: string;            // 项目类型
  tech: string[];          // 技术栈数组
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';  // 项目状态
  description: string;     // 项目描述
  featured?: boolean;      // 是否为主要展示项目
  link?: string;           // 项目链接
  imageUrl?: string;       // 项目图片URL
  githubUrl?: string;      // GitHub 链接
  demoUrl?: string;        // 演示链接
  startDate?: string;      // 开始日期
  endDate?: string;        // 结束日期
  readme?: string;         // 详细说明（Markdown）
}
```

### 1.4 技能 (Skill)
```typescript
interface SkillGroup {
  category: string;        // 技能分类，如 "FRONTEND.CORE"
  items: {
    name: string;          // 技能名称
    level: number;         // 熟练度 0-100
    projectCount: number;  // 相关项目数
    rank: string;          // 等级，如 "Master", "Expert"
  }[];
}

interface SkillNode {
  id: string;              // 节点ID
  label: string;           // 显示名称
  x: number;               // 图谱X坐标（前端计算）
  y: number;               // 图谱Y坐标（前端计算）
  connections: string[];   // 关联节点ID数组
  type: 'core' | 'major' | 'minor';  // 节点类型
}
```

### 1.5 时间线事件 (TimelineEvent)
```typescript
interface TimelineEvent {
  id: string;              // 唯一标识
  year: string;            // 年份
  date: string;            // 具体日期
  title: string;           // 事件标题
  description: string;     // 事件描述
  type: 'MILESTONE' | 'JOB' | 'LIFE';  // 事件类型
}
```

### 1.6 动漫 (Anime)
```typescript
// 列表展示用
interface AnimeItem {
  id: string;              // 唯一标识
  title: string;           // 动漫标题
  cover: string;           // 封面图片/颜色
  totalEps: number;        // 总集数
  currentEp: number;       // 当前看到集数
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;          // 评分 0-10
  favorite?: boolean;      // 是否收藏
  studio?: string;         // 制作公司
}

// 详情页用
interface AnimeDetail {
  id: string;
  title: string;
  coverImage: string;      // 封面图
  bannerImage: string;     // 横幅图
  type: 'TV' | 'OVA' | 'Movie' | 'Special' | 'ONA';
  episodes: number;        // 总集数
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;          // 平均评分
  aired: string;           // 播出时间
  studios: string[];       // 制作公司列表
  genres: string[];        // 类型标签
  synopsis: string;        // 剧情简介
  myEpisodes: number;      // 我的观看进度
  myScore?: number;        // 我的评分
  myStatus: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  startDate?: string;      // 我开始观看日期
  finishDate?: string;     // 我完成观看日期
  favorite: boolean;       // 是否收藏
  notes?: string;          // 个人笔记
  tags?: string[];         // 个人标签
  bilibiliUrl?: string;    // B站链接
}
```

### 1.7 日记 (Diary)
```typescript
// 短日记/便签
interface DiaryEntry {
  id: string;              // 唯一标识
  date: string;            // 日期
  content: string;         // 内容
  stamp: string;           // 赛博印章文字
}

// 长文日记
interface LongFormDiary {
  id: string;
  title: string;           // 标题
  subtitle: string;        // 副标题
  content: string;         // Markdown 内容
  date: string;            // 日期
  location: string;        // 地点
  mood: '😊' | '🌙' | '☔' | '🌸' | '⚡';  // 心情
  weather: '☀️' | '☁️' | '🌧️' | '⛈️' | '❄️';  // 天气
  coverImage: string;      // 封面图
  tags: string[];          // 标签
  readingTime: string;     // 阅读时长
}
```

### 1.8 相册 (Gallery)
```typescript
interface GalleryItem {
  id: string;              // 唯一标识
  src: string;             // 图片URL/颜色
  title: string;           // 图片标题
  date: string;            // 拍摄日期
  location: string;        // 拍摄地点
  aspect: 'portrait' | 'landscape' | 'square';  // 宽高比
  camera?: string;         // 相机型号
  settings?: string;       // 拍摄参数
  tags?: string[];         // 标签
  comments?: PhotoComment[];  // 评论
}

interface PhotoComment {
  id: string;
  author: string;          // 评论者
  content: string;         // 评论内容
  date: string;            // 评论日期
}

interface GalleryAlbum {
  id: string;              // 相册ID
  title: string;           // 相册标题
  cover: string;           // 封面图
  createdAt: string;       // 创建日期
  lastUpdated: string;     // 最后更新
  location: string;        // 地点
  thoughts: string;        // 感想
  photoCount: number;      // 照片数量
  photos: GalleryItem[];   // 照片列表
}
```

### 1.9 社交网络 (Relationship)
```typescript
interface RelationNode {
  id: string;              // 节点ID
  name: string;            // 姓名
  role: string;            // 角色/关系
  x: number;               // 图谱坐标X
  y: number;               // 图谱坐标Y
  avatar?: string;         // 头像URL
  description: string;     // 描述
  connections: string[];   // 关联节点ID
  type: 'core' | 'major' | 'minor';  // 关系类型
}
```

### 1.10 文件系统 (About 页面)
```typescript
interface FileNode {
  id: string;              // 文件ID
  name: string;            // 文件名
  type: 'folder' | 'markdown' | 'binary';  // 文件类型
  size?: string;           // 文件大小
  date: string;            // 修改日期
  content?: string;        // 文件内容（markdown类型）
}
```

### 1.11 动态活动 (Activity)
```typescript
interface Activity {
  id: string;              // 活动ID
  project: string;         // 关联项目
  title: string;           // 活动标题
  tags: string[];          // 标签
  status: string;          // 状态
  date: string;            // 日期
}
```

---

## 2. API 接口列表

### 2.1 文章相关

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/posts` | 获取文章列表 | `category`, `tag`, `page`, `limit` |
| GET | `/api/posts/:id` | 获取单篇文章详情 | - |
| GET | `/api/posts/:id/related` | 获取相关文章 | - |
| POST | `/api/posts` | 创建文章 | - |
| PUT | `/api/posts/:id` | 更新文章 | - |
| DELETE | `/api/posts/:id` | 删除文章 | - |
| POST | `/api/posts/:id/view` | 增加阅读量 | - |
| POST | `/api/posts/:id/like` | 点赞文章 | - |

**响应示例 - 文章列表:**
```json
{
  "data": [
    {
      "id": "01",
      "title": "重构现实：赛博空间的虚无与存在",
      "date": "2024.05.21",
      "category": "PHILOSOPHY",
      "excerpt": "当我们在编写代码时...",
      "tags": ["哲学", "虚拟现实", "React"],
      "readingTime": "8 min",
      "viewCount": 1250,
      "likeCount": 89
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 10
}
```

### 2.2 公告相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/announcements` | 获取公告列表 |
| GET | `/api/announcements/:id` | 获取单条公告 |
| POST | `/api/announcements` | 创建公告 |
| PUT | `/api/announcements/:id` | 更新公告 |
| DELETE | `/api/announcements/:id` | 删除公告 |

### 2.3 项目相关

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/projects` | 获取项目列表 | `featured`, `status` |
| GET | `/api/projects/:id` | 获取项目详情 | - |
| GET | `/api/projects/stats` | 获取项目统计 | - |
| POST | `/api/projects` | 创建项目 | - |
| PUT | `/api/projects/:id` | 更新项目 | - |
| DELETE | `/api/projects/:id` | 删除项目 | - |

**响应示例 - 项目统计:**
```json
{
  "total": 12,
  "completed": 8,
  "active": 4,
  "techDistribution": [
    { "name": "TS/JS", "percentage": 45 },
    { "name": "Rust", "percentage": 25 },
    { "name": "CSS", "percentage": 20 },
    { "name": "Other", "percentage": 10 }
  ]
}
```

### 2.4 技能相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | 获取技能分组列表 |
| GET | `/api/skills/nodes` | 获取技能节点（用于关系图）|
| POST | `/api/skills` | 创建技能 |
| PUT | `/api/skills/:id` | 更新技能 |

### 2.5 时间线相关

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/timeline` | 获取时间线事件 | `type`, `year` |
| GET | `/api/timeline/current` | 获取当前状态 | - |
| POST | `/api/timeline` | 创建事件 | - |
| PUT | `/api/timeline/:id` | 更新事件 | - |
| DELETE | `/api/timeline/:id` | 删除事件 | - |

### 2.6 动漫相关

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/anime` | 获取动漫列表 | `status` |
| GET | `/api/anime/:id` | 获取动漫详情 | - |
| POST | `/api/anime` | 添加动漫 | - |
| PUT | `/api/anime/:id` | 更新动漫 | - |
| PUT | `/api/anime/:id/progress` | 更新观看进度 | `episodes` |
| POST | `/api/anime/:id/score` | 评分 | `score` |

### 2.7 日记相关

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/diary` | 获取日记列表 | `type: 'short' \| 'long'` |
| GET | `/api/diary/:id` | 获取日记详情 | - |
| POST | `/api/diary` | 创建日记 | - |
| PUT | `/api/diary/:id` | 更新日记 | - |
| DELETE | `/api/diary/:id` | 删除日记 | - |

### 2.8 相册相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/gallery` | 获取照片列表 |
| GET | `/api/gallery/albums` | 获取相册列表 |
| GET | `/api/gallery/albums/:id` | 获取相册详情 |
| GET | `/api/gallery/:id` | 获取单张照片 |
| POST | `/api/gallery` | 上传照片 |
| POST | `/api/gallery/albums` | 创建相册 |
| POST | `/api/gallery/:id/comments` | 添加评论 |
| DELETE | `/api/gallery/:id` | 删除照片 |

### 2.9 社交关系相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/network/nodes` | 获取关系节点 |
| GET | `/api/network/connections` | 获取节点连接关系 |
| POST | `/api/network/nodes` | 创建节点 |
| PUT | `/api/network/nodes/:id` | 更新节点 |

### 2.10 文件系统相关 (About 页面)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 获取文件列表 |
| GET | `/api/files/:id` | 获取文件内容 |
| GET | `/api/files/:id/download` | 下载文件 |

### 2.11 仪表盘统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 获取仪表盘统计数据 |
| GET | `/api/dashboard/popular` | 获取热门内容 |
| GET | `/api/dashboard/traffic` | 获取流量数据 |

**响应示例 - 仪表盘统计:**
```json
{
  "uptime": "124d 08h 32m",
  "totalRequests": 842100,
  "uniqueVisitors": 24500,
  "contentStats": {
    "articles": 7,
    "diaries": 12,
    "photos": 1024,
    "anime": 7
  },
  "interactions": {
    "likes": 12800,
    "favorites": 3200,
    "comments": 1247
  },
  "commentDistribution": {
    "posts": 856,
    "anime": 234,
    "gallery": 157
  }
}
```

### 2.12 搜索

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/search` | 全局搜索 | `q` (关键词) |

**响应示例:**
```json
{
  "posts": [...],
  "projects": [...],
  "announcements": [...],
  "diaries": [...],
  "anime": [...],
  "gallery": [...]
}
```

### 2.13 分类与标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 获取分类列表（带文章数）|
| GET | `/api/tags` | 获取标签列表 |
| GET | `/api/tags/popular` | 获取热门标签 |

---

## 3. 页面与数据对应关系

| 页面路由 | 组件 | 需要的数据 | API 端点 |
|----------|------|-----------|----------|
| `/` | Home | 最新文章、日记便签、精选项目、技能图 | `/api/posts?limit=5`, `/api/diary?type=short`, `/api/projects?featured=true`, `/api/skills/nodes` |
| `/posts` | Posts | 文章列表、分类、标签 | `/api/posts`, `/api/categories`, `/api/tags` |
| `/posts/:id` | PostDetail | 文章详情、相关文章 | `/api/posts/:id`, `/api/posts/:id/related` |
| `/archives` | Archives | 按时间归档的文章 | `/api/posts` |
| `/announcement` | Announcement | 公告列表 | `/api/announcements` |
| `/announcement/:id` | AnnouncementDetail | 公告详情 | `/api/announcements/:id` |
| `/projects` | Projects | 项目列表、统计、技术栈分布 | `/api/projects`, `/api/projects/stats` |
| `/projects/:id` | ProjectDetail | 项目详情 | `/api/projects/:id` |
| `/skills` | Skills | 技能分组、等级分布 | `/api/skills` |
| `/timeline` | Timeline | 时间线事件 | `/api/timeline` |
| `/about` | About | 文件列表 | `/api/files` |
| `/network` | Network | 关系节点 | `/api/network/nodes` |
| `/dashboard` | Dashboard | 统计数据 | `/api/dashboard/stats` |
| `/anime` | Anime | 动漫列表 | `/api/anime` |
| `/anime/:id` | AnimeDetail | 动漫详情 | `/api/anime/:id` |
| `/diary` | Diary | 日记列表 | `/api/diary` |
| `/diary/:id` | DiaryDetail | 日记详情 | `/api/diary/:id` |
| `/gallery` | Gallery | 照片/相册列表 | `/api/gallery`, `/api/gallery/albums` |
| `/gallery/:id` | GalleryDetail | 照片/相册详情 | `/api/gallery/:id` |

---

## 4. 特殊功能需求

### 4.1 搜索功能
- 支持多类型搜索：文章、项目、公告、日记、动漫、相册
- 支持按标题、内容、标签、分类搜索
- 前端搜索框使用 ESC 键关闭

### 4.2 统计功能
- 文章阅读量统计
- 点赞数统计
- 访客统计（UV/PV）
- 内容分布统计（文章/日记/相册/动漫数量）
- 评论分布统计

### 4.3 RSS 生成
- 自动生成 RSS feed
- 包含最新文章
- 格式：RSS 2.0

### 4.4 评论系统
- 本地存储实现（当前前端版本）
- 按页面路径存储评论
- 支持用户名、内容、时间

### 4.5 主题切换
- Light/Dark 模式
- 动态主题色（色相调节）

### 4.6 语言切换
- 中英文切换
- 翻译 key 值参考前端 `TRANSLATIONS`

---

## 5. 数据库设计建议

### 5.1 表结构

```sql
-- 文章表
CREATE TABLE posts (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  tags JSON,  -- ["tag1", "tag2"]
  reading_time VARCHAR(20),
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10),
  count INT DEFAULT 0
);

-- 项目表
CREATE TABLE projects (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  tech JSON,  -- ["React", "TypeScript"]
  status ENUM('ACTIVE', 'ARCHIVED', 'DEPLOYED') DEFAULT 'ACTIVE',
  description TEXT,
  featured BOOLEAN DEFAULT false,
  link VARCHAR(255),
  image_url VARCHAR(255),
  github_url VARCHAR(255),
  demo_url VARCHAR(255),
  start_date DATE,
  end_date DATE,
  readme TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 动漫表
CREATE TABLE anime (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  cover_image VARCHAR(255),
  banner_image VARCHAR(255),
  type ENUM('TV', 'OVA', 'Movie', 'Special', 'ONA'),
  episodes INT,
  status ENUM('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED'),
  score DECIMAL(3,1),
  aired VARCHAR(50),
  studios JSON,
  genres JSON,
  synopsis TEXT,
  my_episodes INT DEFAULT 0,
  my_score DECIMAL(3,1),
  my_status ENUM('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED'),
  start_date DATE,
  finish_date DATE,
  favorite BOOLEAN DEFAULT false,
  notes TEXT,
  tags JSON,
  bilibili_url VARCHAR(255)
);

-- 其他表...（按类型定义扩展）
```

### 5.2 索引建议
- `posts`: index on `category`, `date`
- `posts`: fulltext index on `title`, `content`
- `projects`: index on `status`, `featured`
- `anime`: index on `status`, `favorite`

---

## 6. 技术栈建议

| 组件 | 推荐方案 |
|------|----------|
| 语言 | Node.js / Python / Go / Rust |
| 框架 | Express / NestJS / FastAPI / Gin |
| 数据库 | PostgreSQL / MySQL |
| 缓存 | Redis (可选，用于热点数据) |
| 文件存储 | 本地 / OSS / S3 |
| 认证 | JWT (如需后台管理) |

---

## 7. 前端对接说明

### 7.1 当前前端数据获取方式
目前前端使用静态数据 `constants.ts`，需要改为 API 调用：

```typescript
// 当前方式
import { BLOG_POSTS } from '../constants';
const post = BLOG_POSTS.find(p => p.id === id);

// 期望方式
const [post, setPost] = useState(null);
useEffect(() => {
  fetch(`/api/posts/${id}`)
    .then(res => res.json())
    .then(data => setPost(data));
}, [id]);
```

### 7.2 环境变量
前端需要配置 API 基础地址：
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 7.3 CORS 配置
后端需要允许前端域名跨域访问。

---

## 8. 注意事项

1. **图片存储**：相册和文章中的图片建议使用对象存储（OSS/S3），数据库存储 URL
2. **Markdown 渲染**：文章内容使用 Markdown 格式，前端使用 `react-markdown` 渲染
3. **分页**：列表接口建议实现分页（page/limit 或 cursor）
4. **缓存**：热门数据可考虑缓存，如仪表盘统计
5. **备份**：定期备份数据库，特别是文章内容

---

*文档生成完毕，如有疑问请与前端开发者确认。*
