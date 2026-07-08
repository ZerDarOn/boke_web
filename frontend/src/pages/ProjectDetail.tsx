import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import rehypeRaw from 'rehype-raw';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FolderGit2,
  Code2,
  LayoutDashboard
} from 'lucide-react';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';
import PrevNextNavigation from '../components/PrevNextNavigation';
import { useLang } from '../contexts/LangContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { projectMarkdownComponents } from '../components/markdown/contentMarkdownComponents';
import type { Project } from '../lib/api';
import { useProject, useProjectsList } from '../hooks/queries/projects';

const DETAIL_REHYPE_PLUGINS = [rehypeRaw];

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { data: project, isLoading: loading, error: queryError } = useProject(id);
  const { data: allProjects = [] } = useProjectsList({ limit: 500 });
  const error = queryError?.message ?? null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-neon dark:bg-neon';
      case 'ARCHIVED': return 'bg-yellow-400 dark:bg-yellow-400';
      case 'DEPLOYED': return 'bg-blue-500 dark:bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const copyToClipboard = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '进行中';
      case 'ARCHIVED': return '已归档';
      case 'DEPLOYED': return '已部署';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon"></div>
      </div>
    );
  }

  if (error || !project) {
    return <Navigate to="/projects" replace />;
  }

  const currentIndex = allProjects.findIndex(p => p.id === id);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  return (
    <div className="animate-in fade-in duration-500 relative">
      {/* 面包屑导航 */}
      <div className="mb-6 relative z-10">
        <BreadcrumbNav items={[
          { label: '项目军火库', href: '/projects' },
          { label: project.name }
        ]} />
      </div>

      {/* 项目头部 */}
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

        {/* 返回按钮 + 项目ID */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="group-hover:underline decoration-neon/50">返回项目列表</span>
          </Link>
          <div className="font-mono text-xs text-neon border border-neon px-3 py-1.5 bg-neon/5 hover:bg-neon/10 transition-colors">
            📄 PROJECT #{project.id}
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink dark:text-white leading-tight mb-6 relative group">
          {project.name}
          <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-neon to-transparent group-hover:w-full transition-all duration-500"></div>
        </h1>

        {/* 分隔线 - 描描线效果 */}
        <div className="relative h-px mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon to-transparent animate-shimmer"></div>
        </div>

        {/* 元信息 + 跳转链接 */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono hover:text-neon transition-colors cursor-default">
            <Calendar size={16} className="text-neon" />
            <span>{project.startDate || '2024.01.01'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono">
            <FolderGit2 size={16} className="text-neon" />
            <span>{project.type}</span>
          </div>
          {/* 跳转链接 - 只显示图标 */}
          <div className="flex items-center gap-3 ml-auto">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-ink/5 dark:hover:bg-white/5 hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:border-neon transition-all"
                title="GitHub"
              >
                <Github size={16} className="text-gray-600 dark:text-gray-400 hover:text-neon" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-ink/5 dark:hover:bg-white/5 hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:border-neon transition-all"
                title="演示"
              >
                <Play size={14} className="text-gray-600 dark:text-gray-400 hover:text-neon" />
              </a>
            )}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-ink/5 dark:hover:bg-white/5 hover:shadow-[0_0_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:border-neon transition-all"
                title="项目链接"
              >
                <ExternalLink size={14} className="text-gray-600 dark:text-gray-400 hover:text-neon" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 项目截图 */}
      <div className="mb-12">
        <div
          className="w-full h-64 md:h-80 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl hover:border-neon transition-all duration-300 relative group"
          style={{ background: project.imageUrl || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-2xl font-bold opacity-0 group-hover:opacity-20 transition-opacity">
              {project.name}
            </span>
          </div>
        </div>
      </div>

      {/* 项目简介（玻璃拟态） */}
      <div className="mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-neon/10 to-transparent rounded-lg blur-sm"></div>
        <div className="relative p-6 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border-l-4 border-neon rounded-r-lg shadow-lg">
          <div className="flex items-start gap-3">
            <Code2 size={20} className="text-neon mt-1 flex-shrink-0" />
            <p className="font-serif text-lg leading-relaxed text-ink dark:text-gray-200 italic">
              {project.description}
            </p>
          </div>
        </div>
      </div>

      {/* 技术栈展示 */}
      <div className="mb-12">
        <h3 className="text-xl font-serif font-bold mb-4 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white flex items-center gap-2">
          <span className="text-neon">⚡</span>
          技术栈
        </h3>
        <div className="flex flex-wrap gap-3">
          {project.tech.map((tech, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-mono hover:border-neon hover:text-neon dark:hover:border-neon dark:hover:text-neon hover:shadow-[0_0_10px_rgba(16,185,129,0.1)] dark:hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* README 详细内容 */}
      {project.readme ? (
          <div className="mb-12">
            <h3 className="text-xl font-serif font-bold mb-4 pb-2 border-b border-gray-200 dark:border-white/10 text-ink dark:text-white flex items-center gap-2">
              <LayoutDashboard size={20} className="text-neon" />
              详细文档
            </h3>
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
                    content={project.readme}
                    onCopyCode={copyToClipboard}
                    copiedCode={copiedCode}
                    rehypePlugins={DETAIL_REHYPE_PLUGINS}
                    components={projectMarkdownComponents}
                  />
                </div>
              </div>
            </div>
          </div>
      ) : (
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent dark:from-white/5 dark:to-transparent rounded-lg blur-sm"></div>
            <div className="relative p-8 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border-l-4 border-gray-300 dark:border-gray-600 rounded-r-lg shadow-lg">
              <div className="flex items-center gap-4">
                <LayoutDashboard size={24} className="text-gray-400 dark:text-gray-500" />
                <div>
                  <h3 className="text-xl font-serif font-bold text-gray-600 dark:text-gray-300 mb-1">
                      暂无详细文档
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                      该项目暂未提供详细文档说明。
                  </p>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* 上一篇/下一篇导航 */}
      <PrevNextNavigation
        prev={prevProject ? { id: prevProject.id, title: prevProject.name, href: `/projects/${prevProject.id}` } : null}
        next={nextProject ? { id: nextProject.id, title: nextProject.name, href: `/projects/${nextProject.id}` } : null}
      />

      {/* 返回顶部 */}
      <BackToTop color="neon" />
    </div>
  );
};

export default ProjectDetail;
