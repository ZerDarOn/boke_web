import React from 'react';
import { Bell, Activity, Rss, ArrowRight, Copy, CheckCircle2, Circle } from 'lucide-react';
import { LATEST_ACTIVITIES } from '../constants';

const RightSidebar: React.FC = () => {
  return (
    <aside className="hidden xl:flex flex-col gap-6 w-72 flex-shrink-0 sticky top-24 h-fit z-20">
      
      {/* 1. Announcement */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-[4px_4px_0px_rgba(10,10,10,0.1)] dark:shadow-none relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-neon"></div>
        <h4 className="font-sans font-bold text-lg text-ink dark:text-white mb-2 flex items-center gap-2">
            <Bell size={18} className="text-neon fill-neon/20" />
            公告
        </h4>
        <p className="font-serif text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 现已上线，包含全新的夜间模式和水墨渲染引擎。
        </p>
        <button className="w-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-xs py-2 rounded transition-colors flex items-center justify-center gap-1">
            了解更多 <ArrowRight size={12} />
        </button>
      </div>

      {/* 2. Latest Activities */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm transition-colors">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
            <Activity size={14} className="text-neon" />
            最新动态
        </h4>
        <div className="space-y-4">
            {LATEST_ACTIVITIES.map((item, idx) => (
                <div key={item.id} className="relative pl-4 pb-2">
                    {/* Timeline Line */}
                    {idx !== LATEST_ACTIVITIES.length - 1 && (
                        <div className="absolute left-[5px] top-2 h-full w-[1px] bg-gray-200 dark:bg-white/10"></div>
                    )}
                    {/* Dot */}
                    <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 ${item.status === 'DONE' ? 'bg-neon border-neon' : 'bg-white dark:bg-[#1a1a1a] border-blue-400'}`}></div>
                    
                    {/* Content */}
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-xs text-ink dark:text-gray-200">{item.project}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.status === 'PLANNING' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                {item.status === 'PLANNING' ? '计划中' : '已完成'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.title}</p>
                        <div className="flex flex-wrap gap-1">
                            {item.tags.map(t => (
                                <span key={t} className="text-[9px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 3. RSS Subscription */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm transition-colors">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2">
            <Rss size={14} className="text-orange-500" />
            RSS 订阅
        </h4>
        <p className="font-mono text-[10px] text-gray-400 mb-3">
            订阅 RSS 源，及时获取最新文章更新
        </p>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded p-1.5">
            <input 
                type="text" 
                value="https://ink.spirit/rss" 
                readOnly 
                className="bg-transparent text-[10px] text-gray-600 dark:text-gray-300 w-full outline-none font-mono"
            />
            <button className="bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-1.5 rounded transition-colors" title="Copy">
                <Copy size={12} />
            </button>
        </div>
      </div>

    </aside>
  );
};

export default RightSidebar;