import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Home,
  Copy,
  Check,
  Share2,
  Link2
} from 'lucide-react';
import GiscusComments from '../components/GiscusComments';
import TableOfContents from '../components/TableOfContents';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = BLOG_POSTS.find(p => p.id === id);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [showCopyAlert, setShowCopyAlert] = React.useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const copyToClipboard = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: post!.title,
      text: post!.excerpt,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Share canceled');
      }
    }

    navigator.clipboard.writeText(window.location.href);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post!.title)}&url=${encodeURIComponent(window.location.href)}`,
    weibo: `http://service.weibo.com/share/share.php?title=${encodeURIComponent(post!.title)}&url=${encodeURIComponent(window.location.href)}`
  };

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!post) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
          <p className="font-mono text-gray-500 mb-6">文章不存在</p>
          <Link 
            to="/posts"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = BLOG_POSTS.findIndex(p => p.id === id);
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

  const relatedPosts = React.useMemo(() => {
    return BLOG_POSTS
      .filter(p => p.id !== id)
      .map(p => ({
        ...p,
        relevanceScore: p.tags.filter(tag => post!.tags.includes(tag)).length
      }))
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }, [id, post]);

  return (
    <div className="animate-in fade-in duration-500 relative">
      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-neon to-neon-dark shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 顶部装饰条 - 水墨渐变 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ink via-neon to-ink dark:from-white dark:via-neon dark:to-white opacity-50"></div>

      {/* 扫描线动画效果 */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-neon opacity-20 animate-scan"></div>

      {/* 面包屑导航 */}
      <div className="mb-6 relative z-10">
        <nav className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 inline-block backdrop-blur-sm">
          <Link to="/" className="hover:text-neon dark:hover:text-neon transition-colors flex items-center gap-1">
            <Home size={14} />
            首页
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link to="/posts" className="hover:text-neon dark:hover:text-neon transition-colors">
            文章
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-ink dark:text-gray-200 truncate max-w-xs">
            {post.title}
          </span>
        </nav>
      </div>

      {/* 文章头部 */}
      <div className="mb-8 relative">
        {/* 左上角水墨装饰 */}
        <div className="absolute -top-4 -left-4 w-32 h-32 opacity-10 dark:opacity-5 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-slow">
            <defs>
              <radialGradient id="inkGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#inkGradient)" className="text-ink dark:text-white"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-ink dark:text-white"/>
            <circle cx="50" cy="50" r="15" fill="currentColor" className="text-ink dark:text-white opacity-80"/>
          </svg>
        </div>

        {/* 返回按钮 + 文章ID */}
        <div className="flex items-center justify-between mb-4">
          <Link 
            to="/posts"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="group-hover:underline decoration-neon/50">返回文章列表</span>
          </Link>
          <div className="font-mono text-xs text-neon border border-neon px-3 py-1.5 bg-neon/5 hover:bg-neon/10 transition-colors">
            📄 POST #{post.id}
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink dark:text-white leading-tight mb-6 relative group">
          {post.title}
          <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-neon to-transparent group-hover:w-full transition-all duration-500"></div>
        </h1>

        {/* 分隔线 - 扫描线效果 */}
        <div className="relative h-px mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon to-transparent animate-shimmer"></div>
        </div>

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors cursor-default">
            <Calendar size={16} className="text-neon" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neon border border-neon px-3 py-1.5 bg-neon/5 hover:bg-neon/10 transition-colors">
              {post.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors cursor-default">
            <Clock size={16} className="text-neon" />
            <span>{post.readingTime}</span>
          </div>
        </div>

        {/* 社交分享 */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group"
            >
              <Share2 size={16} className="group-hover:scale-110 transition-transform" />
              分享
            </button>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group"
            >
              Twitter
            </a>
            <a
              href={shareLinks.weibo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group"
            >
              微博
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShowCopyAlert(true);
                setTimeout(() => setShowCopyAlert(false), 2000);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ink/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon transition-all text-sm font-mono group relative"
            >
              <Link2 size={16} className="group-hover:scale-110 transition-transform" />
              复制链接
              {showCopyAlert && (
                <div className="absolute top-full mt-2 left-0 bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 rounded text-xs font-mono shadow-lg animate-in fade-in slide-in-from-top-2 z-50 whitespace-nowrap">
                  链接已复制到剪贴板
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 摘要区 - 玻璃拟态 */}
      <div className="mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-neon/10 to-transparent rounded-lg blur-sm"></div>
        <div className="relative p-6 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border-l-4 border-neon rounded-r-lg shadow-lg">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-neon mt-1 flex-shrink-0" />
            <p className="font-serif text-lg leading-relaxed text-ink dark:text-gray-200 italic">
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* 内容区 + 目录 */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 目录 */}
          <div className="w-full lg:flex-shrink-0 lg:w-auto">
            <TableOfContents content={post.content} />
          </div>

          {/* 文章内容 */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-8 md:p-12 relative overflow-hidden">
                {/* 装饰角标 */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M0,0 L100,0 L100,100 L0,0 Z" fill="currentColor" className="text-ink dark:text-white"/>
                  </svg>
                </div>

                <div className="relative z-10">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({children}) => {
                        const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
                        return (
                          <h1 id={id} className="text-3xl md:text-4xl font-serif font-bold text-ink dark:text-white mt-8 mb-4 pb-2 border-b-2 border-neon/30 scroll-mt-24">
                            {children}
                          </h1>
                        );
                      },
                      h2: ({children}) => {
                        const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
                        return (
                          <h2 id={id} className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-white/10 scroll-mt-24">
                            {children}
                          </h2>
                        );
                      },
                      h3: ({children}) => {
                        const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
                        return (
                          <h3 id={id} className="text-xl md:text-2xl font-serif font-bold text-ink dark:text-white mt-5 mb-2 scroll-mt-24">
                            {children}
                          </h3>
                        );
                      },
                      p: ({children}) => (
                        <p className="text-lg leading-relaxed text-ink dark:text-gray-200 mb-4">
                          {children}
                        </p>
                      ),
                      ul: ({children}) => (
                        <ul className="space-y-2 mb-4 ml-6 list-disc marker:text-neon">
                          {children}
                        </ul>
                      ),
                      ol: ({children}) => (
                        <ol className="space-y-2 mb-4 ml-6 list-decimal marker:text-neon">
                          {children}
                        </ol>
                      ),
                      li: ({children}) => (
                        <li className="text-base leading-relaxed text-ink dark:text-gray-200 pl-2">
                          {children}
                        </li>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-neon pl-4 py-2 my-4 bg-gray-50/50 dark:bg-white/5 italic text-gray-700 dark:text-gray-300">
                          {children}
                        </blockquote>
                      ),
                      code: ({node, inline, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        
                        if (!inline && language) {
                          return (
                            <div className="relative my-6 rounded-lg overflow-hidden group">
                              <div className="absolute top-0 right-0 p-2 z-10">
                                <button
                                  onClick={() => copyToClipboard(String(children), language)}
                                  className="flex items-center gap-1 px-2 py-1 bg-ink/5 dark:bg-white/10 text-xs font-mono rounded hover:bg-ink/10 dark:hover:bg-white/20 transition-colors"
                                >
                                  {copiedCode === language ? (
                                    <Check size={12} className="text-green-500" />
                                  ) : (
                                    <Copy size={12} className="text-gray-500" />
                                  )}
                                  <span className="text-gray-600 dark:text-gray-300">
                                    {copiedCode === language ? '已复制' : '复制'}
                                  </span>
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={language}
                                PreTag="div"
                                className="!mt-0 !rounded-lg !bg-[#0d0d0d] !text-sm"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code 
                            className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-neon font-mono text-sm rounded border border-gray-200 dark:border-white/20"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      a: ({href, children}) => (
                        <a 
                          href={href} 
                          className="text-neon hover:text-neon/80 underline decoration-neon/30 hover:decoration-neon transition-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({children}) => (
                        <strong className="font-bold text-ink dark:text-white">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签区 */}
      <div className="mb-12 relative">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="w-6 h-6 bg-neon/10 rounded-full flex items-center justify-center text-neon">🏷️</span>
            标签
          </span>
          {post.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full text-sm font-mono hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(0,255,136,0.2)] transition-all cursor-pointer group"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 相关文章推荐 */}
      {relatedPosts.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white flex items-center gap-3">
            <span className="text-neon">⚡</span>
            相关文章
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                to={`/posts/${relatedPost.id}`}
                className="group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-neon hover:shadow-lg hover:shadow-neon/10 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="text-xs text-neon font-mono mb-2">{relatedPost.category}</div>
                  <h4 className="font-serif font-bold text-lg text-ink dark:text-white mb-3 line-clamp-2 group-hover:text-neon transition-colors">
                    {relatedPost.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 font-mono">
                    <span>{relatedPost.date}</span>
                    <span>{relatedPost.readingTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 上一篇/下一篇导航 */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prevPost && (
            <Link
              to={`/posts/${prevPost.id}`}
              className="group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-neon hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                  <ArrowLeft size={20} className="text-gray-400 group-hover:text-neon transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-neon transition-colors">上一篇</p>
                  <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:translate-x-1 transition-transform">{prevPost.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{prevPost.date}</p>
                </div>
              </div>
            </Link>
          )}
          
          {nextPost && (
            <Link
              to={`/posts/${nextPost.id}`}
              className={`group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-neon hover:shadow-lg transition-all duration-300 overflow-hidden ${!prevPost ? 'md:col-start-2' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-neon transition-colors">下一篇</p>
                  <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:-translate-x-1 transition-transform">{nextPost.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{nextPost.date}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-neon transition-colors" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* 评论区域 */}
      <div className="mb-12">
        <h3 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white">
          评论
        </h3>
        <GiscusComments theme={theme} />
      </div>

      {/* 返回顶部 */}
      <div className="text-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group px-8 py-3 bg-ink dark:bg-white text-white dark:text-ink font-mono text-sm rounded hover:bg-neon dark:hover:bg-neon dark:hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] hover:-translate-y-1"
        >
          ↑ 返回顶部
        </button>
      </div>
    </div>
  );
};

export default PostDetail;
