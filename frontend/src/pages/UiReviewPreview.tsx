import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  BookOpen, BrainCircuit, Check, ChevronLeft, ChevronRight, Code2, Database,
  Download, FileArchive, FileDown, FileText, FolderHeart, Layers3, Mail,
  Music2, Palette, Radio, Sparkles, UserRound,
} from 'lucide-react';
import './UiReviewPreview.css';

type PreviewTab = 'article' | 'about' | 'skills';
const categories = [['全部文章', '24'], ['开发随笔', '9'], ['生活切片', '7']];
const tags = ['React', 'TypeScript', '随笔', '摄影', '独立开发', '读书'];
const tocItems = ['写在开始之前', '为什么想做这件事', '搭建过程', '一些取舍', '后记'];

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <section className={'ui-review-card ' + className}>{children}</section>
);
const CardTitle: React.FC<React.PropsWithChildren> = ({ children }) => <h3 className="ui-review-card-title">{children}</h3>;

const ProfileCard = () => (
  <Card className="ui-review-profile">
    <div className="ui-review-avatar" aria-hidden="true">墨</div>
    <strong>CYBER.RONIN</strong><span>写代码，也写生活</span>
    <div className="ui-review-profile-links" aria-label="个人链接"><span>GitHub</span><span>Mail</span><span>RSS</span></div>
  </Card>
);

const CategoriesCard = () => (
  <Card>
    <CardTitle><FolderHeart size={17} /> 分类</CardTitle>
    <div className="ui-review-list">
      {categories.map(([name, count], index) => (
        <button className={index === 0 ? 'is-active' : ''} key={name} type="button"><span>{name}</span><small>{count}</small></button>
      ))}
    </div>
  </Card>
);

const TagsCard = () => (
  <Card><CardTitle><Sparkles size={17} /> 标签</CardTitle><div className="ui-review-tags">{tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></Card>
);

const TocCard = ({ compact = false }: { compact?: boolean }) => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const update = () => {
      let current = 0;
      tocItems.forEach((_, index) => {
        if ((document.getElementById('review-section-' + index)?.getBoundingClientRect().top ?? Infinity) <= 180) current = index;
      });
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
  <Card className={compact ? 'ui-review-toc ui-review-toc--compact' : 'ui-review-toc'}>
    <CardTitle><BookOpen size={17} /> 本文目录</CardTitle>
    <nav aria-label="预览文章目录">
      {tocItems.map((item, index) => (
        <button className={index === active ? 'is-active' : ''} aria-current={index === active ? 'location' : undefined} onClick={() => document.getElementById('review-section-' + index)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} key={item} type="button"><span>{String(index + 1).padStart(2, '0')}</span>{item}</button>
      ))}
    </nav>
    <small>第 {active + 1} 节 / 共 {tocItems.length} 节</small>
  </Card>
  );
};

const FloatingToc = () => (
  <details className="ui-review-floating-toc">
    <summary><BookOpen size={16} />目录</summary>
    <TocCard />
  </details>
);

const ActivityCards = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? 'ui-review-side-stack is-compact' : 'ui-review-side-stack'}>
    <Card>
      <CardTitle><Radio size={17} /> 最近动态</CardTitle>
      <div className="ui-review-activity"><i /><div><strong>重做文章阅读页</strong><span>让内容重新成为主角</span></div></div>
      <div className="ui-review-activity"><i /><div><strong>记录一段旅途</strong><span>2026 · 秋</span></div></div>
    </Card>
    <Card className="ui-review-mini-card"><Radio size={18} /><div><strong>RSS 订阅</strong><span>不错过新的文章</span></div><ChevronRight size={16} /></Card>
    <Card className="ui-review-mini-card"><Music2 size={18} /><div><strong>正在听</strong><span>雪月花 · Piano</span></div><ChevronRight size={16} /></Card>
  </div>
);

const LeftRail = ({ appendRight }: { appendRight: boolean }) => (
  <aside className="ui-review-left-rail" aria-label="博客侧栏预览">
    <div className="ui-review-sticky-stack">
      <ProfileCard /><CategoriesCard /><TagsCard />
      {appendRight && <div className="ui-review-moved-content"><ActivityCards compact /></div>}
    </div>
  </aside>
);

const ArticlePreview = ({ rightOpen }: { rightOpen: boolean }) => (
  <div className={'ui-review-layout ' + (rightOpen ? '' : 'is-right-collapsed')}>
    <LeftRail appendRight={!rightOpen} />
    <main className="ui-review-article">
      <div className={'ui-review-toc-anchor ' + (rightOpen ? '' : 'is-docked')}><FloatingToc /></div>
      <div className="ui-review-kicker">开发随笔 · 12 分钟阅读</div>
      <h1>从零搭建一个中文 TRPG 在线虚拟桌</h1>
      <p className="ui-review-lead">一次关于朋友、骰子和深夜灵感的开发记录。技术只是工具，故事才是这篇文章真正想留下的东西。</p>
      <div className="ui-review-byline"><span>2026.09.08</span><span>1,842 字</span><span>独立开发</span></div>
      <div className="ui-review-divider" />
      <h2 id="review-section-0">写在开始之前</h2>
      <p>我们有一个固定的小团体，偶尔在周末开一局。最开始只是想做个简单的房间，让聊天、掷骰子和角色卡待在同一个页面里。</p>
      <blockquote>“能不能做一个属于我们自己的虚拟桌？”</blockquote>
      <h2 id="review-section-1">为什么想做这件事</h2>
      <p>真正重要的不是堆叠功能，而是让每个人都能自然地参与故事。于是我把复杂的控制藏起来，把正在发生的事情留在最清楚的位置。</p>
      <div className="ui-review-note"><Sparkles size={18} /><div><strong>阅读小记</strong><span>这是硬编码内容，只用于确认版式、圆角、留白和侧栏行为。</span></div></div>
      <h2 id="review-section-2">搭建过程</h2><p>正文宽度维持在舒适的阅读范围，行高更松，标题与段落之间留出呼吸。两侧信息负责辅助，不再争夺正文的注意力。</p>
      <h2 id="review-section-3">一些取舍</h2><p>目录跟随阅读。收纳右栏时，正文保持原来的宽度和位置，右边留给常驻目录，动态和订阅收进左边。</p>
      <h2 id="review-section-4">后记</h2><p>一张桌子、一段故事，和几个愿意一起把想法做出来的人。下一次更新，继续记录过程中那些有趣的小事。</p>
    </main>
    <aside className="ui-review-right-rail" aria-label="文章辅助栏预览"><div className="ui-review-sticky-stack">{rightOpen ? <ActivityCards /> : <TocCard />}</div></aside>
  </div>
);

interface FileLinkProps {
  copy: string;
  icon: React.ReactNode;
  title: string;
}

const FileLink = ({ icon, title, copy }: FileLinkProps) => (
  <button className="ui-review-file-link" type="button">
    <span className="ui-review-file-icon">{icon}</span>
    <span><strong>{title}</strong><small>{copy}</small></span>
    <ChevronRight />
  </button>
);

type DownloadTone = 'document' | 'archive' | 'notes';

interface DownloadableFileCardProps {
  downloaded: boolean;
  fileName: string;
  icon: React.ReactNode;
  meta: string;
  onDownload: (fileName: string) => void;
  tone: DownloadTone;
}

const DownloadableFileCard = ({
  downloaded, fileName, icon, meta, onDownload, tone,
}: DownloadableFileCardProps) => (
  <button
    className={'ui-review-download-card ui-review-download-card--' + tone}
    onClick={() => onDownload(fileName)}
    type="button"
    aria-label={'演示下载 ' + fileName}
  >
    <span className="ui-review-download-icon">{icon}</span>
    <span className="ui-review-download-copy"><strong>{fileName}</strong><small>{meta}</small></span>
    <span className="ui-review-download-action">
      {downloaded ? <Check size={15} /> : <Download size={15} />}
      {downloaded ? '已演示' : '下载'}
    </span>
  </button>
);

interface AboutPreviewProps {
  rightOpen: boolean;
}

const AboutPreview: React.FC<AboutPreviewProps> = ({ rightOpen }) => {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const handleDownload = (fileName: string) => setDownloadedFile(fileName);

  return (
    <div className={'ui-review-layout ui-review-about-layout ' + (rightOpen ? '' : 'is-right-collapsed')}>
      <LeftRail appendRight={!rightOpen} />
      <main className="ui-review-about">
        <Card className="ui-review-welcome-card">
          <div className="ui-review-about-icon"><UserRound size={24} /></div><div className="ui-review-eyebrow">WELCOME / 欢迎来访</div>
          <h1>你好，这里是我的一小块<mark>自留地</mark>。</h1>
          <p>我会在这里记录开发、阅读、游戏和偶尔冒出来的奇怪念头。它不需要像控制台，更像一张慢慢写满的书桌。</p>
          <div className="ui-review-hand-note">愿你能在这里，碰巧读到一点有用或有趣的东西。</div>
        </Card>
        <Card className="ui-review-files-card">
          <CardTitle><FileText size={18} /> 相关文件</CardTitle>
          <p className="ui-review-card-copy">一部分是站内内容入口，也可以从上传库挑选公开附件供访客下载。</p>
          <div className="ui-review-files-subtitle"><span>内容入口</span><small>继续阅读</small></div>
          <div className="ui-review-file-grid">
            <FileLink icon={<FileText />} title="关于我" copy="简单的自我介绍与本站来历" />
            <FileLink icon={<Mail />} title="联系方式" copy="邮件与常用社交账号" />
            <FileLink icon={<BookOpen />} title="阅读清单" copy="最近读过和想推荐的内容" />
            <FileLink icon={<Layers3 />} title="本站说明" copy="技术栈、许可和更新记录" />
          </div>
          <div className="ui-review-files-subtitle ui-review-files-subtitle--downloads">
            <span>可下载附件</span><small>来自上传库 · 公开文件</small>
          </div>
          <div className="ui-review-download-list">
            <DownloadableFileCard
              downloaded={downloadedFile === 'INK.SPIRIT 站点介绍.pdf'}
              fileName="INK.SPIRIT 站点介绍.pdf"
              icon={<FileDown />}
              meta="PDF · 2.4 MB · 2026.09"
              onDownload={handleDownload}
              tone="document"
            />
            <DownloadableFileCard
              downloaded={downloadedFile === '公开素材与图标.zip'}
              fileName="公开素材与图标.zip"
              icon={<FileArchive />}
              meta="ZIP · 6.8 MB · 允许转载"
              onDownload={handleDownload}
              tone="archive"
            />
            <DownloadableFileCard
              downloaded={downloadedFile === '我的阅读清单.md'}
              fileName="我的阅读清单.md"
              icon={<BookOpen />}
              meta="Markdown · 18 KB · 持续更新"
              onDownload={handleDownload}
              tone="notes"
            />
          </div>
          <p className="ui-review-download-status" aria-live="polite">
            {downloadedFile
              ? '审稿演示：已触发“' + downloadedFile + '”的下载状态。正式接入后会下载后台选中的真实文件。'
              : '当前是硬编码演示，不会真的下载文件。'}
          </p>
        </Card>
      </main>
      {rightOpen && <aside className="ui-review-right-rail"><div className="ui-review-sticky-stack"><ActivityCards /></div></aside>}
    </div>
  );
};

// Hardcoded review data: experience and proficiency are examples, not profile claims.
const skillExamples: Record<string, Array<[string, string]>> = {
  backend: [
    ['Java', '面向对象开发与服务端应用'], ['Python', '数据处理、自动化脚本与 AI 应用'], ['Node.js', '使用 JavaScript 构建服务端应用'],
    ['C#', '.NET 应用开发与工具编写'], ['Go', '轻量服务与并发任务处理'], ['Rust', '注重安全和性能的系统编程'],
    ['C++', '理解内存管理与底层运行机制'], ['C', '学习系统编程与基础数据结构'], ['Kotlin', '简洁的 JVM 应用开发'],
    ['Swift', '探索 Apple 平台的原生应用'], ['Ruby', '脚本编写与 Web 应用实践'], ['PHP', '服务端页面与网站开发'],
    ['Express', '轻量路由、中间件与 API 服务'], ['Spring Boot', '结构化的 Java 后端开发'], ['Django', '完整的 Python Web 开发框架'],
    ['FastAPI', '类型友好的异步接口开发'], ['GraphQL', '按需查询与接口数据建模'], ['REST API', '资源设计、鉴权与错误处理'],
    ['WebSocket', '实时消息与多人状态同步'], ['Linux', '服务部署与日常系统维护'],
  ],
  frontend: [
    ['React', '组件化页面与交互状态管理'], ['TypeScript', '为应用建立清晰的类型边界'], ['JavaScript', '浏览器交互与异步编程'],
    ['HTML', '语义化结构与可访问性基础'], ['CSS', '布局、排版与细节表现'], ['Vue', '渐进式组件与响应式界面'],
    ['Next.js', '页面路由与服务端渲染'], ['Vite', '快速开发与前端构建'], ['Tailwind CSS', '组合式样式与设计变量'],
    ['Motion', '自然的过渡与交互动效'], ['Sass', '组织可复用的样式规则'], ['Zustand', '轻量的跨组件状态管理'],
    ['TanStack Query', '异步数据缓存与状态同步'], ['Three.js', '浏览器中的三维场景'], ['Canvas', '绘图与可视化交互'],
    ['SVG', '清晰的图标与矢量图形'], ['Playwright', '验证真实浏览器中的交互'], ['Vitest', '组件逻辑与工具函数测试'],
  ],
  database: [
    ['PostgreSQL', '关系数据建模与复杂查询'], ['MySQL', '事务与常用业务数据存储'], ['SQLite', '轻量应用与本地数据存储'],
    ['Redis', '缓存、会话与临时状态'], ['MongoDB', '灵活的文档数据组织'], ['Prisma', '类型安全的数据访问'],
    ['SQL', '数据查询、聚合与分析'], ['Elasticsearch', '全文搜索与检索体验'], ['MinIO', '文件与对象存储管理'],
    ['ChromaDB', '向量检索与语义搜索'], ['数据库设计', '约束、索引与数据关系'], ['数据迁移', '安全演进应用的数据结构'],
  ],
  creative: [
    ['Figma', '界面探索与交互原型'], ['Photoshop', '图像处理与视觉素材制作'], ['Illustrator', '矢量图形与图标设计'],
    ['Git', '版本管理与协作记录'], ['Docker', '可复用的应用运行环境'], ['Markdown', '专注内容的写作与整理'],
    ['Obsidian', '连接笔记与个人知识管理'], ['技术写作', '把实现过程讲成易懂的故事'], ['摄影', '观察光线与记录日常'],
    ['剪辑', '镜头组织与节奏表达'], ['Blender', '三维建模与场景探索'], ['AI 工作流', '将生成工具融入创作过程'],
    ['Prompt Design', '清晰表达任务与约束'], ['自动化', '减少重复操作的小工具'], ['信息设计', '让复杂内容更容易阅读'],
  ],
};
const skillGroups = [
  { key: 'backend', title: '后端与服务', count: '20 项', percent: 31, detail: 'Node.js · Python · APIs', icon: Code2 },
  { key: 'frontend', title: '前端与体验', count: '18 项', percent: 28, detail: 'React · CSS · Motion', icon: Layers3 },
  { key: 'database', title: '数据与存储', count: '12 项', percent: 18, detail: 'PostgreSQL · Redis', icon: Database },
  { key: 'creative', title: '创作与工具', count: '15 项', percent: 23, detail: 'Writing · Design · AI', icon: Sparkles },
].map(group => ({ ...group, skills: skillExamples[group.key] }));

const skillTotal = skillGroups.reduce((total, group) => total + group.skills.length, 0);
const sampleLevels = [
  { label: '高级', experience: '2 年', progress: 82 },
  { label: '高级', experience: '3 年', progress: 85 },
  { label: '初级', experience: '6 个月', progress: 38 },
  { label: '中级', experience: '1 年', progress: 62 },
];

const SkillCardGroups = ({ selected }: { selected?: string }) => (
  <div className="ui-review-skill-catalog">
    {!selected && <div className="ui-review-skill-summary"><span><BrainCircuit size={25} /></span><div><strong>知识大脑</strong><small>全部技能 · 示例数据</small></div><b>{skillTotal}</b></div>}
    {skillGroups.filter(group => !selected || group.key === selected).map(({ key, title, skills, icon: Icon }) => (
      <section className={'ui-review-skill-group ui-review-skill-node--' + key} key={key} aria-label={title}>
        <header><span><Icon size={19} /></span><h2>{title}</h2><b>{skills.length}</b></header>
        <div className="ui-review-skill-grid">
          {skills.map(([name, description], index) => {
            const level = sampleLevels[index % sampleLevels.length];
            return <article className="ui-review-skill-item" key={name}>
              <div className="ui-review-skill-item-heading"><span className="ui-review-skill-monogram" aria-hidden="true">{name.slice(0, 2)}</span><div><h3>{name}</h3><small>{level.experience}</small></div><span className="ui-review-skill-level">{level.label}</span></div>
              <p>{description}</p>
              <progress max={100} value={level.progress} aria-label={name + ' 示例熟练度'} />
            </article>;
          })}
        </div>
      </section>
    ))}
  </div>
);

interface SkillBranchPreviewProps { groupKey: string }

interface SkillOverviewPreviewProps { onExplore: (key: string) => void }

const SkillTrunkPreview = ({ onExplore }: SkillOverviewPreviewProps) => (
  <section className="ui-review-skill-trunk" aria-label="技能主干脑图">
    <svg viewBox="0 0 800 560">
      <path className="ui-review-trunk-stem" d="M 130 280 H 270" />
      {skillGroups.map((group, index) => {
        const x = [270, 545, 305, 535][index];
        const y = [40, 110, 270, 420][index];
        return <g key={group.key} className={'ui-review-skill-node--' + group.key}>
          <path className="ui-review-trunk-link" d={'M 245 280 C 310 280 230 ' + (y + 46) + ' ' + x + ' ' + (y + 46)} />
          <foreignObject x={x} y={y} width={230} height={102}><button className="ui-review-trunk-category" type="button" onClick={() => onExplore(group.key)} aria-label={'展开' + group.title}>
            <span><group.icon size={24} /><strong>{group.title}</strong><b>{group.percent}%</b></span><small>{group.skills.length} 个技能 · {group.detail}</small><i><b style={{ width: group.percent + '%' }} /></i>
          </button></foreignObject>
        </g>;
      })}
      <foreignObject x={45} y={205} width={150} height={150}><button type="button" className="ui-review-universe-core" onClick={() => onExplore('panorama')} aria-label="知识大脑：展开全景"><BrainCircuit size={34} /><strong>知识大脑</strong><small>{skillTotal} 个技能 · 点击展开全景</small></button></foreignObject>
    </svg>
  </section>
);

const SkillOverviewPreview = ({ onExplore }: SkillOverviewPreviewProps) => {
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);
  const entries = skillGroups.flatMap(group => group.skills.map(([name], index) => ({ group, name, level: sampleLevels[index % sampleLevels.length] })));
  const rings = [{ count: 10, radius: 170 }, { count: 22, radius: 262 }, { count: 33, radius: 350 }];
  const nodes = entries.map((entry, index) => {
    let offset = index;
    const ring = rings.find(item => { if (offset < item.count) return true; offset -= item.count; return false; })!;
    const angle = offset / ring.count * Math.PI * 2 - Math.PI / 2;
    return { ...entry, x: 400 + Math.cos(angle) * ring.radius, y: 400 + Math.sin(angle) * ring.radius };
  });
  return <section className="ui-review-skill-universe" aria-label="全部技能脑图">
    <svg viewBox="0 0 800 800" aria-label="知识大脑与65个技能节点">
      {nodes.map(node => <g key={node.name} className={'ui-review-universe-node ui-review-skill-node--' + node.group.key + (focusedGroup && focusedGroup !== node.group.key ? ' is-muted' : '')}>
        <path d={'M 400 400 Q ' + (400 + node.x) / 2 + ' ' + (400 + node.y) / 2 + ' ' + node.x + ' ' + node.y} />
        <foreignObject x={node.x - 36} y={node.y - 22} width={72} height={44}>
          <button className="ui-review-universe-skill" type="button" title={node.name} aria-label={'探索' + node.group.title + '：' + node.name} onPointerEnter={() => setFocusedGroup(node.group.key)} onPointerLeave={() => setFocusedGroup(null)} onFocus={() => setFocusedGroup(node.group.key)} onBlur={() => setFocusedGroup(null)} onClick={() => onExplore(node.group.key)}>
            <strong>{node.name}</strong><small>{node.level.experience}</small><i><b style={{ width: node.level.progress + '%' }} /></i>
          </button>
        </foreignObject>
      </g>)}
      <circle className="ui-review-universe-halo" cx={400} cy={400} r={90} />
      <circle className="ui-review-universe-halo" cx={400} cy={400} r={102} />
      <foreignObject x={324} y={324} width={152} height={152}><button type="button" className="ui-review-universe-core" onClick={() => onExplore('overview')} aria-label="知识大脑：收回主干"><BrainCircuit size={35} /><strong>知识大脑</strong><small>{skillTotal} 个技能 · 点击收回主干</small></button></foreignObject>
    </svg>
    <nav className="ui-review-universe-legend" aria-label="脑图分类">{skillGroups.map(group => <button type="button" className={'ui-review-skill-node--' + group.key} key={group.key} onPointerEnter={() => setFocusedGroup(group.key)} onPointerLeave={() => setFocusedGroup(null)} onFocus={() => setFocusedGroup(group.key)} onBlur={() => setFocusedGroup(null)} onClick={() => onExplore(group.key)}><i />{group.title}<b>{group.skills.length}</b></button>)}</nav>
  </section>;
};

const SkillBranchPreview = ({ groupKey }: SkillBranchPreviewProps) => {
  const group = skillGroups.find(item => item.key === groupKey)!;
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const Icon = group.icon;
  // Two staggered rings keep the skill cards separate from the central category.
  const nodes = group.skills.map(([name, description], index) => {
    const innerCount = Math.min(8, group.skills.length);
    const inner = index < innerCount;
    const count = inner ? innerCount : group.skills.length - innerCount;
    const angle = ((inner ? index : index - innerCount) / count) * Math.PI * 2 - Math.PI / 2 + (inner ? Math.PI / 8 : 0);
    return { name, description, x: 400 + Math.cos(angle) * (inner ? 176 : 327), y: 290 + Math.sin(angle) * (inner ? 142 : 244), level: sampleLevels[index % sampleLevels.length] };
  });
  return <section className={'ui-review-branch ui-review-skill-node--' + group.key} aria-label={group.title + '技能脑图'}>
    <p className="ui-review-branch-hint">{group.title} · {group.skills.length} 个技能节点<span>小屏可左右滑动查看完整图谱</span></p>
    <div className="ui-review-branch-scroll" tabIndex={0} role="region" aria-label="可横向滚动的技能图谱">
      <svg className="ui-review-branch-diagram" viewBox="0 0 800 580" aria-label={group.title + '技能关系'}>
        {nodes.map(node => <path key={node.name} d={'M 400 290 Q ' + node.x + ' 290 ' + node.x + ' ' + node.y} />)}
        <foreignObject x={335} y={225} width={130} height={130}><div className="ui-review-branch-core"><Icon size={36} /><strong>{group.title}</strong><small>{group.skills.length} 个技能 · 示例</small></div></foreignObject>
        {nodes.map(node => <foreignObject key={node.name} x={node.x - 59} y={node.y - 31} width={118} height={62}><button type="button" className="ui-review-radial-skill" aria-label={'查看' + node.name + '详情'} aria-pressed={selectedName === node.name} onClick={() => setSelectedName(node.name)} title={node.name + '：' + node.description}>
          <span aria-hidden="true">{node.name.slice(0, 2)}</span><div><h3>{node.name}</h3><small>{node.level.experience} · {node.level.label}</small><progress max={100} value={node.level.progress} aria-label={node.name + ' 示例熟练度'} /></div>
        </button></foreignObject>)}
      </svg>
    </div>
    {selectedName && <section className="ui-review-selected-skill" aria-label="技能详情" aria-live="polite"><div><small>{group.title} / 技能详情 · 示例</small><h3>{selectedName}</h3><p>{group.skills.find(([name]) => name === selectedName)?.[1]}</p><span>{nodes.find(node => node.name === selectedName)?.level.experience} · {nodes.find(node => node.name === selectedName)?.level.label}</span></div><button type="button" onClick={() => setSelectedName(null)}>收起详情</button></section>}
  </section>;
};

const SkillsPreview = () => {
  const [view, setView] = useState('overview');
  const transitionRef = useRef<{ skipTransition: () => void } | null>(null);
  const allOpen = view === 'all';
  const handleViewChange = (nextView: string) => {
    if (nextView === view) return;
    transitionRef.current?.skipTransition();
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const transition = document.startViewTransition(() => flushSync(() => setView(nextView)));
      transitionRef.current = transition;
      // A newer selection may skip the snapshot before it is ready.
      void transition.ready.catch(() => {});
    } else setView(nextView);
  };
  useEffect(() => () => transitionRef.current?.skipTransition(), []);
  return (
    <div className="ui-review-skills-layout">
      <LeftRail appendRight={false} />
      <main className="ui-review-skills">
      <div className="ui-review-skills-heading">
        <div><h1>技能展示</h1><p>我的技术技能与创作工具，仍在慢慢生长。</p></div>
        <div className="ui-review-skill-controls">
          <div className="ui-review-palette-preview" aria-label="技能分组配色预览">
            <Palette size={15} /><span className="is-backend" title="后端蓝" /><span className="is-frontend" title="前端紫" /><span className="is-database" title="数据琥珀" /><span className="is-creative" title="创作玫红" />
          </div>
          <div className="ui-review-skill-view-actions">
            {view !== 'overview' && !allOpen && <button type="button" onClick={() => handleViewChange('overview')}><ChevronLeft size={16} />返回总览</button>}
            <button type="button" aria-pressed={allOpen} onClick={() => handleViewChange(allOpen ? 'overview' : 'all')}>{allOpen ? <ChevronLeft size={16} /> : <Sparkles size={16} />}{allOpen ? '返回图谱' : '全部展开'}</button>
          </div>
        </div>
      </div>
      <div className="ui-review-skill-stage">
      <nav className="ui-review-skill-breadcrumb" aria-label="技能层级"><button type="button" onClick={() => handleViewChange('overview')} aria-current={view === 'overview' ? 'page' : undefined}>知识大脑 / 主干</button>{view !== 'overview' && <><ChevronRight size={13} /><span>{view === 'all' ? '全部技能列表' : view === 'panorama' ? '全景脑图' : skillGroups.find(group => group.key === view)?.title + ' / 分支'}</span></>}</nav>
      <div className="ui-review-map-caption"><span><i />{allOpen ? '技能手册' : view === 'overview' ? '探索我的技能版图' : '沿着分支，看看具体技能'}</span><small>{allOpen ? '按领域整理 · 示例数据' : '点击分类探索 · 随时返回'}</small></div>
      <div key={view} className="ui-review-skill-view">
      {view === 'all' ? <SkillCardGroups /> : view === 'overview' ? <SkillTrunkPreview onExplore={handleViewChange} /> : view === 'panorama' ? <SkillOverviewPreview onExplore={handleViewChange} /> : <SkillBranchPreview groupKey={view} />}
      </div></div>
      </main>
      <aside className="ui-review-skill-insights" aria-label="技能概览">
        <section className="ui-review-learning-note"><span><Sparkles size={17} /> 持续生长中</span><h2>把好奇心，<br />变成会用的技能。</h2><p>从写代码到记录生活，<br />慢慢积累，也不断尝试。</p><div><strong>{skillTotal}<small>技能节点</small></strong><strong>04<small>探索领域</small></strong></div></section>
        <section className="ui-review-category-index"><h2>按领域探索</h2>{skillGroups.map(group => <button key={group.key} className={'ui-review-skill-node--' + group.key} type="button" aria-label={'切换到' + group.title} aria-pressed={view === group.key} onClick={() => handleViewChange(group.key)}><group.icon size={18} /><span>{group.title}</span><b>{group.skills.length}</b><ChevronRight size={13} /></button>)}</section>
        <section className="ui-review-skill-levels"><h2>熟练度分布 <small>示例</small></h2>{['高级', '中级', '初级'].map(label => {
          const count = skillGroups.reduce((sum, group) => sum + group.skills.filter((_, index) => sampleLevels[index % sampleLevels.length].label === label).length, 0);
          return <div key={label}><span>{label}<b>{count}</b></span><progress max={skillTotal} value={count} aria-label={label + '技能数量'} /></div>;
        })}</section>
      </aside>
    </div>
  );
};

const UiReviewPreview: React.FC = () => {
  const query = new URLSearchParams(window.location.search);
  const requestedTab = query.get('tab');
  const initialTab: PreviewTab = requestedTab === 'about' || requestedTab === 'skills' ? requestedTab : 'article';
  const [tab, setTab] = useState<PreviewTab>(initialTab);
  const [rightOpen, setRightOpen] = useState(query.get('collapsed') !== '1');
  const [palette, setPalette] = useState('garden');
  const tabs: Array<{ id: PreviewTab; label: string }> = [
    { id: 'article', label: '文章布局' }, { id: 'about', label: '关于页' }, { id: 'skills', label: '技能图谱' },
  ];
  return (
    <div className="ui-review-preview" data-palette={palette}>
      <header className="ui-review-header">
        <a className="ui-review-brand" href="/" aria-label="返回首页"><span>INK.</span>SPIRIT</a>
        <div className="ui-review-draft"><i /> UI DRAFT · 硬编码审稿版</div>
        <label className="ui-review-palette-select"><Palette size={16} /><select aria-label="切换配色" value={palette} onChange={event => setPalette(event.target.value)}><option value="garden">花园</option><option value="iris">鸢尾</option><option value="sunset">落日</option></select></label>
        <nav aria-label="预览页面切换">{tabs.map(({ id, label }) => <button className={tab === id ? 'is-active' : ''} key={id} onClick={() => setTab(id)} type="button">{label}</button>)}</nav>
        {tab !== 'skills' && <button className="ui-review-sidebar-toggle" onClick={() => setRightOpen((open) => !open)} type="button" aria-pressed={!rightOpen}>{rightOpen ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}{rightOpen ? '收纳右栏' : '展开右栏'}</button>}
      </header>
      <div className="ui-review-notice"><Sparkles size={15} /><span>这里只确认设计方向，不接真实数据，也没有替换正式页面。</span></div>
      {tab === 'article' && <ArticlePreview rightOpen={rightOpen} />}{tab === 'about' && <AboutPreview rightOpen={rightOpen} />}{tab === 'skills' && <SkillsPreview />}
      <button className="ui-review-single-orb" type="button" aria-label="打开墨璃助手预览"><span>墨</span><i /></button>
    </div>
  );
};

export default UiReviewPreview;
