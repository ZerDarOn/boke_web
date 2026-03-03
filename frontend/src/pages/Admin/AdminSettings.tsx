import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Settings, Save, Globe, User, Mail, Image, Type, 
  Layout, Link, Loader2, X, Check, RefreshCw, FileText 
} from 'lucide-react';

interface SiteConfig {
  // 博客基本信息
  blogName: string;
  blogSubtitle: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  authorBio: string;
  
  // 联系方式
  email: string;
  github: string;
  twitter: string;
  bilibili: string;
  wechat: string;
  
  // Hero 背景配置
  heroBackgrounds: {
    id: string;
    name: string;
    enabled: boolean;
    contentZH: {
      tag: string;
      titleStart: string;
      titleHighlight: string;
      titleEnd: string;
      quote: string;
    };
    contentEN: {
      tag: string;
      titleStart: string;
      titleHighlight: string;
      titleEnd: string;
      quote: string;
    };
  }[];
  
  // 主题配置
  defaultTheme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  
  // SEO 配置
  siteDescription: string;
  siteKeywords: string;
  favicon: string;
  
  // 页面文案配置
  pageCopy: {
    // 日记页面
    diaryTitle: string;
    diarySubtitle: string;
    diaryQuote: string;
    diaryStartLabel: string;
    
    // 想法流（首页）
    thoughtsTitle: string;
    thoughtsLabel: string;
    thoughtsBgText: string;
    
    // Footer
    footerQuote: string;
    
    // 公告
    announcementTitle: string;
    announcementContent: string;
    announcementLink: string;
    announcementLinkText: string;
    
    // 关于页面
    aboutContactTitle: string;
    aboutContactCopyTip: string;
  };
}

const defaultConfig: SiteConfig = {
  blogName: 'INK.SPIRIT',
  blogSubtitle: '数字编年史',
  authorName: 'CYBER.RONIN',
  authorTitle: 'Fullstack Alchemist',
  authorAvatar: '',
  authorBio: '在数字虚空中记录灵魂的回响',
  
  email: 'ronin@cyber.ink',
  github: 'github.com/cyber-ronin',
  twitter: 'twitter.com/cyber_ronin',
  bilibili: 'bilibili.com/user/123456',
  wechat: '',
  
  heroBackgrounds: [
    {
      id: 'ink',
      name: 'Ink Slash',
      enabled: true,
      contentZH: {
        tag: '数字编年史(2025)',
        titleStart: '以',
        titleHighlight: '代码',
        titleEnd: '书写',
        quote: '"在数字虚空中记录灵魂的回响。"'
      },
      contentEN: {
        tag: 'DIGITAL.CHRONICLES(2025)',
        titleStart: 'WRITTEN IN',
        titleHighlight: 'CODE',
        titleEnd: '',
        quote: '"Documenting the ghost in the shell, one line at a time."'
      }
    },
    {
      id: 'grid',
      name: 'Cyber Grid',
      enabled: true,
      contentZH: {
        tag: '系统重构中...',
        titleStart: '矩阵',
        titleHighlight: '重载',
        titleEnd: '',
        quote: '"系统即是现实，逻辑构建真理。"'
      },
      contentEN: {
        tag: 'SYSTEM.REFACTORING...',
        titleStart: 'MATRIX',
        titleHighlight: 'RELOADED',
        titleEnd: '',
        quote: '"The system is the reality. Logic builds truth."'
      }
    },
    {
      id: 'nebula',
      name: 'Void Nebula',
      enabled: true,
      contentZH: {
        tag: '星海漫游指南',
        titleStart: '凝视',
        titleHighlight: '深渊',
        titleEnd: '',
        quote: '"在数据洪流中寻找秩序的星光。"'
      },
      contentEN: {
        tag: 'GUIDE.TO.GALAXY',
        titleStart: 'VOID',
        titleHighlight: 'GAZING',
        titleEnd: '',
        quote: '"Staring into the abyss of data, finding order in chaos."'
      }
    }
  ],
  
  defaultTheme: 'dark',
  primaryColor: '#10b981',
  secondaryColor: '#8b5cf6',
  
  siteDescription: 'INK.SPIRIT - 一个赛博风格的个人博客',
  siteKeywords: '博客,技术,编程,生活,动漫',
  favicon: '/favicon.ico',
  
  pageCopy: {
    // 日记页面
    diaryTitle: 'DIARY.STREAM',
    diarySubtitle: 'Private Thoughts',
    diaryQuote: 'Writing is defragmentation of the soul.',
    diaryStartLabel: '记录开始',
    
    // 想法流（首页）
    thoughtsTitle: 'THOUGHT STREAM',
    thoughtsLabel: 'MICRO-BLOG',
    thoughtsBgText: '念',
    
    // Footer
    footerQuote: 'The code flows like wind, invisible yet mighty.',
    
    // 公告
    announcementTitle: '公告',
    announcementContent: '本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 已上线，包含全新的夜间模式和水墨渲染引擎。',
    announcementLink: '/announcement',
    announcementLinkText: '了解更多',
    
    // 关于页面
    aboutContactTitle: '联系方式',
    aboutContactCopyTip: '点击卡片复制链接或访问'
  }
};

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'contact' | 'theme' | 'copy'>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingHero, setEditingHero] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // 从 API 获取配置
      const result = await api.settings.getAll();
      if (result.success && result.data) {
        setConfig({ ...defaultConfig, ...result.data });
        // 更新本地缓存
        localStorage.setItem('site_config', JSON.stringify(result.data));
      } else {
        // API 失败时尝试从 localStorage 加载
        const saved = localStorage.getItem('site_config');
        if (saved) {
          setConfig({ ...defaultConfig, ...JSON.parse(saved) });
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      // 出错时尝试从 localStorage 加载
      const saved = localStorage.getItem('site_config');
      if (saved) {
        setConfig({ ...defaultConfig, ...JSON.parse(saved) });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // 保存到后端 API
      const result = await api.settings.saveSiteConfig(config);
      if (result.success) {
        // 同时保存到 localStorage 作为缓存
        localStorage.setItem('site_config', JSON.stringify(config));
        setMessage({ type: 'success', text: '设置已保存到服务器！所有设备将同步更新' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (error) {
      console.error('Save config error:', error);
      setMessage({ type: 'error', text: '保存失败，请检查网络连接' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const updateHeroContent = (heroId: string, lang: 'ZH' | 'EN', field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      heroBackgrounds: prev.heroBackgrounds.map(h => 
        h.id === heroId 
          ? { ...h, [`content${lang}`]: { ...h[`content${lang}` as keyof typeof h], [field]: value } }
          : h
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Settings size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
            <p className="text-gray-500">管理网站全局配置和内容</p>
          </div>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          保存设置
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 flex-wrap">
          {[
            { id: 'general', label: '基本信息', icon: Globe },
            { id: 'hero', label: 'Hero 背景', icon: Image },
            { id: 'contact', label: '联系方式', icon: Mail },
            { id: 'theme', label: '主题设置', icon: Layout },
            { id: 'copy', label: '页面文案', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  头像链接
                </label>
                <input
                  type="text"
                  value={config.authorAvatar}
                  onChange={(e) => updateConfig('authorAvatar', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
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
          )}

          {/* Hero Settings */}
          {activeTab === 'hero' && (
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
          )}

          {/* Contact Settings */}
          {activeTab === 'contact' && (
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
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
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
          )}

          {/* Page Copy Settings */}
          {activeTab === 'copy' && (
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
                  onClick={() => updateConfig('pageCopy', defaultConfig.pageCopy)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  重置为默认文案
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
