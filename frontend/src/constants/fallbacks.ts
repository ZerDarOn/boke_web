/**
 * 后台/初始化用的少量兜底数据（生产逻辑可安全引用）
 */
import type { Activity } from '../types';

export const LATEST_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    project: 'ink-spirit-blog',
    title: '博客系统重构完成',
    tags: ['React', 'TypeScript', 'Vite'],
    status: 'DONE',
    date: '2025-02-10',
  },
  {
    id: 'a2',
    project: 'pixel-cabin-theme',
    title: 'Pixel Cabin 主题上线',
    tags: ['Design', 'CSS'],
    status: 'DONE',
    date: '2025-01-28',
  },
  {
    id: 'a3',
    project: 'performance-optimization',
    title: '性能优化与代码分割',
    tags: ['Vite', 'Webpack'],
    status: 'IN_PROGRESS',
    date: '2025-01-20',
  },
  {
    id: 'a4',
    project: 'rss-integration',
    title: 'RSS 订阅功能集成',
    tags: ['XML', 'Vite'],
    status: 'DONE',
    date: '2025-01-15',
  },
  {
    id: 'a5',
    project: 'giscus-comments',
    title: 'Giscus 评论系统部署',
    tags: ['GitHub', 'Comments'],
    status: 'DONE',
    date: '2025-01-10',
  },
];
