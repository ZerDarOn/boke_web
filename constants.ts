import { BlogPost, DiaryEntry, Project, SkillNode, Activity, FileNode, RelationNode, AnimeItem, GalleryItem, TimelineEvent, SkillGroup } from './types';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '01',
    title: '重构现实：赛博空间的虚无与存在',
    date: '2024.05.21',
    category: 'PHILOSOPHY',
    excerpt: '当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？探讨虚拟DOM与柏拉图洞穴寓言的奇妙联系。',
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

当我们在这篇文章的每一行字中，都是在参与一场关于现实的重构。代码不仅仅是工具，更是一种思考世界的哲学。

正如庄子所言："天地与我并生，而万物与我为一。"在赛博空间中，这种"并生"与"为一"获得了新的诠释。`,
    tags: ['哲学', '虚拟现实', 'React', '柏拉图'],
    readingTime: '8 min'
  },
  {
    id: '02',
    title: '水墨组件库开发实录',
    date: '2024.04.10',
    category: 'ENGINEERING',
    excerpt: '如何在 CSS 中复刻宣纸的渗透感？记一次从 WebGL 到 SVG 滤镜的技术迁移过程，寻找性能与美学的平衡点。',
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
    tags: ['前端开发', 'WebGL', 'SVG', '性能优化'],
    readingTime: '12 min'
  },
  {
    id: '03',
    title: '数字游民的修仙指南',
    date: '2024.03.15',
    category: 'LIFESTYLE',
    excerpt: '在这个永远在线的时代，如何像古代隐士一样保持内心的宁静？我的断网实验与精力管理心得。',
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
    tags: ['生活方式', '精力管理', '冥想', '数字游民'],
    readingTime: '10 min'
  },
  {
    id: '04',
    title: 'React Server Components 深度解析',
    date: '2024.02.28',
    category: 'TECH',
    excerpt: '服务器组件不仅是性能优化，更是一种架构范式的回归。从 PHP 时代到 Next.js 的轮回。',
    content: `React Server Components（RSC）是 React 团队推出的一项重大更新，它不仅是一种性能优化手段，更代表了一种架构范式的回归。

## 历史的轮回

### PHP 时代

在 Web 开发的早期（2000年代），PHP 是主流技术栈。所有的逻辑都在服务器端执行，浏览器只负责渲染 HTML：

\`\`\`php
<?php
// server-side
$posts = fetchPosts();
foreach ($posts as $post) {
    echo "<article>" . $post['title'] . "</article>";
}
?>
\`\`\`

### SPA 时代

随着 jQuery、Angular、React 的出现，客户端渲染（CSR）成为了主流：

\`\`\`jsx
// client-side
const App = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetchPosts().then(data => setPosts(data));
  }, []);
  
  return posts.map(post => <article>{post.title}</article>);
};
\`\`\`

### 回归服务器

现在，RSC 让我们回到了类似 PHP 的模式，但保留了组件化的优势：

\`\`\`jsx
// server component (async)
const PostList = async () => {
  const posts = await fetchPosts();
  
  return posts.map(post => <PostCard post={post} />);
};
\`\`\`

## RSC 的核心概念

### 什么是服务器组件？

服务器组件是在服务器上渲染的 React 组件，它们的代码不会发送到浏览器。

### 与客户端组件的区别

| 特性 | 服务器组件 | 客户端组件 |
|------|-----------|-----------|
| 渲染位置 | 服务器 | 浏览器 |
| Bundle 大小 | 不包含在 bundle | 包含在 bundle |
| 可访问后端 | 直接访问 | 需要通过 API |
| 支持事件 | ❌ | ✅ |
| 支持状态 | ❌ | ✅ |
| 支持浏览器 API | ❌ | ✅ |

## 实际应用

### 传统的 SSR

\`\`\`jsx
// getServerSideProps
export async function getServerSideProps() {
  const posts = await fetchPosts();
  return { props: { posts } };
}

function Page({ posts }) {
  return posts.map(post => <PostCard post={post} />);
}
\`\`\`

### 使用 RSC

\`\`\`jsx
// server component
const Page = async () => {
  const posts = await fetchPosts();
  
  return (
    <>
      <Header />
      <PostList posts={posts} />
      <Footer />
    </>
  );
};

// client component (marked with "use client")
const PostCard = ({ post }) => {
  return <article onClick={() => alert(post.id)}>{post.title}</article>;
};
\`\`\`

## 性能优势

### Bundle 大小减少

传统 SPA：
\`\`\`
main.js: 500KB
react: 42KB
react-dom: 150KB
lodash: 70KB
Total: 762KB
\`\`\`

使用 RSC：
\`\`\`
main.js: 150KB (only client components)
react: 42KB
react-dom: 150KB
Total: 342KB
\`\`\`

### 减少客户端 JS

服务器组件直接返回 HTML，不需要在客户端重新执行渲染逻辑。

## 架构范式

### 三层架构

1. **Server Components** - 数据获取和布局
2. **Client Components** - 交互和状态
3. **Server Actions** - 表单和突变

### 最佳实践

- 默认使用服务器组件
- 仅在需要交互时使用客户端组件
- 保持组件职责单一

## Next.js 的实现

Next.js 13+ 完整实现了 RSC：

\`\`\`jsx
// app/posts/page.tsx (server component by default)
const PostsPage = async () => {
  const posts = await db.posts.findMany();
  
  return <PostList posts={posts} />;
};
\`\`\`

## 注意事项

1. **学习曲线**：需要理解服务器/客户端组件的边界
2. **调试复杂度**：代码分布在服务器和客户端
3. **生态适配**：第三方库可能需要适配

## 总结

RSC 不是银弹，但它代表了一种更合理的架构方向。它让我们重新思考：什么应该在服务器端完成，什么应该在客户端完成？

从某种意义上说，我们正在经历一次技术范式的成熟：从客户端渲染的狂热，回归到服务器渲染的理性，同时保留了组件化的优势。

这或许就是技术的螺旋式上升。`,
    tags: ['React', 'Next.js', 'Server Components', '架构设计'],
    readingTime: '15 min'
  },
  {
    id: '05',
    title: '2023 年度总结：破碎与重组',
    date: '2023.12.31',
    category: 'LIFE',
    excerpt: '这一年，我尝试打破原有的知识体系，像重构老旧代码一样重构了自己的生活习惯。',
    content: `这一年，我尝试打破原有的知识体系，像重构老旧代码一样重构了自己的生活习惯。

## 1. 认知破碎

年初，我意识到自己的知识体系存在严重问题：

- 技术栈碎片化，缺乏深度
- 学习被动，被新技术牵着鼻子走
- 输出不足，知识沉淀不够

我决定进行一次"认知重构"。

## 2. 重构策略

### 删除冗余依赖

以前我追求"全栈"，什么都学一点：

- 学习了 10+ 种编程语言
- 使用了 20+ 种前端框架
- 订阅了 50+ 个技术博客

今年，我做了减法：

- 深度掌握：TypeScript, React, Rust
- 精简订阅：5 个高质量信息源
- 删除无用：删除了 3 年未使用的项目

### 重构核心模块

我重新设计了学习的"核心模块"：

| 领域 | 深度优先级 | 学习策略 |
|------|-----------|---------|
| 前端 | 90% | 深入 React 生态 |
| 后端 | 70% | Node.js + Rust |
| 运维 | 50% | Docker + K8s |
| 设计 | 40% | UI/UX 基础 |

### 单元测试验证

我给自己设定了"单元测试"：

- 每月输出一篇技术文章
- 每周进行一次技术分享
- 每天阅读 1 小时深度内容

## 3. 重组成果

### 技术提升

- Rust 从零基础到能独立开发 CLI 工具
- 深入理解了 React Server Components
- 掌握了系统设计的基本方法

### 认知升级

- 从"收集"到"筛选"
- 从"广度"到"深度"
- 从"被动"到"主动"

### 生活改变

- 规律作息，早睡早起
- 减少社交媒体使用
- 增加线下社交

## 4. 2024 计划

### 技术方向

1. **Rust 生态**：继续深入学习，参与开源项目
2. **AI 辅助开发**：掌握 LLM 应用开发
3. **系统设计**：提升架构能力

### 生活目标

1. **健康**：坚持运动，改善睡眠
2. **阅读**：每月阅读 2 本书
3. **创作**：保持写作输出

## 结语

重构是痛苦的，但也是必要的。就像重构代码一样，重构生活也需要勇气和智慧。

2024年，我将继续这个破碎与重组的过程。因为只有不断打破自己，才能成为更好的自己。

感谢这一年遇到的每一个人，经历过的每一件事。你们都是我成长路上的重要节点。`,
    tags: ['年度总结', '个人成长', '技术规划'],
    readingTime: '8 min'
  },
  {
    id: '06',
    title: 'Rust 所有权机制图解',
    date: '2023.10.15',
    category: 'TECH',
    excerpt: '用一种可视化的方式理解 Rust 最难啃的骨头。',
    content: `Rust 的所有权机制（Ownership）是这门语言最核心也是最难理解的概念。本文尝试用可视化的方式来解释它。

## 基本概念

### 所有权规则

Rust 的所有权遵循三条规则：

1. 每个值都有一个所有者（owner）
2. 一个值同一时间只能有一个所有者
3. 当所有者离开作用域，值被丢弃

### 可视化图例

\`\`\`
变量: [name] → 内存地址: 0x1234
所有权: ★
引用: ↗
\`\`\`

## 场景 1：基本类型

\`\`\`rust
let x = 5;
let y = x;
\`\`\`

### 内存图解

\`\`\`
步骤 1: let x = 5;
x [0x1000] → 5 ★

步骤 2: let y = x;
x [0x1000] → 5 ★
y [0x1004] → 5 ★  (Copy 语义)
\`\`\`

**说明**：实现了 \`Copy\` trait 的类型（如整数、布尔值）在赋值时会自动复制。

## 场景 2：字符串

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;
\`\`\`

### 内存图解

\`\`\`
步骤 1: let s1 = String::from("hello");
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'

步骤 2: let s2 = s1;
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ✗ (Move 语义)
s2 [0x1004] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'
\`\`\`

**说明**：String 类型未实现 \`Copy\` trait，所以所有权会转移（move），s1 不再有效。

## 场景 3：克隆

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1.clone();
\`\`\`

### 内存图解

\`\`\`
步骤 1: let s1 = String::from("hello");
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'

步骤 2: let s2 = s1.clone();
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
s2 [0x1004] → ptr: 0x3000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'
                  [0x3000] → 'h', 'e', 'l', 'l', 'o'
\`\`\`

**说明**：\`.clone()\` 方法会进行深度拷贝，创建新的堆内存。

## 场景 4：引用（Borrowing）

\`\`\`rust
let s1 = String::from("hello");
let len = calculate_length(&s1);

fn calculate_length(s: &String) -> usize {
    s.len()
}
\`\`\`

### 内存图解

\`\`\`
步骤 1: let s1 = String::from("hello");
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'

步骤 2: let len = calculate_length(&s1);
s1 [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'
s   [0x1004] → ref: 0x1000 (指向 s1 的引用) ↗
\`\`\`

**说明**：引用只是指向数据的指针，不获取所有权。

## 场景 5：可变引用

\`\`\`rust
let mut s = String::from("hello");
s.push_str(", world!");
\`\`\`

### 内存图解

\`\`\`
步骤 1: let mut s = String::from("hello");
s [0x1000] → ptr: 0x2000, len: 5, cap: 5 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o'

步骤 2: s.push_str(", world!");
s [0x1000] → ptr: 0x2000, len: 13, cap: 13 ★
                  [0x2000] → 'h', 'e', 'l', 'l', 'o', ',', ' ', 'w', 'o', 'r', 'l', 'd', '!'
\`\`\`

**说明**：可变引用允许修改数据，但同一时间只能有一个可变引用。

## 场景 6：生命周期

\`\`\`rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
\`\`\`

### 内存图解

\`\`\`
let s1 = String::from("hello");
let s2 = String::from("world");

let result = longest(&s1, &s2);
\`\`\`

\`\`\`
步骤 1: 创建字符串
s1 [0x1000] → "hello" ★
s2 [0x1004] → "world" ★

步骤 2: 调用函数
x [0x1008] → ref: 0x1000 ↗ (生命周期 'a)
y [0x100C] → ref: 0x1004 ↗ (生命周期 'a)

步骤 3: 返回结果
result [0x1010] → ref: 0x1000 ↗ (生命周期 'a 必须长于 result)
\`\`\`

**说明**：生命周期标注确保引用在使用时始终有效。

## 总结

Rust 的所有权机制通过编译时的检查，避免了运行时的内存安全问题：

| 特性 | 好处 | 成本 |
|------|------|------|
| 所有权 | 避免内存泄漏 | 需要理解所有权规则 |
| 借用 | 零成本抽象 | 需要管理生命周期 |
| 移动语义 | 性能优化 | 需要区分 Copy/Move |

### 学习建议

1. **从简单开始**：先理解基本类型的 Copy 语义
2. **多写代码**：通过实践加深理解
3. **阅读文档**：官方文档是最好的学习资料
4. **使用 IDE**：好的 IDE 能提示所有权问题

## 推荐资源

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Rustlings](https://github.com/rust-lang/rustlings)

  希望这些图解能帮助你理解 Rust 的所有权机制。如果有问题，欢迎讨论！`,
    tags: ['Rust', '内存管理', '编程语言', '图解教程'],
    readingTime: '15 min'
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
