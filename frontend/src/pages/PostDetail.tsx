import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import rehypeRaw from 'rehype-raw';
import { useQueryClient } from '@tanstack/react-query';
import { usePost, usePostNavList } from '../hooks/queries/posts';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useThemeClass } from '../hooks/useThemeClass';
import { queryKeys } from '../hooks/api/query-keys';
import { postsApi } from '../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Home,
  Share2,
  Link2,
  Lock,
  AlertCircle
} from 'lucide-react';
import SimpleComments from '../components/GiscusComments';
import TableOfContents from '../components/TableOfContents';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';
import PrevNextNavigation from '../components/PrevNextNavigation';
import { SEO } from '../components/SEO';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { postMarkdownComponents } from '../components/markdown/contentMarkdownComponents';
import type { Post } from '../lib/api';

const DETAIL_REHYPE_PLUGINS = [rehypeRaw];

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: post, isLoading: loading, refetch } = usePost(id);
  const { data: navList = [] } = usePostNavList();
  const allPosts = navList as Post[];
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const scrollProgress = useScrollProgress();
  const theme = useThemeClass();
  const [showCopyAlert, setShowCopyAlert] = React.useState(false);
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const copyToClipboard = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* 用户取消分享 */
      }
    }

    navigator.clipboard.writeText(window.location.href);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const shareLinks = {
    twitter: post ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}` : '',
    weibo: post ? `http://service.weibo.com/share/share.php?title=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}` : ''
  };

  useEffect(() => {
    setNeedPassword(false);
    setPasswordError('');
    if (post?.needPassword) {
      setNeedPassword(true);
    }
  }, [post?.id, post?.needPassword]);

  // Verify password
  const handleVerifyPassword = async () => {
    if (!post || !password) return;

    setVerifying(true);
    setPasswordError('');

    try {
      const result = await postsApi.verifyPassword(post.id, password);
      if (result.success && result.data?.success) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id!) });
        await refetch();
        setNeedPassword(false);
        setPassword('');
      } else {
        setPasswordError('密码错误');
      }
    } catch (error) {
      setPasswordError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  // 将 useMemo 移到条件渲染之前，确保 Hooks 顺序一致
  const postsList = allPosts.length > 0 ? allPosts : [];
  // 使用 slug 或 id 匹配当前文章
  const currentIndex = postsList.findIndex((p) =>
    p.slug === post?.slug || p.id === post?.id
  );
  const prevPost = currentIndex > 0 ? postsList[currentIndex - 1] : null;
  const nextPost = currentIndex < postsList.length - 1 ? postsList[currentIndex + 1] : null;

  const relatedPosts = React.useMemo(() => {
    if (!post) return [];

    return postsList
      .filter((p) => p.slug !== post.slug && p.id !== post.id)
      .map((p) => ({
        ...p,
        relevanceScore: p.tags?.filter((tag: string) => post.tags?.includes(tag)).length || 0
      }))
      .filter((p: any) => p.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }, [post, postsList]);

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

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

  // Password protection UI
  if (needPassword) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md w-full px-6">
          <div className="mb-6">
            <Lock size={64} className="mx-auto text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold text-ink dark:text-white mb-2">此文章需要密码访问</h1>
            <p className="text-gray-500 dark:text-gray-400">{post.title}</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
              placeholder="请输入访问密码"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent"
            />

            {passwordError && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            <button
              onClick={handleVerifyPassword}
              disabled={verifying || !password}
              className="w-full px-6 py-3 bg-neon text-white font-mono rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  验证中...
                </>
              ) : (
                '验证密码'
              )}
            </button>

            <Link
              to="/posts"
              className="block text-gray-500 hover:text-neon dark:hover:text-neon transition-colors text-sm"
            >
              返回文章列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 relative">
      {/* SEO Meta Tags */}
      {post && (
        <SEO 
          title={post.title}
          description={post.excerpt}
          keywords={post.tags?.join(', ')}
          type="article"
        />
      )}
      
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
        <BreadcrumbNav items={[
          { label: '文章', href: '/posts' },
          { label: post.title }
        ]} />
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
                  <MarkdownRenderer
                    content={post.content}
                    onCopyCode={copyToClipboard}
                    copiedCode={copiedCode}
                    rehypePlugins={DETAIL_REHYPE_PLUGINS}
                    components={postMarkdownComponents}
                  />
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
            <Link 
              key={index}
              to={`/posts?tag=${encodeURIComponent(tag)}`}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full text-sm font-mono hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(0,255,136,0.2)] transition-all cursor-pointer group"
            >
              {tag}
            </Link>
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
            {relatedPosts.map((relatedPost: any) => (
              <Link
                key={relatedPost.id}
                to={`/posts/${relatedPost.slug || relatedPost.id}`}
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
      <PrevNextNavigation
        prev={prevPost ? { id: prevPost.id, title: prevPost.title, href: `/posts/${prevPost.slug || prevPost.id}`, date: prevPost.date } : null}
        next={nextPost ? { id: nextPost.id, title: nextPost.title, href: `/posts/${nextPost.slug || nextPost.id}`, date: nextPost.date } : null}
      />

      {/* 评论区域 */}
      <div className="mb-12">
        <h3 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white">
          评论
        </h3>
        <SimpleComments theme={theme} />
      </div>

      {/* 返回顶部 */}
      <BackToTop color="neon" />
    </div>
  );
};

export default PostDetail;
