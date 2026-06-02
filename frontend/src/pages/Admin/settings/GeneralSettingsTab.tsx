import React from 'react';
import { User } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

import type { SettingsTabProps } from './types';

const GeneralSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">博客信息</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          博客名称
        </label>
        <input
          type="text"
          value={config.blogName}
          onChange={(e) => updateConfig('blogName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="INK.SPIRIT"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          博客副标题
        </label>
        <input
          type="text"
          value={config.blogSubtitle}
          onChange={(e) => updateConfig('blogSubtitle', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="数字编年史"
        />
      </div>
    </div>
     <h3 className="text-lg font-semibold text-gray-900 pt-4 border-t">作者信息</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作者名称
        </label>
        <input
          type="text"
          value={config.authorName}
          onChange={(e) => updateConfig('authorName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="CYBER.RONIN"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作者头衔
        </label>
        <input
          type="text"
          value={config.authorTitle}
          onChange={(e) => updateConfig('authorTitle', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Fullstack Alchemist"
        />
      </div>
    </div>
     {/* 头像上传 */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        作者头像
      </label>
      <div className="flex items-start gap-6">
        {/* 头像预览 - 带绿色边框和状态点 */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-emerald-500 shadow-lg"
          >
            {config.authorAvatar ? (
              <img
                src={config.authorAvatar}
                alt="作者头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>
          {/* 在线状态指示器 */}
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-3 border-white dark:border-gray-800 rounded-full" />
        </div>
        
        {/* 上传组件 */}
        <div className="flex-1">
          <ImageUpload
            value={config.authorAvatar}
            onChange={(url) => updateConfig('authorAvatar', url)}
            type="author"
            size={80}
            label=""
            placeholder="点击上传头像"
          />
          <p className="text-xs text-gray-500 mt-2">
            推荐尺寸：200x200 像素，支持 JPG、PNG 格式
          </p>
        </div>
      </div>
    </div>
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        个人简介
      </label>
      <textarea
        value={config.authorBio}
        onChange={(e) => updateConfig('authorBio', e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="在数字虚空中记录灵魂的回响"
      />
    </div>
     <h3 className="text-lg font-semibold text-gray-900 pt-4 border-t">SEO 设置</h3>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        网站描述
      </label>
      <textarea
        value={config.siteDescription}
        onChange={(e) => updateConfig('siteDescription', e.target.value)}
        rows={2}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        关键词 (用逗号分隔)
      </label>
      <input
        type="text"
        value={config.siteKeywords}
        onChange={(e) => updateConfig('siteKeywords', e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>
);

export default GeneralSettingsTab;
