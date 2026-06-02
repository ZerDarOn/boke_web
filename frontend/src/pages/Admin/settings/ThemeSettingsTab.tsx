import React from 'react';
import { RefreshCw } from 'lucide-react';

import type { SettingsTabProps } from './types';

const ThemeSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">主题设置</h3>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        默认主题模式
      </label>
      <div className="flex gap-4">
        <button
          onClick={() => updateConfig('defaultTheme', 'light')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            config.defaultTheme === 'light' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <span className="text-xl">☀️</span>
          浅色模式
        </button>
        <button
          onClick={() => updateConfig('defaultTheme', 'dark')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            config.defaultTheme === 'dark' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <span className="text-xl">🌙</span>
          深色模式
        </button>
      </div>
    </div>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          主色调
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => updateConfig('primaryColor', e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={config.primaryColor}
            onChange={(e) => updateConfig('primaryColor', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          辅色调
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.secondaryColor}
            onChange={(e) => updateConfig('secondaryColor', e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={config.secondaryColor}
            onChange={(e) => updateConfig('secondaryColor', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
     <div className="pt-4 border-t">
      <button
        onClick={() => {
          updateConfig('primaryColor', '#10b981');
          updateConfig('secondaryColor', '#8b5cf6');
          updateConfig('defaultTheme', 'dark');
        }}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <RefreshCw size={16} />
        重置为默认主题
      </button>
    </div>
  </div>
);

export default ThemeSettingsTab;
