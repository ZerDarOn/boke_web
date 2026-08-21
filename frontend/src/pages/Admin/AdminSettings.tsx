import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSiteSettings, useSaveSiteConfig } from '../../hooks/queries/settings';
import {
  Settings, Save, Globe, Mail, Image, Layout, FileText, Type, Brain,
  Loader2, X, Check, MousePointer2,
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { defaultSiteConfig, type SiteConfig } from './settings/siteConfig';

const GeneralSettingsTab = lazy(() => import('./settings/GeneralSettingsTab'));
const HeroSettingsTab = lazy(() => import('./settings/HeroSettingsTab'));
const ContactSettingsTab = lazy(() => import('./settings/ContactSettingsTab'));
const ThemeSettingsTab = lazy(() => import('./settings/ThemeSettingsTab'));
const CopySettingsTab = lazy(() => import('./settings/CopySettingsTab'));
const FontSettingsTab = lazy(() => import('./settings/FontSettingsTab'));
const AIModelSettingsTab = lazy(() => import('./settings/AIModelSettingsTab'));
const CursorSettingsTab = lazy(() => import('./settings/CursorSettingsTab'));

type SettingsTabId = 'general' | 'hero' | 'contact' | 'theme' | 'cursor' | 'copy' | 'font' | 'ai';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingHero, setEditingHero] = useState<string | null>(null);

  const { data: serverConfig, isLoading: loadingQuery, refetch } = useSiteSettings();
  const saveSiteConfig = useSaveSiteConfig();

  useEffect(() => {
    if (serverConfig) {
      setConfig({ ...defaultSiteConfig, ...serverConfig });
      localStorage.setItem('site_config', JSON.stringify(serverConfig));
      localStorage.setItem('site_config_ts', String(Date.now()));
    }
  }, [serverConfig]);

  const loading = loadingQuery;
  const saving = saveSiteConfig.isPending;

  const saveConfig = async () => {
    try {
      await saveSiteConfig.mutateAsync(config);
      localStorage.setItem('site_config', JSON.stringify(config));
      localStorage.setItem('site_config_ts', String(Date.now()));
      setMessage({ type: 'success', text: '设置已保存到服务器！所有设备将同步更新' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      const text = err instanceof Error ? err.message : '保存失败，请检查网络连接';
      setMessage({ type: 'error', text });
    }
  };

  const updateConfig = (path: string, value: unknown) => {
    setConfig((prev) => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: Record<string, unknown> = newConfig as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newConfig as SiteConfig;
    });
  };

  const updateHeroContent = (heroId: string, lang: 'ZH' | 'EN', field: string, value: string) => {
    const contentKey = lang === 'ZH' ? 'contentZH' : 'contentEN';
    setConfig((prev) => ({
      ...prev,
      heroBackgrounds: prev.heroBackgrounds.map((h) => {
        if (h.id !== heroId) return h;
        const prevContent = h[contentKey];
        return {
          ...h,
          [contentKey]: { ...prevContent, [field]: value },
        };
      }),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const tabProps = { config, updateConfig };

  return (
    <div className="space-y-6">
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

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 flex-wrap">
          {(
            [
              { id: 'general', label: '基本信息', icon: Globe },
              { id: 'hero', label: 'Hero 背景', icon: Image },
              { id: 'contact', label: '联系方式', icon: Mail },
              { id: 'theme', label: '主题设置', icon: Layout },
              { id: 'cursor', label: '鼠标光标', icon: MousePointer2 },
              { id: 'font', label: '字体设置', icon: Type },
              { id: 'ai', label: 'AI 模型', icon: Brain },
              { id: 'copy', label: '页面文案', icon: FileText },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'general' && <GeneralSettingsTab {...tabProps} />}
            {activeTab === 'hero' && (
              <HeroSettingsTab
                {...tabProps}
                editingHero={editingHero}
                setEditingHero={setEditingHero}
                updateHeroContent={updateHeroContent}
                setConfig={setConfig}
              />
            )}
            {activeTab === 'contact' && <ContactSettingsTab {...tabProps} />}
            {activeTab === 'theme' && <ThemeSettingsTab {...tabProps} />}
            {activeTab === 'cursor' && <CursorSettingsTab {...tabProps} />}
            {activeTab === 'font' && <FontSettingsTab {...tabProps} />}
            {activeTab === 'ai' && <AIModelSettingsTab {...tabProps} />}
            {activeTab === 'copy' && <CopySettingsTab {...tabProps} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
