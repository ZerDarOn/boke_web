import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { defaultSiteConfig } from './siteConfig';

import type { SettingsTabProps } from './types';

const CopySettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => (
  <div className="space-y-8">
    {/* 日记页面文案 */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={18} className="text-blue-600" />
        日记页面
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">页面标题</label>
          <input
            type="text"
            value={config.pageCopy.diaryTitle}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, diaryTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="DIARY.STREAM"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">副标题</label>
          <input
            type="text"
            value={config.pageCopy.diarySubtitle}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, diarySubtitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Private Thoughts"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">引用语</label>
        <input
          type="text"
          value={config.pageCopy.diaryQuote}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, diaryQuote: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Writing is defragmentation of the soul."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">起始标记文字</label>
        <input
          type="text"
          value={config.pageCopy.diaryStartLabel}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, diaryStartLabel: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="记录开始"
        />
      </div>
    </div>
     {/* 想法流文案 */}
    <div className="space-y-4 pt-6 border-t">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={18} className="text-blue-600" />
        想法流（首页）
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
          <input
            type="text"
            value={config.pageCopy.thoughtsTitle}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, thoughtsTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="THOUGHT STREAM"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
          <input
            type="text"
            value={config.pageCopy.thoughtsLabel}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, thoughtsLabel: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="MICRO-BLOG"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">背景装饰文字</label>
        <input
          type="text"
          value={config.pageCopy.thoughtsBgText}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, thoughtsBgText: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="念"
        />
      </div>
    </div>
     {/* Footer 文案 */}
    <div className="space-y-4 pt-6 border-t">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={18} className="text-blue-600" />
        页脚
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">引用语</label>
        <textarea
          value={config.pageCopy.footerQuote}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, footerQuote: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="The code flows like wind, invisible yet mighty."
        />
      </div>
    </div>
     {/* 公告文案 */}
    <div className="space-y-4 pt-6 border-t">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={18} className="text-blue-600" />
        侧边栏公告
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
        <input
          type="text"
          value={config.pageCopy.announcementTitle}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, announcementTitle: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="公告"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
        <textarea
          value={config.pageCopy.announcementContent}
          onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, announcementContent: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="公告内容..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">链接地址</label>
          <input
            type="text"
            value={config.pageCopy.announcementLink}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, announcementLink: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="/announcement"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">链接文字</label>
          <input
            type="text"
            value={config.pageCopy.announcementLinkText}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, announcementLinkText: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="了解更多"
          />
        </div>
      </div>
    </div>
     {/* 关于页面 */}
    <div className="space-y-4 pt-6 border-t">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={18} className="text-blue-600" />
        关于页面
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">联系标题</label>
          <input
            type="text"
            value={config.pageCopy.aboutContactTitle}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, aboutContactTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="联系方式"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">提示文字</label>
          <input
            type="text"
            value={config.pageCopy.aboutContactCopyTip}
            onChange={(e) => updateConfig('pageCopy', { ...config.pageCopy, aboutContactCopyTip: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="点击卡片复制链接或访问"
          />
        </div>
      </div>
    </div>
     {/* 重置按钮 */}
    <div className="pt-4 border-t">
      <button
        onClick={() => updateConfig('pageCopy', defaultSiteConfig.pageCopy)}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <RefreshCw size={16} />
        重置为默认文案
      </button>
    </div>
  </div>
);

export default CopySettingsTab;
