import { PrismaClient, ProjectStatus, WatchStatus, AnimeType, DiaryType, EventType, AnnouncementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. 创建文章
  const post1 = await prisma.post.create({
    data: {
      id: '01',
      title: '重构现实：赛博空间的虚无与存在',
      slug: 'reconstruct-reality',
      content: `当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？这是一个值得深思的问题。

## 虚拟与现实

柏拉图的洞穴寓言描述了一群被囚禁在洞穴中的人...`,
      excerpt: '当我们在编写代码时，是否也在无意中重塑了物理世界的运行逻辑？探讨虚拟DOM与柏拉图洞穴寓言的奇妙联系。',
      date: new Date('2024-05-21'),
      category: 'PHILOSOPHY',
      tags: ['哲学', '虚拟现实', 'React', '柏拉图'],
      readingTime: '8 min',
      viewCount: 1250,
      likeCount: 89,
      isPublished: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      id: '02',
      title: '水墨组件库开发实录',
      slug: 'ink-component-library',
      content: `如何在 CSS 中复刻宣纸的渗透感？这是一个看似简单，实则充满挑战的问题...`,
      excerpt: '如何在 CSS 中复刻宣纸的渗透感？记一次从 WebGL 到 SVG 滤镜的技术迁移过程。',
      date: new Date('2024-04-10'),
      category: 'ENGINEERING',
      tags: ['前端开发', 'WebGL', 'SVG', '性能优化'],
      readingTime: '12 min',
      viewCount: 890,
      likeCount: 56,
      isPublished: true,
    },
  });

  console.log(`✅ Created ${2} posts`);

  // 2. 创建公告
  await prisma.announcement.createMany({
    data: [
      {
        title: '网站全新改版上线',
        content: '经过数月的开发与打磨，全新的 INK.SPIRIT 博客正式上线！',
        type: AnnouncementType.SUCCESS,
      },
      {
        title: '系统维护通知',
        content: '计划于本周日凌晨进行服务器维护。',
        type: AnnouncementType.WARNING,
      },
    ],
  });
  console.log('✅ Created announcements');

  // 3. 创建项目
  await prisma.project.createMany({
    data: [
      {
        name: 'INK.SPIRIT Blog',
        slug: 'ink-spirit-blog',
        description: '赛博武侠风格的个人博客系统，融合东方美学与赛博朋克元素。',
        type: 'Fullstack Project',
        tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        status: ProjectStatus.ACTIVE,
        featured: true,
        githubUrl: 'https://github.com/example/ink-spirit-blog',
      },
      {
        name: 'Cyber Wuxia UI',
        slug: 'cyber-wuxia-ui',
        description: '一套赛博武侠风格的 UI 组件库。',
        type: 'UI Library',
        tech: ['React', 'Tailwind CSS', 'Storybook'],
        status: ProjectStatus.DEPLOYED,
        featured: true,
      },
    ],
  });
  console.log('✅ Created projects');

  // 4. 创建技能
  await prisma.skill.createMany({
    data: [
      { name: 'React', category: 'FRONTEND.CORE', level: 95, rank: 'Master', projectCount: 15 },
      { name: 'TypeScript', category: 'FRONTEND.CORE', level: 90, rank: 'Expert', projectCount: 12 },
      { name: 'Node.js', category: 'BACKEND.OPS', level: 85, rank: 'Expert', projectCount: 8 },
      { name: 'Rust', category: 'BACKEND.OPS', level: 60, rank: 'Adept', projectCount: 3 },
      { name: 'PostgreSQL', category: 'BACKEND.OPS', level: 80, rank: 'Expert', projectCount: 6 },
      { name: 'Figma', category: 'DESIGN.ARTS', level: 75, rank: 'Adept', projectCount: 10 },
    ],
  });
  console.log('✅ Created skills');

  // 5. 创建时间线事件
  await prisma.timelineEvent.createMany({
    data: [
      { year: '2024', date: '05.20', title: 'INK.SPIRIT Launch', description: '博客系统正式上线', type: EventType.MILESTONE },
      { year: '2024', date: '01.15', title: 'Joined Tech Company', description: '入职某科技公司担任高级前端工程师', type: EventType.JOB },
      { year: '2023', date: '06.21', title: 'Graduation', description: '计算机科学硕士毕业', type: EventType.LIFE },
    ],
  });
  console.log('✅ Created timeline events');

  // 6. 创建动漫
  await prisma.anime.createMany({
    data: [
      {
        title: 'Ghost in the Shell: SAC_2045',
        cover: '#1a1b26',
        type: AnimeType.TV,
        episodes: 26,
        currentEp: 24,
        status: WatchStatus.WATCHING,
        score: 9.5,
        favorite: true,
        studios: ['Production I.G', 'Sola Digital Arts'],
        genres: ['Sci-Fi', 'Action', 'Police'],
        synopsis: '2045年，持续的经济灾难被称为「全球同步 default」。',
      },
      {
        title: 'Cyberpunk: Edgerunners',
        cover: '#10b981',
        type: AnimeType.TV,
        episodes: 10,
        currentEp: 10,
        status: WatchStatus.COMPLETED,
        score: 9.0,
        favorite: true,
        studios: ['Studio Trigger'],
        genres: ['Sci-Fi', 'Action', 'Drama'],
        synopsis: '在一个痴迷于技术和身体改造的未来城市里，一个街头小子努力生存。',
      },
    ],
  });
  console.log('✅ Created anime entries');

  // 7. 创建日记
  await prisma.diary.createMany({
    data: [
      {
        type: DiaryType.SHORT,
        content: '今日代码如诗，逻辑如剑，斩断一切 bug。',
        stamp: '武',
        date: new Date('2024-05-20'),
      },
      {
        type: DiaryType.LONG,
        title: '重构之思',
        subtitle: '关于代码与哲学',
        longContent: '重构不仅是代码的重构，更是思维的重构...',
        location: '杭州',
        mood: '🌙',
        weather: '☁️',
        date: new Date('2024-05-15'),
        readingTime: '5 min',
      },
    ],
  });
  console.log('✅ Created diary entries');

  // 8. 创建相册
  const album = await prisma.album.create({
    data: {
      title: '赛博杭州',
      cover: '#10b981',
      location: '杭州',
      thoughts: '这座城市的光影，如同代码般流动。',
    },
  });

  await prisma.galleryImage.createMany({
    data: [
      {
        title: '西湖夜色',
        src: '#1a1b26',
        albumId: album.id,
        location: '西湖',
        aspect: 'landscape',
        tags: ['夜景', '赛博朋克'],
      },
      {
        title: '城市脉络',
        src: '#059669',
        albumId: album.id,
        location: '钱江新城',
        aspect: 'portrait',
        tags: ['建筑', '光影'],
      },
    ],
  });
  console.log('✅ Created gallery');

  // 9. 创建关系节点
  await prisma.networkNode.createMany({
    data: [
      { name: 'CYBER.RONIN', role: 'Core Developer', description: '本站作者，全栈开发者', type: 'core', x: 0, y: 0, connections: [] },
      { name: 'Open Source Community', role: 'Collaborator', description: '开源社区', type: 'major', x: 100, y: 50, connections: [] },
    ],
  });
  console.log('✅ Created network nodes');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
