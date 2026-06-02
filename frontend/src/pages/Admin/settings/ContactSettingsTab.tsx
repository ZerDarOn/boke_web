import React from 'react';
import { Mail, Link, Type, Globe, Image } from 'lucide-react';

import type { SettingsTabProps } from './types';

const ContactSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">联系方式</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Mail size={16} />
          邮箱
        </label>
        <input
          type="email"
          value={config.email}
          onChange={(e) => updateConfig('email', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ronin@cyber.ink"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Link size={16} />
          GitHub
        </label>
        <input
          type="text"
          value={config.github}
          onChange={(e) => updateConfig('github', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="github.com/username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Type size={16} />
          Twitter / X
        </label>
        <input
          type="text"
          value={config.twitter}
          onChange={(e) => updateConfig('twitter', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="twitter.com/username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Globe size={16} />
          Bilibili
        </label>
        <input
          type="text"
          value={config.bilibili}
          onChange={(e) => updateConfig('bilibili', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="bilibili.com/user/xxx"
        />
      </div>
    </div>
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Image size={16} />
        微信二维码链接
      </label>
      <input
        type="text"
        value={config.wechat}
        onChange={(e) => updateConfig('wechat', e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="https://... (二维码图片链接)"
      />
    </div>
  </div>
);

export default ContactSettingsTab;
