import React, { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../../../lib/upload';
import { useToastActions } from '../../../contexts/ToastContext';

import type { HeroSettingsTabProps } from './types';

const HeroSettingsTab: React.FC<HeroSettingsTabProps> = ({ config, updateHeroContent, editingHero, setEditingHero, setConfig }) => {
  const toast = useToastActions();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  // 用 ref 给每个 background 存一个独立的 hidden input，方便清空后重新选择
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setBgImage = (id: string, url: string) => {
    setConfig(prev => ({
      ...prev,
      heroBackgrounds: prev.heroBackgrounds.map(h =>
        h.id === id ? { ...h, backgroundImage: url } : h
      ),
    }));
  };

  const handleUpload = async (id: string, file?: File) => {
    if (!file || uploadingId) return;
    setUploadingId(id);
    try {
      const url = await uploadImage(file, 'general');
      setBgImage(id, url);
      toast.success('背景图已上传');
    } catch (e: any) {
      const msg = e?.message || '上传失败，请检查网络或文件格式';
      toast.error(msg);
      console.error('[HeroUpload]', e);
    } finally {
      setUploadingId(null);
      // 清空 input，允许重复选择同一个文件
      const input = fileInputRefs.current[id];
      if (input) input.value = '';
    }
  };

  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">Hero 背景配置</h3>
      <p className="text-sm text-gray-500">配置首页轮播背景的内容</p>
    </div>
     <div className="space-y-4">
      {config.heroBackgrounds.map((hero) => (
        <div key={hero.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setEditingHero(editingHero === hero.id ? null : hero.id)}
          >
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={hero.enabled}
                onChange={(e) => {
                  e.stopPropagation();
                  setConfig(prev => ({
                    ...prev,
                    heroBackgrounds: prev.heroBackgrounds.map(h => 
                      h.id === hero.id ? { ...h, enabled: e.target.checked } : h
                    )
                  }));
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">{hero.name}</span>
              <span className="text-xs text-gray-500">({hero.id})</span>
            </div>
            <div className="text-gray-400">
              {editingHero === hero.id ? <X size={18} /> : <span className="text-sm">展开</span>}
            </div>
          </div>
           {editingHero === hero.id && (
            <div className="p-4 space-y-6 border-t border-gray-200">
              {/* 背景图 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">背景图</span>
                  <span className="text-xs text-gray-400 font-normal">留空则使用内置特效</span>
                </h4>
                {hero.backgroundImage && (
                  <div className="relative w-full max-w-xs">
                    <img src={hero.backgroundImage} alt="" className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setBgImage(hero.id, '')}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow"
                      title="移除背景图"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hero.backgroundImage || ''}
                    onChange={(e) => setBgImage(hero.id, e.target.value)}
                    placeholder="图片链接 https://… 或点右侧上传"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${uploadingId === hero.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white cursor-pointer hover:bg-gray-700'}`}>
                    {uploadingId === hero.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploadingId === hero.id ? '上传中…' : '上传'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[hero.id] = el; }}
                      onChange={(e) => handleUpload(hero.id, e.target.files?.[0])}
                      disabled={uploadingId === hero.id}
                    />
                  </label>
                </div>
              </div>

              {/* Chinese Content */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">中文</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">标签</label>
                    <input
                      type="text"
                      value={hero.contentZH.tag}
                      onChange={(e) => updateHeroContent(hero.id, 'ZH', 'tag', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">标题前缀</label>
                    <input
                      type="text"
                      value={hero.contentZH.titleStart}
                      onChange={(e) => updateHeroContent(hero.id, 'ZH', 'titleStart', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">标题高亮</label>
                    <input
                      type="text"
                      value={hero.contentZH.titleHighlight}
                      onChange={(e) => updateHeroContent(hero.id, 'ZH', 'titleHighlight', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">标题后缀</label>
                    <input
                      type="text"
                      value={hero.contentZH.titleEnd}
                      onChange={(e) => updateHeroContent(hero.id, 'ZH', 'titleEnd', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">引用语</label>
                  <input
                    type="text"
                    value={hero.contentZH.quote}
                    onChange={(e) => updateHeroContent(hero.id, 'ZH', 'quote', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
               {/* English Content */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">English</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                    <input
                      type="text"
                      value={hero.contentEN.tag}
                      onChange={(e) => updateHeroContent(hero.id, 'EN', 'tag', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title Start</label>
                    <input
                      type="text"
                      value={hero.contentEN.titleStart}
                      onChange={(e) => updateHeroContent(hero.id, 'EN', 'titleStart', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title Highlight</label>
                    <input
                      type="text"
                      value={hero.contentEN.titleHighlight}
                      onChange={(e) => updateHeroContent(hero.id, 'EN', 'titleHighlight', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title End</label>
                    <input
                      type="text"
                      value={hero.contentEN.titleEnd}
                      onChange={(e) => updateHeroContent(hero.id, 'EN', 'titleEnd', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quote</label>
                  <input
                    type="text"
                    value={hero.contentEN.quote}
                    onChange={(e) => updateHeroContent(hero.id, 'EN', 'quote', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
  );
};

export default HeroSettingsTab;
