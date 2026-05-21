import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Announcement } from '../types';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowLeft,
  Clock,
  FileText,
  Wrench,
  Zap,
  Home
} from 'lucide-react';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';
import PrevNextNavigation from '../components/PrevNextNavigation';
import { useAnnouncement, useAnnouncements } from '../hooks/queries/announcements';

const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: announcement, isLoading: loading, error: queryError } = useAnnouncement(id);
  const { data: allAnnouncements = [] } = useAnnouncements();
  const error = queryError?.message ?? null;

  // 公告类型映射
  const getTypeConfig = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return {
          icon: <Info size={48} className="text-blue-500" />,
          bgClass: 'bg-blue-50/50 dark:bg-blue-900/10',
          borderClass: 'border-blue-500/30',
          textClass: 'text-blue-600 dark:text-blue-400',
          accentColor: 'bg-blue-500',
          category: '新文章发布',
          categoryIcon: <FileText size={16} />
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle size={48} className="text-yellow-500" />,
          bgClass: 'bg-yellow-50/50 dark:bg-yellow-900/10',
          borderClass: 'border-yellow-500/30',
          textClass: 'text-yellow-600 dark:text-yellow-400',
          accentColor: 'bg-yellow-500',
          category: '系统维护',
          categoryIcon: <Wrench size={16} />
        };
      case 'SUCCESS':
        return {
          icon: <CheckCircle size={48} className="text-green-500" />,
          bgClass: 'bg-green-50/50 dark:bg-green-900/10',
          borderClass: 'border-green-500/30',
          textClass: 'text-green-600 dark:text-green-400',
          accentColor: 'bg-green-500',
          category: '网站更新',
          categoryIcon: <Zap size={16} />
        };
      case 'IMPORTANT':
        return {
          icon: <AlertCircle size={48} className="text-red-500" />,
          bgClass: 'bg-red-50/50 dark:bg-red-900/10',
          borderClass: 'border-red-500/30',
          textClass: 'text-red-600 dark:text-red-400',
          accentColor: 'bg-red-500',
          category: '重要通知',
          categoryIcon: <AlertCircle size={16} />
        };
    }
  };

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

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <p className="font-mono text-red-500 text-lg">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
            >
              重试
            </button>
            <Link
              to="/announcement"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-ink dark:text-white font-mono text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              返回公告列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black text-ink dark:text-white">404</h1>
          <p className="font-mono text-gray-500">公告不存在</p>
          <Link
            to="/announcement"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors inline-block"
          >
            返回公告列表
          </Link>
        </div>
      </div>
    );
  }

  const typeConfig = getTypeConfig(announcement.type);
  // 使用 API 数据获取上一篇/下一篇
  const currentIndex = allAnnouncements.findIndex((a: Announcement) => a.id === announcement.id);
  const prevAnnouncement = currentIndex > 0 ? allAnnouncements[currentIndex - 1] : null;
  const nextAnnouncement = currentIndex < allAnnouncements.length - 1 ? allAnnouncements[currentIndex + 1] : null;

  return (
    <div className="animate-in fade-in duration-500">
      {/* 头部：返回按钮和标题 */}
      <div className="mb-8">
        <BreadcrumbNav items={[
          { label: '公告', href: '/announcement' },
          { label: announcement.title }
        ]} />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-2 border-ink dark:border-white">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold mb-4 ${typeConfig.bgClass} ${typeConfig.textClass} border ${typeConfig.borderClass}`}>
              {typeConfig.categoryIcon}
              {typeConfig.category}
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-black text-ink dark:text-white leading-tight">
              {announcement.title}
            </h1>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* 类型图标头 */}
        <div className={`p-8 md:p-12 border-b border-gray-200 dark:border-white/10 ${typeConfig.bgClass}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              {typeConfig.icon}
            </div>
            
            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-6 justify-center text-sm">
              <div className={`flex items-center gap-2 ${typeConfig.textClass} font-mono`}>
                <Calendar size={16} />
                <span>{announcement.date}</span>
              </div>
              <div className={`flex items-center gap-2 ${typeConfig.textClass} font-mono`}>
                <Clock size={16} />
                <span>公告编号: {announcement.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className={`font-serif text-lg leading-relaxed text-ink dark:text-gray-200 ${typeConfig.bgClass} rounded-lg p-6 border ${typeConfig.borderClass}`}>
              {announcement.content}
            </div>

            {/* 附件区域（可选） */}
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div className="mt-8">
                <h3 className="font-sans font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-neon" />
                  附件
                </h3>
                <div className="space-y-2">
                  {announcement.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-400 group-hover:text-neon" />
                        <div>
                          <p className="font-mono text-sm text-ink dark:text-white">{attachment.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{attachment.size}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-neon group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

{/* 上一篇/下一篇导航 */}
      <PrevNextNavigation
        prev={prevAnnouncement ? { id: prevAnnouncement.id, title: prevAnnouncement.title, href: `/announcement/${prevAnnouncement.id}` } : null}
        next={nextAnnouncement ? { id: nextAnnouncement.id, title: nextAnnouncement.title, href: `/announcement/${nextAnnouncement.id}` } : null}
      />

      {/* 返回顶部按钮 */}
      <BackToTop color="neon" />
    </div>
  );
};

export default AnnouncementDetail;