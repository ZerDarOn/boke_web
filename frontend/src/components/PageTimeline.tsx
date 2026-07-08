import React, { useState } from 'react';
import { Disc, Radio, MapPin, Briefcase, Trophy, Flag, GitCommit, LayoutList, FileText, Loader2, Code, Star, Globe, Zap, Heart } from 'lucide-react';
import type { TimelineEvent, CurrentStatus, HistoryItem } from '../lib/api';
import { useTimelineList } from '../hooks/queries/timeline';
import { useActiveCurrentStatus } from '../hooks/queries/current-status';
import { useActiveHistoryItems } from '../hooks/queries/history';

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  FileText,
  Briefcase,
  Code,
  Star,
  Trophy,
  Globe,
  Zap,
  Heart,
};



const PageTimeline: React.FC = () => {
  const [viewMode, setViewMode] = useState<'timeline' | 'history'>('timeline');
  const { data: events = [], isLoading: timelineLoading, error: timelineError } = useTimelineList({ limit: 500 });
  const { data: currentStatus = null, isLoading: statusLoading } = useActiveCurrentStatus();
  const { data: historyItems = [], isLoading: historyLoading } = useActiveHistoryItems();
  const loading = timelineLoading || statusLoading || historyLoading;
  const error = timelineError?.message ?? null;

  return (
    <div className="w-full bg-white dark:bg-ink p-6 md:p-12 min-h-[800px] flex flex-col items-center relative">
      {loading && (
        <div className="flex items-center justify-center w-full min-h-[600px]">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      )}
      
      {error && (
        <div className="w-full max-w-3xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-300 font-mono text-sm">
              ERROR: {error}
            </p>
          </div>
        </div>
      )}
      
      {!loading && !error && (
        <>
        {/* View Toggle */}
        <div className="absolute top-12 right-12 z-50 bg-white dark:bg-ink border border-gray-200 dark:border-white/10 rounded p-1 flex gap-1 shadow-lg">
             <button 
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded transition-colors ${viewMode === 'timeline' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-gray-400 hover:text-ink'}`}
             >
                 <GitCommit size={18} className="rotate-90" />
             </button>
             <button 
                onClick={() => setViewMode('history')}
                className={`p-2 rounded transition-colors ${viewMode === 'history' ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-gray-400 hover:text-ink'}`}
             >
                 <FileText size={18} />
             </button>
        </div>

        {viewMode === 'timeline' ? (
        <>
            {/* 1. Header: Current Status (Top Entry) - 仅在有数据时显示 */}
            {currentStatus && (
            <div className="w-full max-w-3xl mb-24 relative z-10">
                <div className="relative bg-ink text-white p-8 rounded-sm shadow-xl overflow-hidden group">
                    {/* Pulsing Border Effect */}
                    <div className="absolute inset-0 border-2 border-neon opacity-50 animate-pulse rounded-sm pointer-events-none"></div>
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon opacity-10 blur-3xl rounded-full"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Radio size={16} className="text-neon animate-pulse" />
                                <h3 className="font-mono text-xs text-neon tracking-[0.2em] uppercase">Current Status</h3>
                            </div>
                            <h2 className="text-3xl font-black font-sans mb-4">
                                {currentStatus.title}
                            </h2>

                            <div className="flex flex-col gap-2 font-mono text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={12} /> CURRENT_FOCUS: {currentStatus.currentFocus}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} /> LOCATION: {currentStatus.location}
                                </div>
                                <div className="flex items-center gap-2 text-neon">
                                    <Disc size={12} /> VIBE: {currentStatus.vibe}
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block text-right">
                            <div className="font-black text-6xl text-white/5 font-sans">NOW</div>
                        </div>
                    </div>
                </div>

                {/* Connector Line to main timeline */}
                <div className="absolute left-1/2 bottom-[-96px] w-[2px] h-24 bg-gradient-to-b from-neon to-ink transform -translate-x-1/2 z-0"></div>
            </div>
            )}

                 {/* 2. Main Timeline (History) */}
                 {events.length > 0 ? (
                   <div className="relative w-full max-w-3xl flex flex-col gap-12">
                   
                   {/* Central Axis */}
                   <div className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-[2px] bg-ink dark:bg-white/20 transform md:-translate-x-1/2 opacity-20"></div>
 
                   {events.map((event, index) => {
                       const isLeft = index % 2 === 0;
                       
                       // Icon selection
                       let Icon = Disc;
                       if (event.type === 'JOB') Icon = Briefcase;
                       if (event.type === 'MILESTONE') Icon = Trophy;
                       if (event.type === 'LIFE') Icon = Flag;
 
                       return (
                           <div key={event.id} className={`flex flex-col md:flex-row items-center w-full group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                               
                               {/* Empty Space */}
                               <div className="hidden md:block md:w-1/2"></div>
                               
                               {/* Axis Node */}
                               <div className="absolute left-[12px] md:left-1/2 transform md:-translate-x-1/2 z-10 bg-white dark:bg-black p-1 rounded-full border border-gray-200 dark:border-white/20 group-hover:border-neon transition-colors">
                                   <div className={`w-3 h-3 rounded-full ${event.type === 'JOB' ? 'bg-blue-500' : event.type === 'MILESTONE' ? 'bg-neon' : 'bg-ink dark:bg-white'}`}></div>
                               </div>
 
                               {/* Content Card */}
                               <div className={`w-full md:w-1/2 pl-10 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                                   <div className="bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 p-5 border border-transparent hover:border-gray-200 dark:hover:border-white/20 hover:shadow-lg transition-all duration-300 rounded-lg relative">
                                       <div className={`font-mono text-xs font-bold text-gray-400 mb-1 flex items-center gap-2 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                                           <span>{event.year}</span>
                                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                           <span className="text-neon">{event.date}</span>
                                       </div>
                                       <h3 className="text-lg font-bold font-sans text-ink dark:text-white mb-2">{event.title}</h3>
                                       <p className="font-serif text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                           {event.description}
                                       </p>
                                       
                                       {/* Type Icon bg decoration */}
                                       <div className={`absolute -right-2 -bottom-2 opacity-5 text-ink dark:text-white rotate-12 ${isLeft ? 'md:right-auto md:-left-2' : ''}`}>
                                           <Icon size={48} />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       );
                   })}
                   </div>
                 ) : (
                   <div className="flex items-center justify-center w-full p-12 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                     <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                       暂无时间线事件
                     </span>
                   </div>
                 )}
         </>
        ) : (
            /* History View Mode - 从 API 获取数据 */
            <div className="w-full max-w-4xl pt-12">
                <div className="flex items-center gap-3 border-l-4 border-[#f97316] pl-6 mb-16">
                    <h2 className="text-4xl font-black font-sans text-ink dark:text-white">历史</h2>
                </div>

                {historyItems.length > 0 ? (
                <div className="relative pl-8 md:pl-16 border-l border-gray-200 dark:border-gray-800 space-y-12">
                    {historyItems.map((item, idx) => {
                        const IconComponent = iconMap[item.icon] || FileText;
                        return (
                            <div key={item.id} className="relative group">
                                {/* Node on Line */}
                                <div className="absolute -left-[45px] md:-left-[77px] top-0">
                                    <div 
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: item.color || '#a855f7' }}
                                    >
                                        <IconComponent size={18} />
                                    </div>
                                </div>

                                {/* Card */}
                                <div className="bg-[#1a1919] border border-white/5 p-6 rounded-2xl hover:border-white/20 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-gray-400 font-mono text-sm">{item.date}</span>
                                        <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-gray-300 border border-white/5">项目经历</span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6">{item.role}</p>

                                    <p className="text-gray-300 mb-6 leading-relaxed font-serif">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-6">
                                        <span>持续时间: {item.duration}</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={10} className="text-[#f43f5e]" /> {item.location}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {item.tags?.map((tag, tagIdx) => (
                                            <span 
                                                key={tagIdx} 
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2d3748] text-[#93c5fd] hover:bg-[#3b82f6] hover:text-white transition-colors"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                ) : (
                  <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mb-2">
                        暂无历史项目
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">
                        请在后台管理中添加历史项目
                      </p>
                    </div>
                  </div>
                )}
            </div>
        )}
  
          {/* End Cap */}
          {viewMode === 'timeline' && events.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-2">
                  <div className="w-2 h-2 bg-ink dark:bg-white rounded-full"></div>
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Origin Point</span>
              </div>
          )}
        </>
      )}
    </div>
   );
};

export default PageTimeline;