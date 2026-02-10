import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { BLOG_POSTS } from './constants';

const generateRSS = () => {
  return {
    name: 'generate-rss',
    generateBundle() {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>INK.SPIRIT</title>
    <link>https://yourdomain.com</link>
    <atom:link href="https://yourdomain.com/rss.xml" rel="self" type="application/rss+xml" />
    <description>Cyber-Wuxia Personal Blog</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${BLOG_POSTS.map(post => `
    <item>
      <title>${post.title}</title>
      <link>https://yourdomain.com/posts/${post.id}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), generateRSS()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
