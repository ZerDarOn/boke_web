import React, { useState } from 'react';
import AboutFileExplorer from '../components/AboutFileExplorer';
import { TRANSLATIONS } from '../constants';
import { Mail, Github, Video, MessageCircle, Copy, Check } from 'lucide-react';
import { usePageCopy } from '../hooks/useSiteConfig';

const About: React.FC = () => {
  const lang = 'ZH' as 'EN' | 'ZH';
  const t = TRANSLATIONS[lang];
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const pageCopy = usePageCopy();

  const contactInfo = [
    {
      type: 'email',
      label: lang === 'EN' ? 'Email' : '邮箱',
      value: '1500507371@qq.com',
      icon: Mail,
      action: () => {
        navigator.clipboard.writeText('1500507371@qq.com');
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }
    },
    {
      type: 'github',
      label: 'GitHub',
      value: 'github.com/ZerDarOn',
      icon: Github,
      action: () => window.open('https://github.com/ZerDarOn', '_blank')
    },
    {
      type: 'bilibili',
      label: lang === 'EN' ? 'Bilibili' : 'B站',
      value: lang === 'EN' ? 'Not Set' : '未设置',
      icon: Video,
      action: () => {} // 等提供 UID 后替换
    },
    {
      type: 'wechat',
      label: 'WeChat',
      value: lang === 'EN' ? 'Scan QR Code' : '扫描二维码',
      icon: MessageCircle,
      action: () => {
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">
        / {t.ABOUT}.SYSTEM
        <div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div>
      </h2>
      <AboutFileExplorer />

      {/* 联系方式 */}
      <div className="mt-4">
        <h3 className="text-xl font-serif font-bold text-ink dark:text-white mb-6 flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-white/10">
          <span className="w-8 h-8 bg-neon/10 rounded-lg flex items-center justify-center">
            <Mail size={18} className="text-neon" />
          </span>
          {pageCopy.aboutContactTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                disabled={item.type === 'wechat'}
                className={`group relative p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl hover:border-neon hover:shadow-lg hover:shadow-neon/10 transition-all duration-300 ${
                  item.type === 'wechat' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {item.type === 'email' && copyStatus === 'copied' && (
                  <div className="absolute top-2 right-2 text-neon">
                    <Check size={16} />
                  </div>
                )}
                <Icon size={24} className="text-neon mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">{item.label}</p>
                <p className="text-sm text-ink dark:text-white font-medium truncate">{item.value}</p>
                {item.type === 'email' && copyStatus === 'idle' && (
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={14} className="text-gray-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 font-mono text-center">
          {pageCopy.aboutContactCopyTip}
        </p>
      </div>
    </div>
  );
};

export default About;
