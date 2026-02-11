import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// 生成 RSS Feed
router.get('/', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    // 获取最新的 20 篇文章
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        author: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // 获取最新的公告
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 构建 RSS 项目
    const items: string[] = [];

    // 添加文章
    for (const post of posts) {
      const postUrl = `${baseUrl}/posts/${post.id}`;
      const pubDate = post.createdAt.toUTCString();
      const categories = post.tags.map((tag: string) =>
        `<category>${escapeXml(tag)}</category>`
      ).join('');

      items.push(`
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author?.displayName || 'CYBER.RONIN')}</author>
      <description>${escapeXml(post.excerpt || post.content.substring(0, 200))}</description>
      ${categories}
    </item>`);
    }

    // 添加公告
    for (const announcement of announcements) {
      const annUrl = `${baseUrl}/announcement/${announcement.id}`;
      const pubDate = announcement.createdAt.toUTCString();

      items.push(`
    <item>
      <title>[公告] ${escapeXml(announcement.title)}</title>
      <link>${annUrl}</link>
      <guid isPermaLink="true">${annUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>INK.SPIRIT</author>
      <description>${escapeXml(announcement.content.substring(0, 200))}</description>
      <category>公告</category>
    </item>`);
    }

    // 构建完整的 RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>INK.SPIRIT</title>
    <link>${baseUrl}</link>
    <atom:link href="${apiUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>CYBER.RONIN - Cyber-Wuxia Personal Blog | 赛博武侠个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Ink Spirit Blog API</generator>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>INK.SPIRIT</title>
      <link>${baseUrl}</link>
    </image>${items.join('')}
  </channel>
</rss>`;

    res.type('application/xml');
    res.send(rssXml);
  } catch (error) {
    console.error('生成 RSS 失败:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

// XML 转义函数
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
